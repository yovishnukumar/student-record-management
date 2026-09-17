import React, { useState } from 'react';
import { Hash, ArrowRight, CornerDownRight, Binary, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { HashTable, getDjb2StepTrace } from '../engine/hash';
import { HashNode } from '../types';

interface HashTableVisualizerProps {
  hashTable: HashTable;
  activeRollNo: string | null;
  onSelectRollNo: (rollNo: string) => void;
}

export const HashTableVisualizer: React.FC<HashTableVisualizerProps> = ({
  hashTable,
  activeRollNo,
  onSelectRollNo,
}) => {
  const [testInput, setTestInput] = useState('CS21B001');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const stats = hashTable.getStats();
  const trace = getDjb2StepTrace(testInput || 'A', hashTable.capacity);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Title & Specs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Primary Key Hash Store</span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                O(1) Avg Lookup
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Polynomial <span className="font-mono text-cyan-300">djb2</span> hash + Separate Chaining for roll number indexing
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-djb2-math"
          onClick={() => setShowFormulaModal(!showFormulaModal)}
          className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <Binary className="w-3.5 h-3.5 text-cyan-400" />
          <span>djb2 Math</span>
        </button>
      </div>

      {/* Interactive djb2 Formula Mini-Tracer */}
      {showFormulaModal && (
        <div className="mb-3 p-3 rounded-lg bg-slate-950 border border-cyan-900/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              djb2 Polynomial Execution Breakdown:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Test Key:</span>
              <input
                id="input-test-djb2-key"
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value.toUpperCase())}
                className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono text-xs w-28 uppercase focus:outline-none focus:border-cyan-500"
                placeholder="e.g. CS21B001"
              />
            </div>
          </div>

          <div className="p-2 bg-slate-900/80 rounded border border-slate-800 font-mono text-[11px] text-slate-300 mb-2 overflow-x-auto">
            <span className="text-slate-500">// Algorithm: hash = ((hash &lt;&lt; 5) + hash) + c = hash * 33 + c</span>
            <br />
            Initial Hash: <span className="text-amber-400">5381</span>
            {trace.steps.map((s, idx) => (
              <div key={idx} className="text-slate-400 hover:text-slate-200">
                Char &apos;{s.char}&apos; (ASCII {s.ascii}): {s.formula}
              </div>
            ))}
            <div className="mt-1 pt-1 border-t border-slate-800 text-cyan-300 font-semibold">
              Final Hash = {trace.rawHash} | Bucket = {trace.rawHash} % {trace.capacity} ={' '}
              <span className="text-amber-400 font-bold">[{trace.targetBucket}]</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>
              The prime constant 33 provides high entropy diffusion across alphanumeric prefixes like &quot;CS21&quot; and &quot;EC21&quot;.
            </span>
          </div>
        </div>
      )}

      {/* Bucket Array Container with Separate Chaining */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[300px]">
        {hashTable.buckets.map((headNode, bucketIdx) => {
          const chain: HashNode[] = [];
          let curr = headNode;
          while (curr) {
            chain.push(curr);
            curr = curr.next;
          }

          const hasItems = chain.length > 0;
          const containsActive = chain.some((n) => n.key === activeRollNo);

          return (
            <div
              key={bucketIdx}
              className={`rounded-lg border transition-all ${
                containsActive
                  ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/40'
                  : hasItems
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-950/30 border-slate-850 opacity-60'
              } p-2 flex flex-col sm:flex-row sm:items-center gap-2`}
            >
              {/* Bucket Index Marker */}
              <div className="flex items-center gap-1.5 sm:w-24 flex-shrink-0">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    hasItems ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  [{bucketIdx.toString().padStart(2, '0')}]
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {chain.length === 0 ? 'empty' : `${chain.length} node${chain.length > 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Bucket Chain Linked List */}
              <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                {chain.length === 0 ? (
                  <div className="text-slate-600 font-mono text-[11px] italic flex items-center gap-1">
                    <span>nullptr</span>
                  </div>
                ) : (
                  chain.map((node, nodeIdx) => {
                    const isNodeActive = node.key === activeRollNo;

                    return (
                      <React.Fragment key={node.key}>
                        {nodeIdx > 0 && (
                          <div className="text-slate-600 flex items-center">
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                          </div>
                        )}

                        <div
                          onClick={() => onSelectRollNo(node.key)}
                          className={`group cursor-pointer rounded-md px-2.5 py-1.5 border text-xs font-mono transition-all flex flex-col gap-0.5 ${
                            isNodeActive
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-slate-100">{node.key}</span>
                            <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                              {node.studentRef.data.department}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <CornerDownRight className="w-3 h-3 text-cyan-400" />
                            <span className="text-amber-400 font-mono">
                              *{node.heapAddress.slice(0, 10)}
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="text-rose-300 font-semibold">
                              CGPA: {node.studentRef.data.cgpa.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Specs: Dynamic Prime Rehashing Highlight */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Chaining Collision Rate:</span>
          <span className="font-mono text-cyan-300 font-semibold">
            {stats.size > 0 ? ((stats.collisionCount / stats.size) * 100).toFixed(1) : 0}%
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Max Chain:</span>
          <span className="font-mono text-slate-200 font-semibold">{stats.maxChainLength}</span>
        </div>

        <div className="flex items-center gap-1.5 text-cyan-300/90 font-mono text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Cost Pointer Migration on Rehash</span>
        </div>
      </div>
    </div>
  );
};
