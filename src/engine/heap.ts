import { HeapRecord, Student } from '../types';

let addressCounter = 0x7ffe0000;

export function generateHeapAddress(): string {
  addressCounter += 0x48; // 72-byte increments for alignment
  return `0x${addressCounter.toString(16)}`;
}

export class HeapMemoryManager {
  records: Map<string, HeapRecord>; // address -> HeapRecord
  deallocatedHistory: { address: string; rollNo: string; timestamp: number }[];
  totalAllocations: number;
  totalDeallocations: number;

  constructor() {
    this.records = new Map();
    this.deallocatedHistory = [];
    this.totalAllocations = 0;
    this.totalDeallocations = 0;
  }

  /**
   * Allocate student record once on the heap with pinned memory address
   */
  allocate(student: Student): HeapRecord {
    const address = generateHeapAddress();
    const sizeBytes = 8 + 8 + 16 + 32 + 8; // vptr + ptrs + rollNo + name + cgpa ~ 72 bytes

    const record: HeapRecord = {
      address,
      data: { ...student },
      refCount: 0, // starts at 0, incremented as indexes acquire shared_ptr
      allocatedAt: Date.now(),
      sizeBytes,
      lastUpdatedField: 'created',
      hotUpdated: false,
    };

    this.records.set(address, record);
    this.totalAllocations++;
    return record;
  }

  /**
   * Acquire a shared_ptr reference (increments use_count)
   */
  addRef(address: string): number {
    const record = this.records.get(address);
    if (record) {
      record.refCount++;
      return record.refCount;
    }
    return 0;
  }

  /**
   * Release a shared_ptr reference (decrements use_count).
   * When use_count reaches 0, the record is immediately freed (RAII / ARC).
   */
  releaseRef(address: string): { remainingRefs: number; freed: boolean } {
    const record = this.records.get(address);
    if (!record) {
      return { remainingRefs: 0, freed: false };
    }

    record.refCount--;
    if (record.refCount <= 0) {
      this.records.delete(address);
      this.deallocatedHistory.unshift({
        address,
        rollNo: record.data.rollNo,
        timestamp: Date.now(),
      });
      if (this.deallocatedHistory.length > 20) {
        this.deallocatedHistory.pop();
      }
      this.totalDeallocations++;
      return { remainingRefs: 0, freed: true };
    }

    return { remainingRefs: record.refCount, freed: false };
  }

  /**
   * Heap-Only Tuple (HOT) Update:
   * In-place mutation of the record in memory.
   * Preserves address stability without reallocating or touching secondary index!
   */
  updateInPlace(
    address: string,
    updates: Partial<Pick<Student, 'name' | 'department' | 'cgpa'>>,
    field: 'name' | 'department' | 'cgpa'
  ): HeapRecord | null {
    const record = this.records.get(address);
    if (!record) return null;

    record.data = {
      ...record.data,
      ...updates,
    };
    record.lastUpdatedField = field;
    record.hotUpdated = field !== 'cgpa'; // HOT only if non-indexed attribute changed!

    return record;
  }

  getRecord(address: string): HeapRecord | undefined {
    return this.records.get(address);
  }

  getAllRecords(): HeapRecord[] {
    return Array.from(this.records.values());
  }

  getTotalBytes(): number {
    let bytes = 0;
    for (const record of this.records.values()) {
      bytes += record.sizeBytes;
    }
    return bytes;
  }

  clear() {
    this.records.clear();
    this.deallocatedHistory = [];
    this.totalAllocations = 0;
    this.totalDeallocations = 0;
  }
}
