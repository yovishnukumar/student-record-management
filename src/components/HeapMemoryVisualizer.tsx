import React, { useState } from 'react';
import { HardDrive, Sparkles, Trash2, ArrowUpRight, Binary } from 'lucide-react';
import { HeapMemoryManager } from '../engine/heap';
import { HeapRecord } from '../types';

interface HeapMemoryVisualizerProps {
  heap: HeapMemoryManager;
  activeRollNo: string | null;
  onSelectRollNo: (rollNo: string) => void;
  onQuickHotUpdate: (rollNo: string) => void;
  onQuickNonHotUpdate: (rollNo: string) => void;
  onQuickDelete: (rollNo: string) => void;
}

export const HeapMemoryVisualizer: React.FC<HeapMemoryVisualizerProps> = ({
  heap,
  activeRollNo,
  onSelectRollNo,
  onQuickHotUpdate,
  onQuickNonHotUpdate,
  onQuickDelete,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const records = heap.getAllRecords();

  const selectedRecord = selectedAddress
    ? heap.getRecord(selectedAddress)
    : records.find((r) => r.data.rollNo === activeRollNo) || records[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
      {/* Title & Core Philosophy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Address-Stable Heap Memory Pool</span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                std::shared_ptr&lt;Student&gt;
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Single source of truth allocated once on heap; indexes hold 8-byte smart pointers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Total Heap:</span>
          <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            {heap.getTotalBytes()} Bytes ({records.length} blocks)
          </span>
        </div>
      </div>

      {/* Grid of Heap Memory Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3 max-h-[340px] overflow-y-auto pr-1">
        {records.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs font-mono">
            Heap memory is empty. Insert tuples or seed data to allocate pinned heap blocks.
          </div>
        ) : (
          records.map((rec) => {
            const isSelected = selectedRecord?.address === rec.address;
            const isActive = rec.data.rollNo === activeRollNo;

            return (
              <div
                key={rec.address}
                onClick={() => {
                  setSelectedAddress(rec.address);
                  onSelectRollNo(rec.data.rollNo);
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-amber-950/30 border-amber-400 ring-1 ring-amber-400/40'
                    : isSelected
                    ? 'bg-slate-800/90 border-slate-600'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Address and Ref Count */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-amber-300 tracking-wide">
                    {rec.address}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {rec.hotUpdated && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        HOT
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        rec.refCount === 2
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : rec.refCount === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                      title="Number of index references (Hash Table + RB-Tree)"
                    >
                      use_count: {rec.refCount}
                    </span>
                  </div>
                </div>

                {/* Tuple Data Content */}
                <div className="space-y-0.5 text-xs text-slate-300 font-mono mb-2">
                  <div className="flex items-center justify-between text-slate-100 font-semibold">
                    <span>{rec.data.rollNo}</span>
                    <span className="text-rose-400 font-bold">CGPA: {rec.data.cgpa.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {rec.data.name} <span className="text-slate-600">•</span>{' '}
                    <span className="text-slate-300">{rec.data.department}</span>
                  </div>
                </div>

                {/* Quick In-Place Action Bar */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickHotUpdate(rec.data.rollNo);
                      }}
                      className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-colors"
                      title="Test Heap-Only Tuple (HOT) update on department"
                    >
                      HOT Dept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickNonHotUpdate(rec.data.rollNo);
                      }}
                      className="px-1.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 transition-colors"
                      title="Test Non-HOT update: re-index CGPA in Red-Black Tree"
                    >
                      CGPA +0.1
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickDelete(rec.data.rollNo);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete record and observe ARC ref-count deallocation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Low-Level Memory Byte Inspector (Simulated C++ Struct Layout) */}
      {selectedRecord && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulated C++ Struct Memory Layout for {selectedRecord.address}:</span>
            </span>
            <span className="font-mono text-[11px] text-amber-400">
              sizeof(StudentTuple) = {selectedRecord.sizeBytes} bytes
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">0x00 - 0x07 (8B)</span>
              <span className="text-cyan-400 font-semibold">vptr / control_block</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">weak=0, shared=1</span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">0x08 - 0x0F (8B)</span>
              <span className="text-emerald-400 font-semibold">atomic&lt;int&gt; use_count</span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                value: <span className="font-bold">{selectedRecord.refCount}</span>
              </span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">0x10 - 0x27 (24B)</span>
              <span className="text-amber-400 font-semibold">rollNo & dept</span>
              <span className="text-[10px] text-slate-300 block mt-0.5 truncate">
                &quot;{selectedRecord.data.rollNo}&quot; | &quot;{selectedRecord.data.department}&quot;
              </span>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">0x28 - 0x2F (8B)</span>
              <span className="text-rose-400 font-semibold">double cgpa</span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                {selectedRecord.data.cgpa.toFixed(2)} (IEEE-754)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* RAII / ARC Garbage Collection Log */}
      {heap.deallocatedHistory.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Recently Reclaimed Heap Addresses (use_count = 0):</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {heap.deallocatedHistory.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/60"
              >
                free({item.address}) [{item.rollNo}]
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
