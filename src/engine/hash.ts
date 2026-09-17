import { HashNode, HeapRecord } from '../types';

/**
 * Prime sequence for dynamic bucket resizing
 */
export const PRIME_CAPACITIES = [7, 17, 37, 79, 163, 331, 673, 1361, 2729, 5471];

/**
 * Classic djb2 hash function by Dan Bernstein:
 * hash = ((hash << 5) + hash) + c  (i.e., hash * 33 + c)
 */
export function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xffffffff; // 32-bit integer conversion
  }
  return Math.abs(hash);
}

/**
 * Detailed step-by-step breakdown of djb2 calculation for educational inspection
 */
export function getDjb2StepTrace(str: string, capacity: number) {
  let hash = 5381;
  const steps: { char: string; ascii: number; prevHash: number; newHash: number; formula: string }[] = [];
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const ascii = str.charCodeAt(i);
    const prevHash = hash;
    hash = ((hash << 5) + hash) + ascii;
    hash = hash & 0xffffffff;
    const unsignedHash = Math.abs(hash);
    steps.push({
      char,
      ascii,
      prevHash: Math.abs(prevHash),
      newHash: unsignedHash,
      formula: `(${Math.abs(prevHash)} × 33) + ${ascii} = ${unsignedHash}`,
    });
  }

  const finalHash = Math.abs(hash);
  const targetBucket = finalHash % capacity;

  return {
    rawHash: finalHash,
    targetBucket,
    capacity,
    steps,
  };
}

export class HashTable {
  buckets: (HashNode | null)[];
  capacity: number;
  size: number;
  loadFactorThreshold: number;
  rehashCount: number;

  constructor(initialCapacity = 7, loadFactorThreshold = 0.75) {
    this.capacity = initialCapacity;
    this.buckets = new Array(this.capacity).fill(null);
    this.size = 0;
    this.loadFactorThreshold = loadFactorThreshold;
    this.rehashCount = 0;
  }

  get loadFactor(): number {
    return this.capacity > 0 ? this.size / this.capacity : 0;
  }

  get nextPrimeCapacity(): number {
    const next = PRIME_CAPACITIES.find((p) => p > this.capacity);
    return next || this.capacity * 2 + 1;
  }

  /**
   * Look up roll number in O(1) average time
   */
  get(key: string): { node: HashNode | null; stepsChecked: number; bucketIndex: number; hashValue: number } {
    const hashValue = djb2(key);
    const bucketIndex = hashValue % this.capacity;
    let curr = this.buckets[bucketIndex];
    let stepsChecked = 0;

    while (curr) {
      stepsChecked++;
      if (curr.key === key) {
        return { node: curr, stepsChecked, bucketIndex, hashValue };
      }
      curr = curr.next;
    }

    return { node: null, stepsChecked, bucketIndex, hashValue };
  }

  /**
   * Insert record into hash table using separate chaining
   */
  insert(
    key: string,
    studentRef: HeapRecord
  ): {
    node: HashNode;
    didRehash: boolean;
    oldCapacity?: number;
    newCapacity?: number;
    steps: number;
  } {
    const hashValue = djb2(key);
    const bucketIndex = hashValue % this.capacity;

    // Check if key already exists (update existing)
    let curr = this.buckets[bucketIndex];
    let steps = 0;
    while (curr) {
      steps++;
      if (curr.key === key) {
        curr.studentRef = studentRef;
        curr.heapAddress = studentRef.address;
        return { node: curr, didRehash: false, steps };
      }
      curr = curr.next;
    }

    // New node insertion at head of chain (O(1))
    const newNode: HashNode = {
      key,
      heapAddress: studentRef.address,
      studentRef,
      next: this.buckets[bucketIndex],
      hashValue,
      bucketIndex,
    };

    this.buckets[bucketIndex] = newNode;
    this.size++;

    // Check dynamic rehashing threshold (alpha > 0.75)
    let didRehash = false;
    let oldCapacity: number | undefined;
    let newCapacity: number | undefined;

    if (this.loadFactor > this.loadFactorThreshold) {
      oldCapacity = this.capacity;
      newCapacity = this.nextPrimeCapacity;
      this.rehash(newCapacity);
      didRehash = true;
    }

    return {
      node: newNode,
      didRehash,
      oldCapacity,
      newCapacity,
      steps: steps + 1,
    };
  }

  /**
   * Remove key from hash table
   */
  remove(key: string): { removedNode: HashNode | null; stepsChecked: number; bucketIndex: number } {
    const hashValue = djb2(key);
    const bucketIndex = hashValue % this.capacity;
    let curr = this.buckets[bucketIndex];
    let prev: HashNode | null = null;
    let stepsChecked = 0;

    while (curr) {
      stepsChecked++;
      if (curr.key === key) {
        if (prev) {
          prev.next = curr.next;
        } else {
          this.buckets[bucketIndex] = curr.next;
        }
        this.size--;
        return { removedNode: curr, stepsChecked, bucketIndex };
      }
      prev = curr;
      curr = curr.next;
    }

    return { removedNode: null, stepsChecked, bucketIndex };
  }

  /**
   * Dynamic Rehashing:
   * Notice that only 8-byte smart pointers are redistributed across new buckets!
   * The underlying HeapRecord addresses in heap memory stay 100% stable.
   */
  rehash(newCapacity: number): { oldCap: number; newCap: number; migratedPtrCount: number } {
    const oldCap = this.capacity;
    const oldBuckets = this.buckets;

    this.capacity = newCapacity;
    this.buckets = new Array(newCapacity).fill(null);
    let migratedPtrCount = 0;

    for (let i = 0; i < oldBuckets.length; i++) {
      let curr = oldBuckets[i];
      while (curr) {
        const next = curr.next;
        const newHash = djb2(curr.key);
        const newBucket = newHash % this.capacity;

        // Repoint node into new bucket chain
        curr.next = this.buckets[newBucket];
        curr.bucketIndex = newBucket;
        this.buckets[newBucket] = curr;

        migratedPtrCount++;
        curr = next;
      }
    }

    this.rehashCount++;
    return { oldCap, newCap: newCapacity, migratedPtrCount };
  }

  /**
   * Stats for visualization
   */
  getStats() {
    let collisionCount = 0;
    let maxChainLength = 0;

    for (const head of this.buckets) {
      let length = 0;
      let curr = head;
      while (curr) {
        length++;
        curr = curr.next;
      }
      if (length > 1) {
        collisionCount += length - 1;
      }
      if (length > maxChainLength) {
        maxChainLength = length;
      }
    }

    return {
      size: this.size,
      capacity: this.capacity,
      loadFactor: this.loadFactor,
      collisionCount,
      maxChainLength,
      rehashCount: this.rehashCount,
    };
  }
}
