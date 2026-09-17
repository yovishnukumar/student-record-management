import React from 'react';
import { X, Layers, ShieldCheck, Zap, Cpu, Database, Check } from 'lucide-react';

interface ArchitectureComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureComparisonModal: React.FC<ArchitectureComparisonModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Database Storage Engine Architectural Blueprint
            </h2>
            <p className="text-xs text-slate-400">
              Comparing academic mini-projects against this in-memory engine and PostgreSQL / MySQL InnoDB
            </p>
          </div>
        </div>

        {/* The Core Architectural Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 mb-6">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300 font-sans">
                <th className="p-3 font-semibold text-slate-400">Dimension</th>
                <th className="p-3 font-semibold text-rose-400">Standard Mini-Project</th>
                <th className="p-3 font-semibold text-cyan-400">This Engine Architecture</th>
                <th className="p-3 font-semibold text-emerald-400">Real-World Database (Postgres/InnoDB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-slate-400 font-sans">Record Storage</td>
                <td className="p-3 text-rose-300/80">Flat array / monolithic list</td>
                <td className="p-3 text-cyan-300 font-bold">Heap-allocated std::shared_ptr nodes</td>
                <td className="p-3 text-emerald-400">Heap-resident row tuples / table heap</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-400 font-sans">Primary Access</td>
                <td className="p-3 text-rose-300/80">Simple modulo on integer IDs</td>
                <td className="p-3 text-cyan-300 font-bold">djb2 polynomial hash on alphanumeric strings</td>
                <td className="p-3 text-emerald-400">Hash index / Clustered index (B+Tree)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-400 font-sans">Range Queries</td>
                <td className="p-3 text-rose-300/80">Linear scan O(N)</td>
                <td className="p-3 text-cyan-300 font-bold">Self-balancing Red-Black Tree O(K + log N)</td>
                <td className="p-3 text-emerald-400">B-Tree secondary index range scan</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-400 font-sans">Rehashing Cost</td>
                <td className="p-3 text-rose-300/80">O(N log N) or dangling pointers</td>
                <td className="p-3 text-cyan-300 font-bold">O(N) pure pointer migration (Heap &amp; BST untouched)</td>
                <td className="p-3 text-emerald-400">In-memory buffer page split / zero re-addressing</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-400 font-sans">Memory Reclamation</td>
                <td className="p-3 text-rose-300/80">Manual delete or memory leaks</td>
                <td className="p-3 text-cyan-300 font-bold">Automatic Reference Counting (use_count = 0)</td>
                <td className="p-3 text-emerald-400">Vacuum / MVCC garbage collection</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4 Pillars Grid */}
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Core Design Pillars</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Pillar 1 */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero-Cost Dynamic Rehashing</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              When the hash table capacity expands to the next prime, only 8-byte smart pointers are redistributed
              across new buckets. Because heap memory addresses never shift, the secondary Red-Black tree index requires{' '}
              <strong className="text-slate-200">zero reconstruction</strong> (O(N) bucket redistribution instead of O(N log N) tree rebuilding).
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Index-Only Scans</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Range queries (e.g. &quot;CGPA &ge; 8.5&quot;) read directly from the pointers stored in the multimap, fulfilling the request
              entirely without scanning primary hash table buckets or reading unrelated heap tuples.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Heap-Only Tuples (HOT) Optimization</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Updating non-indexed attributes (such as <code className="text-cyan-300 font-mono">name</code> or{' '}
              <code className="text-cyan-300 font-mono">department</code>) updates the record in-place on the heap in O(1) without touching
              the secondary index. The Red-Black Tree is only modified if the indexed attribute (<code className="text-rose-300 font-mono">cgpa</code>) changes.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Targeted O(log N) Surgical Mutations</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Deletions and CGPA updates locate and erase specific tree iterators via{' '}
              <code className="text-amber-300 font-mono">equal_range()</code>, ensuring surgical removal rather than full-index invalidation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
