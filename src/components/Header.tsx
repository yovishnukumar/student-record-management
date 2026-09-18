import React from 'react';
import { Database, Plus, RefreshCw, Layers, Sparkles, BookOpen, RotateCcw, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { EngineStats } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  stats: EngineStats;
  onOpenAddModal: () => void;
  onSeedData: (count: number) => void;
  onForceRehash: () => void;
  onOpenArchitectureModal: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onOpenAddModal,
  onSeedData,
  onForceRehash,
  onOpenArchitectureModal,
  onReset,
}) => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const isLoadFactorHigh = stats.loadFactor >= stats.loadFactorThreshold;
  const loadPercentage = Math.min(100, Math.round((stats.loadFactor / stats.loadFactorThreshold) * 100));

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Engine Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Student Record Management System
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>In-Memory Storage Engine</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-cyan-300">djb2 Hash Table</span>
              <span className="text-slate-600">+</span>
              <span className="font-mono text-rose-300">Red-Black Tree</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-amber-300">std::shared_ptr Heap</span>
            </p>
          </div>
        </div>

        {/* Center / Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 py-1">
          {/* Records & Memory */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Heap Records (N)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold font-mono text-slate-100">{stats.recordCount}</span>
              <span className="text-[11px] text-slate-400 font-mono">({stats.totalHeapBytes} B)</span>
            </div>
          </div>

          {/* Bucket Capacity */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Capacity (Prime M)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold font-mono text-cyan-400">{stats.bucketCapacity}</span>
              <span className="text-[10px] text-slate-500">({stats.rehashCount} rehashes)</span>
            </div>
          </div>

          {/* Load Factor α */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Load Factor (α)
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-1 rounded ${
                  isLoadFactorHigh ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                }`}
              >
                Max 0.75
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-sm font-bold font-mono ${
                  isLoadFactorHigh ? 'text-amber-400' : 'text-slate-100'
                }`}
              >
                {stats.loadFactor.toFixed(2)}
              </span>
              <div className="flex-1 h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isLoadFactorHigh ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${loadPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Secondary RB-Tree Metrics */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              RB-Tree Depth
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold font-mono text-rose-400">{stats.treeDepth}</span>
              <span className="text-[11px] text-slate-400 font-mono">(BH: {stats.blackHeight})</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-add-student"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Insert Tuple</span>
          </button>

          <button
            id="btn-seed-data"
            onClick={() => onSeedData(5)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            title="Insert 5 sample student records"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Seed 5</span>
          </button>

          <button
            id="btn-force-rehash"
            onClick={onForceRehash}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            title="Demonstrate zero-cost dynamic prime rehashing"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rehash</span>
          </button>

          <button
            id="btn-open-arch-blueprint"
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>

          <button
            id="btn-reset-engine"
            onClick={onReset}
            className="p-1.5 text-xs rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors"
            title="Reset engine storage"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Auth */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] text-white">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <button
                id="btn-user-signout"
                onClick={signOut}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-google-signin"
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
