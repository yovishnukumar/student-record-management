import { HeapRecord, NodeColor, RBTreeNode } from '../types';

let nodeIdCounter = 0;

export class RedBlackTree {
  root: RBTreeNode | null = null;
  size: number = 0; // total records in tree
  nodeCount: number = 0; // distinct CGPA key nodes

  /**
   * Insert record into Red-Black Tree (multimap semantics: duplicates share key node)
   */
  insert(studentRef: HeapRecord): { node: RBTreeNode; wasNewNode: boolean; steps: number } {
    const cgpa = Number(studentRef.data.cgpa.toFixed(2));
    let steps = 0;

    // If key already exists in tree, append to studentRefs array (std::multimap equal_range)
    const existing = this.findExactNode(cgpa);
    if (existing) {
      existing.studentRefs.push(studentRef);
      this.size++;
      return { node: existing, wasNewNode: false, steps: 1 };
    }

    // Otherwise create new RB node
    const newNode: RBTreeNode = {
      id: `rb_${++nodeIdCounter}`,
      key: cgpa,
      color: 'RED', // New nodes are always inserted as RED
      studentRefs: [studentRef],
      left: null,
      right: null,
      parent: null,
    };

    let y: RBTreeNode | null = null;
    let x = this.root;

    while (x !== null) {
      steps++;
      y = x;
      if (newNode.key < x.key) {
        x = x.left;
      } else {
        x = x.right;
      }
    }

    newNode.parent = y;
    if (y === null) {
      this.root = newNode;
    } else if (newNode.key < y.key) {
      y.left = newNode;
    } else {
      y.right = newNode;
    }

    this.size++;
    this.nodeCount++;

    this.insertFixup(newNode);
    return { node: newNode, wasNewNode: true, steps };
  }

  /**
   * Red-Black Tree Insertion Fixup (Standard Cormen et al. algorithm)
   */
  private insertFixup(z: RBTreeNode) {
    while (z.parent && z.parent.color === 'RED') {
      if (z.parent === z.parent.parent?.left) {
        const y = z.parent.parent?.right; // Uncle
        if (y && y.color === 'RED') {
          // Case 1: Uncle is RED -> recolor
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          z = z.parent.parent;
        } else {
          // Case 2 & 3: Uncle is BLACK
          if (z === z.parent.right) {
            z = z.parent;
            this.rotateLeft(z);
          }
          if (z.parent) {
            z.parent.color = 'BLACK';
            if (z.parent.parent) {
              z.parent.parent.color = 'RED';
              this.rotateRight(z.parent.parent);
            }
          }
        }
      } else if (z.parent.parent) {
        // Symmetric case: parent is right child of grandparent
        const y = z.parent.parent.left; // Uncle
        if (y && y.color === 'RED') {
          z.parent.color = 'BLACK';
          y.color = 'BLACK';
          z.parent.parent.color = 'RED';
          z = z.parent.parent;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.rotateRight(z);
          }
          if (z.parent) {
            z.parent.color = 'BLACK';
            if (z.parent.parent) {
              z.parent.parent.color = 'RED';
              this.rotateLeft(z.parent.parent);
            }
          }
        }
      }
    }
    if (this.root) {
      this.root.color = 'BLACK';
    }
  }

  private rotateLeft(x: RBTreeNode) {
    const y = x.right;
    if (!y) return;

    x.right = y.left;
    if (y.left) {
      y.left.parent = x;
    }
    y.parent = x.parent;

    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    y.left = x;
    x.parent = y;
  }

  private rotateRight(y: RBTreeNode) {
    const x = y.left;
    if (!x) return;

    y.left = x.right;
    if (x.right) {
      x.right.parent = y;
    }
    x.parent = y.parent;

    if (!y.parent) {
      this.root = x;
    } else if (y === y.parent.right) {
      y.parent.right = x;
    } else {
      y.parent.left = x;
    }

    x.right = y;
    y.parent = x;
  }

  /**
   * Find exact node for a given CGPA
   */
  findExactNode(cgpa: number): RBTreeNode | null {
    const target = Number(cgpa.toFixed(2));
    let curr = this.root;
    while (curr) {
      if (Math.abs(curr.key - target) < 0.001) {
        return curr;
      }
      if (target < curr.key) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }
    return null;
  }

  /**
   * Surgical removal of a specific student from the multimap
   * Uses equal_range(cgpa) to locate node, then removes student from studentRefs.
   * If studentRefs becomes empty, erases the tree node in O(log N).
   */
  removeStudent(cgpa: number, studentAddress: string): { removed: boolean; nodeErased: boolean } {
    const node = this.findExactNode(cgpa);
    if (!node) return { removed: false, nodeErased: false };

    const idx = node.studentRefs.findIndex((s) => s.address === studentAddress);
    if (idx === -1) return { removed: false, nodeErased: false };

    node.studentRefs.splice(idx, 1);
    this.size--;

    if (node.studentRefs.length === 0) {
      this.deleteNode(node);
      this.nodeCount--;
      return { removed: true, nodeErased: true };
    }

    return { removed: true, nodeErased: false };
  }

  /**
   * Delete node from Red-Black tree with rebalancing
   */
  private deleteNode(z: RBTreeNode) {
    let y = z;
    let yOriginalColor = y.color;
    let x: RBTreeNode | null = null;
    let xParent: RBTreeNode | null = null;

    if (!z.left) {
      x = z.right;
      xParent = z.parent;
      this.transplant(z, z.right);
    } else if (!z.right) {
      x = z.left;
      xParent = z.parent;
      this.transplant(z, z.left);
    } else {
      y = this.minimum(z.right);
      yOriginalColor = y.color;
      x = y.right;
      if (y.parent === z) {
        if (x) x.parent = y;
        xParent = y;
      } else {
        xParent = y.parent;
        this.transplant(y, y.right);
        y.right = z.right;
        if (y.right) y.right.parent = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      if (y.left) y.left.parent = y;
      y.color = z.color;
    }

    if (yOriginalColor === 'BLACK' && x) {
      this.deleteFixup(x, xParent);
    }
  }

  private transplant(u: RBTreeNode, v: RBTreeNode | null) {
    if (!u.parent) {
      this.root = v;
    } else if (u === u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }
    if (v) {
      v.parent = u.parent;
    }
  }

  private minimum(node: RBTreeNode): RBTreeNode {
    let curr = node;
    while (curr.left) {
      curr = curr.left;
    }
    return curr;
  }

  private deleteFixup(x: RBTreeNode | null, parent: RBTreeNode | null) {
    while (x !== this.root && (!x || x.color === 'BLACK')) {
      if (x === parent?.left) {
        let w = parent?.right;
        if (w && w.color === 'RED') {
          w.color = 'BLACK';
          if (parent) parent.color = 'RED';
          if (parent) this.rotateLeft(parent);
          w = parent?.right;
        }
        if ((!w?.left || w.left.color === 'BLACK') && (!w?.right || w.right.color === 'BLACK')) {
          if (w) w.color = 'RED';
          x = parent;
          parent = x?.parent ?? null;
        } else {
          if (!w?.right || w.right.color === 'BLACK') {
            if (w?.left) w.left.color = 'BLACK';
            if (w) w.color = 'RED';
            if (w) this.rotateRight(w);
            w = parent?.right;
          }
          if (w && parent) {
            w.color = parent.color;
            parent.color = 'BLACK';
            if (w.right) w.right.color = 'BLACK';
            this.rotateLeft(parent);
          }
          x = this.root;
          break;
        }
      } else {
        let w = parent?.left;
        if (w && w.color === 'RED') {
          w.color = 'BLACK';
          if (parent) parent.color = 'RED';
          if (parent) this.rotateRight(parent);
          w = parent?.left;
        }
        if ((!w?.right || w.right.color === 'BLACK') && (!w?.left || w.left.color === 'BLACK')) {
          if (w) w.color = 'RED';
          x = parent;
          parent = x?.parent ?? null;
        } else {
          if (!w?.left || w.left.color === 'BLACK') {
            if (w?.right) w.right.color = 'BLACK';
            if (w) w.color = 'RED';
            if (w) this.rotateLeft(w);
            w = parent?.left;
          }
          if (w && parent) {
            w.color = parent.color;
            parent.color = 'BLACK';
            if (w.left) w.left.color = 'BLACK';
            this.rotateRight(parent);
          }
          x = this.root;
          break;
        }
      }
    }
    if (x) x.color = 'BLACK';
  }

  /**
   * RANGE QUERY (O(K + log N)):
   * Finds all students within [minCgpa, maxCgpa] in descending order.
   * Tracks exact nodes visited (traversal path) to prove O(K + log N) efficiency.
   */
  rangeQuery(
    minCgpa: number,
    maxCgpa: number
  ): {
    results: HeapRecord[];
    nodesVisited: number;
    traversedNodeIds: string[];
    theoreticalCost: string;
  } {
    const results: HeapRecord[] = [];
    const traversedNodeIds: string[] = [];
    let nodesVisited = 0;

    // In-order traversal from Right to Left produces descending order
    const traverse = (node: RBTreeNode | null) => {
      if (!node) return;
      nodesVisited++;
      traversedNodeIds.push(node.id);

      // If there are potential values larger than node.key, traverse right first
      if (node.key < maxCgpa) {
        traverse(node.right);
      }

      // If current node key falls within [minCgpa, maxCgpa], add all its studentRefs
      if (node.key >= minCgpa && node.key <= maxCgpa) {
        results.push(...node.studentRefs);
      }

      // If there are potential values smaller than node.key, traverse left
      if (node.key > minCgpa) {
        traverse(node.left);
      }
    };

    traverse(this.root);

    return {
      results,
      nodesVisited,
      traversedNodeIds,
      theoreticalCost: `O(K + log N) = O(${results.length} + log₂(${this.size}))`,
    };
  }

  /**
   * In-order array of nodes for layout or sequential inspection
   */
  getInOrderNodes(): RBTreeNode[] {
    const list: RBTreeNode[] = [];
    const traverse = (node: RBTreeNode | null) => {
      if (!node) return;
      traverse(node.left);
      list.push(node);
      traverse(node.right);
    };
    traverse(this.root);
    return list;
  }

  /**
   * Tree depth calculation
   */
  getDepth(): number {
    const maxDepth = (node: RBTreeNode | null): number => {
      if (!node) return 0;
      return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
    };
    return maxDepth(this.root);
  }

  /**
   * Black-height validation for Red-Black properties
   */
  getBlackHeight(): number {
    let curr = this.root;
    let bh = 0;
    while (curr) {
      if (curr.color === 'BLACK') bh++;
      curr = curr.left;
    }
    return bh;
  }

  clear() {
    this.root = null;
    this.size = 0;
    this.nodeCount = 0;
  }
}
