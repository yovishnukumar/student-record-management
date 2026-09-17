import React, { useState } from 'react';
import { Terminal, Play, Zap, FileText, CheckCircle, Clock, Search, ArrowRight } from 'lucide-react';
import { QueryPlan } from '../types';

interface QueryConsoleProps {
  lastPlan: QueryPlan | null;
  onExecuteSql: (sql: string) => void;
  onRunPreset: (type: 'PK_LOOKUP' | 'RANGE_SCAN' | 'HOT_UPDATE' | 'NON_HOT_UPDATE' | 'REHASH_TRIGGER' | 'DELETE_DEMO') => void;
}

export const QueryConsole: React.FC<QueryConsoleProps> = ({
  lastPlan,
  onExecuteSql,
  onRunPreset,
}) => {
  const [sqlInput, setSqlInput] = useState("SELECT * FROM students WHERE roll_no = 'CS21B001';");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sqlInput.trim()) {
      onExecuteSql(sqlInput.trim());
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
      {/* Title & Engine Command Interface */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>SQL Query Console &amp; EXPLAIN ANALYZE</span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                Planner Engine
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Execute queries to inspect low-level index scans, memory pointers, and HOT optimizations
            </p>
          </div>
        </div>

        {/* Preset Experiments */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Presets:</span>
          <button
            id="btn-preset-pk-lookup"
            onClick={() => onRunPreset('PK_LOOKUP')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium transition-colors"
          >
            ⚡ O(1) PK Lookup
          </button>
          <button
            id="btn-preset-range-scan"
            onClick={() => onRunPreset('RANGE_SCAN')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-[11px] font-medium transition-colors"
          >
            🔍 O(K+log N) Range Scan
          </button>
          <button
            id="btn-preset-hot-update"
            onClick={() => onRunPreset('HOT_UPDATE')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[11px] font-medium transition-colors"
          >
            ⚡ HOT In-Place
          </button>
          <button
            id="btn-preset-non-hot-update"
            onClick={() => onRunPreset('NON_HOT_UPDATE')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-medium transition-colors"
          >
            🌲 Non-HOT CGPA
          </button>
          <button
            id="btn-preset-rehash-trigger"
            onClick={() => onRunPreset('REHASH_TRIGGER')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-medium transition-colors"
          >
            🔄 Trigger Rehash
          </button>
        </div>
      </div>

      {/* SQL Input Form */}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-750 rounded-lg p-1.5 focus-within:border-cyan-500/80 transition-all">
          <span className="text-cyan-500 font-mono text-sm pl-2 select-none">&gt;</span>
          <input
            id="input-sql-command"
            type="text"
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            className="flex-1 bg-transparent text-cyan-200 font-mono text-xs focus:outline-none placeholder:text-slate-600"
            placeholder="e.g. SELECT * FROM students WHERE cgpa >= 8.5;"
          />
          <button
            id="btn-execute-sql"
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Execute</span>
          </button>
        </div>
      </form>

      {/* EXPLAIN ANALYZE Query Plan Output */}
      {lastPlan ? (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono">
          {/* Header Strip: Access Method & Cost */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-850 gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-sans font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                EXPLAIN ANALYZE:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  lastPlan.accessMethod === 'HASH_INDEX_SCAN'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : lastPlan.accessMethod === 'INDEX_RANGE_SCAN'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {lastPlan.accessMethod}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Complexity:</span>
                <span className="text-slate-200 font-bold">{lastPlan.theoreticalComplexity}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Time:</span>
                <span className="text-emerald-300 font-bold">{lastPlan.executionTimeUs} µs</span>
              </span>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5 font-mono text-[11px]">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Tuples Examined</span>
              <span className="text-slate-200 font-bold">{lastPlan.recordsExamined}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Tuples Returned</span>
              <span className="text-cyan-300 font-bold">{lastPlan.recordsReturned}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Heap Reallocations</span>
              <span className="text-emerald-400 font-bold">{lastPlan.heapAllocations} (Zero Shift)</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Secondary Index Writes</span>
              <span
                className={`font-bold ${
                  lastPlan.secondaryIndexUpdates === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {lastPlan.secondaryIndexUpdates} {lastPlan.secondaryIndexUpdates === 0 ? '(HOT Optimized)' : ''}
              </span>
            </div>
          </div>

          {/* Execution Plan Walkthrough Steps */}
          <div className="space-y-1 text-slate-300 text-[11px]">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-0.5">
              Engine Execution Trace:
            </span>
            {lastPlan.executionSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-500 font-mono text-center">
          Execute a query above to view the detailed EXPLAIN ANALYZE execution plan.
        </div>
      )}
    </div>
  );
};
