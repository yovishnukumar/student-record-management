import React from 'react';
import {
  GraduationCap,
  Users,
  Cpu,
  Plus,
  RefreshCw,
  BookOpen,
  RotateCcw,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { EngineStats } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  stats: EngineStats;
  currentView: 'STUDENTS' | 'ENGINE';
  onViewChange: (view: 'STUDENTS' | 'ENGINE') => void;
  onOpenAddModal: () => void;
  onForceRehash: () => void;
  onOpenArchitectureModal: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentView,
  onViewChange,
  onOpenAddModal,
  onForceRehash,
  onOpenArchitectureModal,
  onReset,
}) => {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Student Record Management System
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage student enrollment, academic standings, and departmental records
            </p>
          </div>
        </div>

        {/* Center: Clean View Switcher */}
        <div className="flex items-center self-start md:self-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-view-students"
            onClick={() => onViewChange('STUDENTS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'STUDENTS'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Records</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">
              {stats.recordCount}
            </span>
          </button>

          <button
            id="tab-view-engine"
            onClick={() => onViewChange('ENGINE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'ENGINE'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Storage Engine</span>
          </button>
        </div>

        {/* Right: Actions & User Auth */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            id="btn-header-add-student"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          {/* Engine Mode Specific quick helpers */}
          {currentView === 'ENGINE' && (
            <>
              <button
                id="btn-force-rehash"
                onClick={onForceRehash}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
                title="Demonstrate zero-cost dynamic prime rehashing"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Rehash</span>
              </button>

              <button
                id="btn-open-arch-blueprint"
                onClick={onOpenArchitectureModal}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Docs</span>
              </button>

              <button
                id="btn-reset-engine"
                onClick={onReset}
                className="p-1.5 text-xs rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors"
                title="Reset engine storage"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

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
                className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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
