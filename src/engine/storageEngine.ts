import { EngineLog, EngineStats, HeapRecord, QueryPlan, Student } from '../types';
import { HashTable } from './hash';
import { HeapMemoryManager } from './heap';
import { RedBlackTree } from './rbTree';

export class StorageEngine {
  heap: HeapMemoryManager;
  primaryIndex: HashTable;
  secondaryIndex: RedBlackTree;
  logs: EngineLog[];
  lastPlan: QueryPlan | null = null;
  lastActiveRollNo: string | null = null;
  lastHighlightedNodeIds: string[] = [];

  constructor() {
    this.heap = new HeapMemoryManager();
    this.primaryIndex = new HashTable(7, 0.75);
    this.secondaryIndex = new RedBlackTree();
    this.logs = [];
  }

  private addLog(
    category: EngineLog['category'],
    message: string,
    details?: string,
    level: EngineLog['level'] = 'info'
  ) {
    const log: EngineLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 }),
      category,
      message,
      details,
      level,
    };
    this.logs.unshift(log);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }

  /**
   * INSERT: Allocates heap tuple once, indexes smart pointer in Hash Table and RB Tree
   */
  insert(student: Student): { record: HeapRecord; didRehash: boolean; plan: QueryPlan } {
    const startTime = performance.now();
    this.lastActiveRollNo = student.rollNo;
    this.lastHighlightedNodeIds = [];

    // Step 1: Allocate on heap
    const record = this.heap.allocate(student);
    this.addLog(
      'HEAP',
      `Allocated Student('${student.rollNo}') on Heap at ${record.address}`,
      `Size: ${record.sizeBytes} bytes. use_count initially 0.`,
      'info'
    );

    // Step 2: Index in primary hash table
    const hashResult = this.primaryIndex.insert(student.rollNo, record);
    this.heap.addRef(record.address); // use_count -> 1
    this.addLog(
      'HASH_INDEX',
      `Primary Hash Index: Inserted '${student.rollNo}' into bucket [${hashResult.node.bucketIndex}]`,
      `djb2 hash: ${hashResult.node.hashValue}. use_count incremented to ${record.refCount}.`,
      'accent'
    );

    // Dynamic Rehashing check
    if (hashResult.didRehash) {
      this.addLog(
        'REHASH',
        `DYNAMIC REHASH TRIGGERED: Load factor exceeded 0.75! Resized ${hashResult.oldCapacity} -> ${hashResult.newCapacity}`,
        `Zero-Cost Guarantee: Only 8-byte smart pointers migrated across buckets. Heap addresses (${record.address}) and Secondary BST index remained 100% stable with ZERO reconstruction cost!`,
        'warn'
      );
    }

    // Step 3: Index in secondary Red-Black tree
    const rbResult = this.secondaryIndex.insert(record);
    this.heap.addRef(record.address); // use_count -> 2
    this.addLog(
      'RB_TREE',
      `Secondary CGPA Index: Inserted ${student.cgpa} into ${rbResult.node.color} node (${rbResult.node.id})`,
      `Tree depth: ${this.secondaryIndex.getDepth()}. use_count incremented to ${record.refCount}.`,
      'accent'
    );

    const execTime = (performance.now() - startTime) * 1000;
    const plan: QueryPlan = {
      queryType: 'INSERT',
      sql: `INSERT INTO students (roll_no, name, dept, cgpa) VALUES ('${student.rollNo}', '${student.name}', '${student.department}', ${student.cgpa});`,
      accessMethod: 'HASH_INDEX_SCAN',
      theoreticalComplexity: 'O(1) Heap Alloc + O(1) Hash Insert + O(log N) BST Insert',
      recordsExamined: 1,
      recordsReturned: 1,
      heapAllocations: 1,
      secondaryIndexUpdates: 1,
      executionTimeUs: Math.round(execTime),
      executionSteps: [
        `1. HeapMemoryManager::allocate() -> Pinned memory address ${record.address}`,
        `2. HashTable::insert('${student.rollNo}') -> Bucket [${hashResult.node.bucketIndex}] (djb2 hash: ${hashResult.node.hashValue})`,
        hashResult.didRehash
          ? `3. Dynamic prime rehash triggered (${hashResult.oldCapacity} -> ${hashResult.newCapacity}). Pointer migration without touching heap addresses.`
          : `3. Load factor check: α = ${this.primaryIndex.loadFactor.toFixed(2)} <= 0.75 (No rehash needed)`,
        `4. RedBlackTree::insert(${student.cgpa}) -> Red-Black node balanced (use_count = 2)`,
      ],
    };

    this.lastPlan = plan;
    return { record, didRehash: hashResult.didRehash, plan };
  }

  /**
   * PRIMARY KEY LOOKUP: Constant-time O(1) lookup via djb2 hash index
   */
  findByRollNo(rollNo: string): { record: HeapRecord | null; plan: QueryPlan } {
    const startTime = performance.now();
    this.lastActiveRollNo = rollNo;
    this.lastHighlightedNodeIds = [];

    const { node, stepsChecked, bucketIndex, hashValue } = this.primaryIndex.get(rollNo);
    const record = node ? node.studentRef : null;

    if (record) {
      this.addLog(
        'QUERY',
        `PK Lookup '${rollNo}' succeeded in bucket [${bucketIndex}] in ${stepsChecked} step(s)`,
        `Direct heap pointer dereference to address ${record.address}. Name: ${record.data.name}, CGPA: ${record.data.cgpa}.`,
        'success'
      );
    } else {
      this.addLog('QUERY', `PK Lookup '${rollNo}' failed: not found in bucket [${bucketIndex}]`, undefined, 'warn');
    }

    const execTime = (performance.now() - startTime) * 1000;
    const plan: QueryPlan = {
      queryType: 'PK_LOOKUP',
      sql: `SELECT * FROM students WHERE roll_no = '${rollNo}';`,
      accessMethod: 'HASH_INDEX_SCAN',
      theoreticalComplexity: 'O(1) Average Time (Separate Chaining)',
      recordsExamined: stepsChecked,
      recordsReturned: record ? 1 : 0,
      heapAllocations: 0,
      secondaryIndexUpdates: 0,
      executionTimeUs: Math.round(execTime),
      executionSteps: [
        `1. Computed djb2("${rollNo}") = ${hashValue}`,
        `2. Modulo index: ${hashValue} % ${this.primaryIndex.capacity} = Bucket [${bucketIndex}]`,
        `3. Traversed separate chain list: checked ${stepsChecked} node(s)`,
        record ? `4. Found matching key -> Dereferenced pointer ${record.address}` : `4. End of bucket chain -> Record not found`,
      ],
    };

    this.lastPlan = plan;
    return { record, plan };
  }

  /**
   * RANGE QUERY: O(K + log N) analytical range scan over ordered Red-Black Tree
   * Notice: Fulfills the query entirely from pointers in the multimap without scanning the hash table!
   */
  queryCgpaRange(minCgpa: number, maxCgpa: number): { results: HeapRecord[]; plan: QueryPlan } {
    const startTime = performance.now();
    this.lastActiveRollNo = null;

    const { results, nodesVisited, traversedNodeIds, theoreticalCost } = this.secondaryIndex.rangeQuery(
      minCgpa,
      maxCgpa
    );

    this.lastHighlightedNodeIds = traversedNodeIds;

    const totalRecords = this.heap.records.size;
    const avoidedScans = Math.max(0, totalRecords - nodesVisited);

    this.addLog(
      'QUERY',
      `INDEX-ONLY SCAN: Found ${results.length} student(s) with CGPA in [${minCgpa}, ${maxCgpa}]`,
      `Traversed ${nodesVisited} tree nodes (Cost: ${theoreticalCost}). Avoided ${avoidedScans} sequential table scans!`,
      'success'
    );

    const execTime = (performance.now() - startTime) * 1000;
    const plan: QueryPlan = {
      queryType: 'RANGE_SCAN',
      sql: `SELECT * FROM students WHERE cgpa >= ${minCgpa} AND cgpa <= ${maxCgpa} ORDER BY cgpa DESC;`,
      accessMethod: 'INDEX_RANGE_SCAN',
      theoreticalComplexity: theoreticalCost,
      recordsExamined: nodesVisited,
      recordsReturned: results.length,
      heapAllocations: 0,
      secondaryIndexUpdates: 0,
      executionTimeUs: Math.round(execTime),
      executionSteps: [
        `1. Index-Only Scan initiated on idx_student_cgpa (Red-Black multimap)`,
        `2. Located tree boundary nodes using binary search in O(log N)`,
        `3. In-order descending traversal scanned ${nodesVisited} tree node(s)`,
        `4. Gathered ${results.length} pinned heap pointer(s) directly from multimap nodes`,
        `5. Comparison vs Sequential Scan: Saved reading ${avoidedScans} unrelated heap tuples!`,
      ],
    };

    this.lastPlan = plan;
    return { results, plan };
  }

  /**
   * UPDATE (with Heap-Only Tuple HOT Optimization):
   * If non-indexed attribute (name, dept) is modified:
   *   -> In-place O(1) heap update. Zero secondary index modifications!
   * If indexed attribute (cgpa) is modified:
   *   -> Surgical O(log N) tree removal via equal_range() and re-insertion.
   */
  update(
    rollNo: string,
    updates: { name?: string; department?: string; cgpa?: number }
  ): { record: HeapRecord | null; isHot: boolean; plan: QueryPlan } {
    const startTime = performance.now();
    this.lastActiveRollNo = rollNo;
    this.lastHighlightedNodeIds = [];

    const { node } = this.primaryIndex.get(rollNo);
    if (!node) {
      this.addLog('QUERY', `Update failed: Roll no '${rollNo}' does not exist.`, undefined, 'warn');
      const plan: QueryPlan = {
        queryType: 'HOT_UPDATE',
        sql: `UPDATE students SET ... WHERE roll_no = '${rollNo}';`,
        accessMethod: 'HASH_INDEX_SCAN',
        theoreticalComplexity: 'O(1)',
        recordsExamined: 1,
        recordsReturned: 0,
        heapAllocations: 0,
        secondaryIndexUpdates: 0,
        executionTimeUs: 0,
        executionSteps: [`Record with roll no '${rollNo}' not found`],
      };
      return { record: null, isHot: false, plan };
    }

    const record = node.studentRef;
    const oldCgpa = record.data.cgpa;
    const isCgpaChanged = updates.cgpa !== undefined && Math.abs(updates.cgpa - oldCgpa) > 0.001;

    let isHot = false;
    let secondaryIndexUpdates = 0;
    const executionSteps: string[] = [
      `1. HashTable::get('${rollNo}') located heap record at ${record.address} in O(1)`,
    ];

    if (!isCgpaChanged) {
      // HEAP-ONLY TUPLE (HOT) OPTIMIZATION: In-place update of non-indexed attributes
      isHot = true;
      const field = updates.name !== undefined ? 'name' : 'department';
      this.heap.updateInPlace(record.address, updates, field);

      this.addLog(
        'HOT_OPTIMIZATION',
        `⚡ HEAP-ONLY TUPLE (HOT) UPDATE on '${rollNo}' at ${record.address}`,
        `Updated non-indexed attribute (${field}) directly in-place. Secondary index (idx_student_cgpa) required 0 writes! Cost: O(1).`,
        'success'
      );

      executionSteps.push(`2. HOT Optimization verified: attribute change does not affect secondary index (idx_student_cgpa)`);
      executionSteps.push(`3. In-place heap memory update at ${record.address} (0 tree rotations, 0 secondary writes)`);
    } else {
      // NON-HOT UPDATE: CGPA indexed attribute changed!
      isHot = false;
      secondaryIndexUpdates = 1;

      // 1. Surgical removal from Red-Black tree
      this.secondaryIndex.removeStudent(oldCgpa, record.address);

      // 2. In-place update heap record
      this.heap.updateInPlace(record.address, updates, 'cgpa');

      // 3. Re-insert into Red-Black tree with new CGPA
      const newRbNode = this.secondaryIndex.insert(record);

      this.addLog(
        'HOT_OPTIMIZATION',
        `NON-HOT UPDATE on '${rollNo}': CGPA modified ${oldCgpa} -> ${updates.cgpa}`,
        `Indexed attribute changed! Surgically deleted old node from Red-Black Tree via equal_range() and re-inserted into node (${newRbNode.node.id}). Cost: O(log N).`,
        'accent'
      );

      executionSteps.push(`2. Indexed attribute (CGPA) modified from ${oldCgpa} to ${updates.cgpa}`);
      executionSteps.push(`3. Surgical Red-Black Tree equal_range() lookup and removal of old key in O(log N)`);
      executionSteps.push(`4. Red-Black Tree re-insertion of new key with balancing in O(log N)`);
      executionSteps.push(`5. Pinned heap address ${record.address} maintained without full-index invalidation`);
    }

    const execTime = (performance.now() - startTime) * 1000;
    const plan: QueryPlan = {
      queryType: isHot ? 'HOT_UPDATE' : 'NON_HOT_UPDATE',
      sql: `UPDATE students SET ${Object.entries(updates)
        .map(([k, v]) => `${k} = ${typeof v === 'string' ? `'${v}'` : v}`)
        .join(', ')} WHERE roll_no = '${rollNo}';`,
      accessMethod: 'HASH_INDEX_SCAN',
      theoreticalComplexity: isHot ? 'O(1) In-Place HOT Mutation' : 'O(log N) Surgical Tree Re-indexing',
      recordsExamined: 1,
      recordsReturned: 1,
      heapAllocations: 0,
      secondaryIndexUpdates,
      executionTimeUs: Math.round(execTime),
      executionSteps,
    };

    this.lastPlan = plan;
    return { record, isHot, plan };
  }

  /**
   * DELETE: Illustrates Reference Counting (std::shared_ptr) deallocation
   * 1. Remove from Hash Table -> refCount drops 2 -> 1
   * 2. Remove from Red-Black Tree -> refCount drops 1 -> 0
   * 3. When refCount reaches 0 -> Heap record memory is reclaimed!
   */
  delete(rollNo: string): { success: boolean; plan: QueryPlan } {
    const startTime = performance.now();
    this.lastActiveRollNo = null;
    this.lastHighlightedNodeIds = [];

    const { node } = this.primaryIndex.get(rollNo);
    if (!node) {
      this.addLog('QUERY', `Delete failed: '${rollNo}' not found.`, undefined, 'warn');
      const plan: QueryPlan = {
        queryType: 'DELETE',
        sql: `DELETE FROM students WHERE roll_no = '${rollNo}';`,
        accessMethod: 'HASH_INDEX_SCAN',
        theoreticalComplexity: 'O(1)',
        recordsExamined: 1,
        recordsReturned: 0,
        heapAllocations: 0,
        secondaryIndexUpdates: 0,
        executionTimeUs: 0,
        executionSteps: [`Record with roll no '${rollNo}' not found`],
      };
      return { success: false, plan };
    }

    const record = node.studentRef;
    const address = record.address;
    const cgpa = record.data.cgpa;

    // 1. Remove from primary hash index
    this.primaryIndex.remove(rollNo);
    const afterHashRelease = this.heap.releaseRef(address); // refCount -> 1
    this.addLog(
      'HASH_INDEX',
      `Primary Hash Index: Erased '${rollNo}'. Released smart pointer.`,
      `use_count decremented to ${afterHashRelease.remainingRefs}.`,
      'info'
    );

    // 2. Remove from secondary Red-Black tree
    this.secondaryIndex.removeStudent(cgpa, address);
    const afterTreeRelease = this.heap.releaseRef(address); // refCount -> 0 (freed!)
    this.addLog(
      'RB_TREE',
      `Secondary CGPA Index: Surgically erased pointer to '${rollNo}' from tree.`,
      `use_count decremented to ${afterTreeRelease.remainingRefs}.`,
      'info'
    );

    if (afterTreeRelease.freed) {
      this.addLog(
        'HEAP',
        `HEAP MEMORY RECLAIMED: Record at ${address} deleted!`,
        `std::shared_ptr use_count reached 0. Memory block (${record.sizeBytes} bytes) returned to heap pool automatically (Zero Leaks).`,
        'success'
      );
    }

    const execTime = (performance.now() - startTime) * 1000;
    const plan: QueryPlan = {
      queryType: 'DELETE',
      sql: `DELETE FROM students WHERE roll_no = '${rollNo}';`,
      accessMethod: 'HASH_INDEX_SCAN',
      theoreticalComplexity: 'O(1) Hash Erase + O(log N) Tree Erase + O(1) Heap Free',
      recordsExamined: 1,
      recordsReturned: 1,
      heapAllocations: 0,
      secondaryIndexUpdates: 1,
      executionTimeUs: Math.round(execTime),
      executionSteps: [
        `1. Located '${rollNo}' in primary hash table in O(1)`,
        `2. Removed hash chain node and released shared_ptr (use_count: 2 -> 1)`,
        `3. Erased secondary Red-Black tree iterator in O(log N) and released shared_ptr (use_count: 1 -> 0)`,
        `4. RAII / ARC triggered: use_count == 0 -> deallocated memory block ${address}`,
      ],
    };

    this.lastPlan = plan;
    return { success: true, plan };
  }

  /**
   * MANUAL / FORCED REHASH:
   * Explicitly showcases the zero-cost pointer redistribution guarantee.
   */
  forceRehash(targetCapacity?: number) {
    const nextCap = targetCapacity || this.primaryIndex.nextPrimeCapacity;
    const result = this.primaryIndex.rehash(nextCap);

    this.addLog(
      'REHASH',
      `MANUAL REHASH DEMO: Capacity changed ${result.oldCap} -> ${result.newCap}`,
      `Only ${result.migratedPtrCount} 8-byte pointer(s) migrated across new buckets. All heap addresses and the secondary Red-Black tree index remained 100% stable with ZERO reconstruction cost!`,
      'warn'
    );

    return result;
  }

  /**
   * Seed engine with diverse sample student records
   */
  seedSampleData(count = 7) {
    const sampleStudents: Student[] = [
      { rollNo: 'CS21B001', name: 'Alan Turing', department: 'CSE', cgpa: 9.85 },
      { rollNo: 'CS21B004', name: 'Ada Lovelace', department: 'CSE', cgpa: 9.92 },
      { rollNo: 'EC21B012', name: 'Claude Shannon', department: 'ECE', cgpa: 9.65 },
      { rollNo: 'CS21B019', name: 'Grace Hopper', department: 'CSE', cgpa: 9.78 },
      { rollNo: 'ME21B008', name: 'James Watt', department: 'ME', cgpa: 8.45 },
      { rollNo: 'AI21B003', name: 'Geoffrey Hinton', department: 'AI', cgpa: 9.42 },
      { rollNo: 'DS21B015', name: 'John von Neumann', department: 'DS', cgpa: 9.95 },
      { rollNo: 'EC21B022', name: 'Nikola Tesla', department: 'ECE', cgpa: 9.15 },
      { rollNo: 'CS21B031', name: 'Donald Knuth', department: 'CSE', cgpa: 9.72 },
      { rollNo: 'ME21B018', name: 'Henry Ford', department: 'ME', cgpa: 7.82 },
      { rollNo: 'AI21B027', name: 'Yann LeCun', department: 'AI', cgpa: 9.28 },
      { rollNo: 'DS21B033', name: 'Florence Nightingale', department: 'DS', cgpa: 8.92 },
      { rollNo: 'CS21B045', name: 'Barbara Liskov', department: 'CSE', cgpa: 9.60 },
      { rollNo: 'EC21B039', name: 'Hedy Lamarr', department: 'ECE', cgpa: 8.88 },
      { rollNo: 'AI21B040', name: 'Yoshua Bengio', department: 'AI', cgpa: 9.35 },
    ];

    const toInsert = sampleStudents.slice(0, count);
    for (const student of toInsert) {
      this.insert(student);
    }
  }

  /**
   * Reset engine state
   */
  reset() {
    this.heap.clear();
    this.primaryIndex = new HashTable(7, 0.75);
    this.secondaryIndex.clear();
    this.logs = [];
    this.lastPlan = null;
    this.lastActiveRollNo = null;
    this.lastHighlightedNodeIds = [];
    this.addLog('HEAP', 'Engine storage reset to pristine state.', undefined, 'info');
  }

  getStats(): EngineStats {
    const hashStats = this.primaryIndex.getStats();
    return {
      recordCount: this.heap.records.size,
      bucketCapacity: hashStats.capacity,
      loadFactor: hashStats.loadFactor,
      loadFactorThreshold: this.primaryIndex.loadFactorThreshold,
      collisionCount: hashStats.collisionCount,
      maxChainLength: hashStats.maxChainLength,
      treeDepth: this.secondaryIndex.getDepth(),
      blackHeight: this.secondaryIndex.getBlackHeight(),
      totalHeapBytes: this.heap.getTotalBytes(),
      rehashCount: hashStats.rehashCount,
    };
  }
}
