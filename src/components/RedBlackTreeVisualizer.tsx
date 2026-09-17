import React, { useState, useMemo } from 'react';
import { Network, Filter, Eye, ChevronRight, Award } from 'lucide-react';
import { RedBlackTree } from '../engine/rbTree';
import { RBTreeNode, HeapRecord } from '../types';

interface RedBlackTreeVisualizerProps {
  tree: RedBlackTree;
  highlightedNodeIds: string[];
  onSelectRollNo: (rollNo: string) => void;
  onExecuteRangeScan: (min: number, max: number) => void;
}

interface LayoutNode {
  node: RBTreeNode;
  x: number;
  y: number;
  left?: LayoutNode;
  right?: LayoutNode;
}

export const RedBlackTreeVisualizer: React.FC<RedBlackTreeVisualizerProps> = ({
  tree,
  highlightedNodeIds,
  onSelectRollNo,
  onExecuteRangeScan,
}) => {
  const [minCgpa, setMinCgpa] = useState<number>(8.5);
  const [maxCgpa, setMaxCgpa] = useState<number>(10.0);
  const [selectedNode, setSelectedNode] = useState<RBTreeNode | null>(null);

  // Compute SVG layout coordinates for the Red-Black Tree
  const { layoutTree, svgWidth, svgHeight } = useMemo(() => {
    if (!tree.root) {
      return { layoutTree: null, svgWidth: 600, svgHeight: 280 };
    }

    // In-order traversal assigns x-coordinates based on rank
    let rank = 0;
    const inOrderRank = new Map<string, number>();

    const assignRank = (node: RBTreeNode | null) => {
      if (!node) return;
      assignRank(node.left);
      inOrderRank.set(node.id, rank++);
      assignRank(node.right);
    };
    assignRank(tree.root);

    const totalNodes = Math.max(1, rank);
    const nodeSpacingX = Math.max(68, Math.min(110, 720 / totalNodes));
    const levelHeight = 65;
    const paddingX = 50;
    const paddingTop = 45;

    const buildLayout = (node: RBTreeNode | null, depth: number): LayoutNode | null => {
      if (!node) return null;
      const xPos = paddingX + (inOrderRank.get(node.id) || 0) * nodeSpacingX;
      const yPos = paddingTop + depth * levelHeight;

      const layoutNode: LayoutNode = {
        node,
        x: xPos,
        y: yPos,
        left: buildLayout(node.left, depth + 1) || undefined,
        right: buildLayout(node.right, depth + 1) || undefined,
      };

      return layoutNode;
    };

    const calculatedLayout = buildLayout(tree.root, 0);
    const calculatedWidth = Math.max(650, totalNodes * nodeSpacingX + paddingX * 2);
    const calculatedHeight = Math.max(280, (tree.getDepth() + 1) * levelHeight + 50);

    return {
      layoutTree: calculatedLayout,
      svgWidth: calculatedWidth,
      svgHeight: calculatedHeight,
    };
  }, [tree.root, tree.nodeCount, tree.size]);

  // Flatten layout nodes and branches for rendering
  const { nodesList, linksList } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const links: { from: { x: number; y: number }; to: { x: number; y: number }; isHighlighted: boolean }[] = [];

    const traverse = (ln: LayoutNode | null | undefined) => {
      if (!ln) return;
      nodes.push(ln);

      if (ln.left) {
        const isBranchHighlighted =
          highlightedNodeIds.includes(ln.node.id) && highlightedNodeIds.includes(ln.left.node.id);
        links.push({
          from: { x: ln.x, y: ln.y },
          to: { x: ln.left.x, y: ln.left.y },
          isHighlighted: isBranchHighlighted,
        });
        traverse(ln.left);
      }

      if (ln.right) {
        const isBranchHighlighted =
          highlightedNodeIds.includes(ln.node.id) && highlightedNodeIds.includes(ln.right.node.id);
        links.push({
          from: { x: ln.x, y: ln.y },
          to: { x: ln.right.x, y: ln.right.y },
          isHighlighted: isBranchHighlighted,
        });
        traverse(ln.right);
      }
    };

    traverse(layoutTree);
    return { nodesList: nodes, linksList: links };
  }, [layoutTree, highlightedNodeIds]);

  const inOrderNodes = useMemo(() => {
    // Show descending order of CGPA
    return [...tree.getInOrderNodes()].reverse();
  }, [tree]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Title & Capabilities */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Secondary Analytical Index</span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                O(K + log N) Range Scan
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Ordered <span className="font-mono text-rose-300">Red-Black Tree</span> (`std::multimap`) indexed on{' '}
              <span className="font-mono text-slate-200">CGPA</span> descending
            </p>
          </div>
        </div>

        {/* Quick Range Filter bar */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <span className="text-[11px] text-slate-400">CGPA:</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={minCgpa}
            onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
            className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
          />
          <span className="text-slate-500 font-mono">to</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={maxCgpa}
            onChange={(e) => setMaxCgpa(parseFloat(e.target.value) || 10)}
            className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
          />
          <button
            id="btn-run-range-scan"
            onClick={() => onExecuteRangeScan(minCgpa, maxCgpa)}
            className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Scan Range
          </button>
        </div>
      </div>

      {/* SVG Tree Viewport */}
      <div className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-lg overflow-auto relative min-h-[300px]">
        {tree.root ? (
          <svg width={svgWidth} height={svgHeight} className="mx-auto block select-none">
            {/* Draw Links between parent & child */}
            {linksList.map((link, idx) => (
              <line
                key={`link-${idx}`}
                x1={link.from.x}
                y1={link.from.y}
                x2={link.to.x}
                y2={link.to.y}
                stroke={link.isHighlighted ? '#06b6d4' : '#334155'}
                strokeWidth={link.isHighlighted ? 2.5 : 1.5}
                strokeDasharray={link.isHighlighted ? 'none' : 'none'}
                className="transition-all duration-300"
              />
            ))}

            {/* Draw Tree Nodes */}
            {nodesList.map((ln) => {
              const node = ln.node;
              const isRed = node.color === 'RED';
              const isHighlighted = highlightedNodeIds.includes(node.id);
              const isSelected = selectedNode?.id === node.id;
              const hasDuplicates = node.studentRefs.length > 1;

              return (
                <g
                  key={node.id}
                  transform={`translate(${ln.x}, ${ln.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Glowing Highlight Ring during Range Scans */}
                  {isHighlighted && (
                    <circle
                      r="24"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      className="animate-pulse"
                      opacity="0.8"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r="20"
                    fill={isRed ? '#881337' : '#0f172a'}
                    stroke={
                      isSelected
                        ? '#38bdf8'
                        : isHighlighted
                        ? '#22d3ee'
                        : isRed
                        ? '#e11d48'
                        : '#475569'
                    }
                    strokeWidth={isSelected || isHighlighted ? 2.5 : 2}
                    className="transition-colors duration-200"
                  />

                  {/* CGPA Key Text */}
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                    fontWeight="bold"
                    fill={isRed ? '#ffe4e6' : '#e2e8f0'}
                  >
                    {node.key.toFixed(2)}
                  </text>

                  {/* Duplicate Counter Badge (multimap support) */}
                  {hasDuplicates && (
                    <g transform="translate(14, -14)">
                      <circle r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                      <text
                        textAnchor="middle"
                        dy=".35em"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        {node.studentRefs.length}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
            Secondary index is empty. Insert records to construct Red-Black Tree.
          </div>
        )}

        {/* Selected Node Inspector Flyout */}
        {selectedNode && (
          <div className="absolute bottom-2 right-2 max-w-sm bg-slate-900/95 border border-cyan-500/40 rounded-lg p-3 text-xs shadow-xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-slate-200">
                  Node CGPA: <span className="font-mono text-cyan-300">{selectedNode.key.toFixed(2)}</span>
                </span>
                <span
                  className={`text-[10px] px-1.5 rounded font-mono font-bold ${
                    selectedNode.color === 'RED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {selectedNode.color}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {selectedNode.studentRefs.map((s: HeapRecord) => (
                <div
                  key={s.address}
                  onClick={() => onSelectRollNo(s.data.rollNo)}
                  className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-100 font-mono">{s.data.rollNo}</span>
                    <span className="text-slate-400">{s.data.name}</span>
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-mono mt-0.5 flex items-center justify-between">
                    <span>Heap: *{s.address}</span>
                    <span className="text-slate-400">use_count: {s.refCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* In-Order Traversal Strip (Descending) */}
      <div className="mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-slate-400 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ordered Index Scan (CGPA High → Low):</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {inOrderNodes.length} distinct CGPA keys
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {inOrderNodes.length === 0 ? (
            <span className="text-slate-600 italic text-[11px]">No keys in index</span>
          ) : (
            inOrderNodes.map((n, idx) => {
              const isHighlighted = highlightedNodeIds.includes(n.id);
              return (
                <React.Fragment key={n.id}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                  <button
                    onClick={() => setSelectedNode(n)}
                    className={`flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                      isHighlighted
                        ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-sm'
                        : n.color === 'RED'
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:border-rose-600'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {n.key.toFixed(2)}
                    {n.studentRefs.length > 1 && (
                      <span className="ml-1 text-[9px] text-cyan-300 font-normal">
                        ({n.studentRefs.length})
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
