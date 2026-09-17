export interface Student {
  rollNo: string;
  name: string;
  department: string;
  cgpa: number;
}

export interface HeapRecord {
  address: string; // e.g., '0x7ffee14a38'
  data: Student;
  refCount: number; // std::shared_ptr use_count
  allocatedAt: number;
  sizeBytes: number;
  lastUpdatedField?: 'name' | 'department' | 'cgpa' | 'created';
  hotUpdated: boolean;
}

export interface HashNode {
  key: string; // rollNo
  heapAddress: string;
  studentRef: HeapRecord;
  next: HashNode | null;
  hashValue: number;
  bucketIndex: number;
}

export type NodeColor = 'RED' | 'BLACK';

export interface RBTreeNode {
  id: string;
  key: number; // CGPA (secondary index key)
  color: NodeColor;
  studentRefs: HeapRecord[]; // multimap handles duplicate CGPAs
  left: RBTreeNode | null;
  right: RBTreeNode | null;
  parent: RBTreeNode | null;
  // Visual layout coordinates for SVG rendering
  x?: number;
  y?: number;
}

export interface QueryPlan {
  queryType: 'PK_LOOKUP' | 'RANGE_SCAN' | 'HOT_UPDATE' | 'NON_HOT_UPDATE' | 'DELETE' | 'INSERT';
  sql: string;
  accessMethod: 'HASH_INDEX_SCAN' | 'INDEX_RANGE_SCAN' | 'SEQUENTIAL_HEAP_SCAN';
  theoreticalComplexity: string;
  recordsExamined: number;
  recordsReturned: number;
  heapAllocations: number;
  secondaryIndexUpdates: number;
  executionTimeUs: number; // in microseconds
  executionSteps: string[];
}

export interface EngineLog {
  id: string;
  timestamp: string;
  category: 'HEAP' | 'HASH_INDEX' | 'RB_TREE' | 'QUERY' | 'HOT_OPTIMIZATION' | 'REHASH';
  message: string;
  details?: string;
  level: 'info' | 'success' | 'warn' | 'accent';
}

export interface EngineStats {
  recordCount: number;
  bucketCapacity: number;
  loadFactor: number;
  loadFactorThreshold: number;
  collisionCount: number;
  maxChainLength: number;
  treeDepth: number;
  blackHeight: number;
  totalHeapBytes: number;
  rehashCount: number;
}
