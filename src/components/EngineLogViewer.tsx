import React, { useState } from 'react';
import { Activity, Trash2, Filter } from 'lucide-react';
import { EngineLog } from '../types';

interface EngineLogViewerProps {
  logs: EngineLog[];
  onClearLogs: () => void;
}

export const EngineLogViewer: React.FC<EngineLogViewerProps> = ({ logs, onClearLogs }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Events' },
    { id: 'HOT_OPTIMIZATION', label: 'HOT Updates' },
    { id: 'REHASH', label: 'Rehashes' },
    { id: 'HASH_INDEX', label: 'Hash Table' },
    { id: 'RB_TREE', label: 'RB-Tree' },
    { id: 'HEAP', label: 'Heap Pool' },
    { id: 'QUERY', label: 'Queries' },
  ];

  const filteredLogs = logs.filter(
    (l) => selectedCategory === 'ALL' || l.category === selectedCategory
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Engine Event &amp; Memory Pointer Stream</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-slate-300">
                {logs.length} events
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Real-time transaction trace detailing heap allocations, pointer migrations, and tree balancing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[11px] font-mono">
        <Filter className="w-3 h-3 text-slate-500 flex-shrink-0" />
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === c.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="flex-1 max-h-60 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
        {filteredLogs.length === 0 ? (
          <div className="py-6 text-center text-slate-600 text-xs italic">
            No events logged yet for this category.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badgeColor =
              log.category === 'HOT_OPTIMIZATION'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : log.category === 'REHASH'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                : log.category === 'HASH_INDEX'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : log.category === 'RB_TREE'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : log.category === 'HEAP'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

            return (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-950/70 border border-slate-850 hover:border-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${badgeColor}`}>
                      {log.category}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>

                {log.details && (
                  <p className="text-[10px] text-slate-400 pl-1 border-l-2 border-slate-800 mt-1">
                    {log.details}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
