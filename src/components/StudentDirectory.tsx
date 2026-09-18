import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Award,
  Users,
  Building2,
  TrendingUp,
  ArrowUpDown,
  Filter,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Student } from '../types';

interface StudentDirectoryProps {
  students: Student[];
  onOpenAddModal: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (rollNo: string) => void;
  onSelectStudentInEngine?: (rollNo: string) => void;
  onSeedData: (count: number) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  students,
  onOpenAddModal,
  onEditStudent,
  onDeleteStudent,
  onSelectStudentInEngine,
  onSeedData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [cgpaFilter, setCgpaFilter] = useState<'ALL' | 'DISTINCTION' | 'FIRST_CLASS'>('ALL');
  const [sortBy, setSortBy] = useState<'CGPA_DESC' | 'CGPA_ASC' | 'NAME_ASC' | 'ROLL_ASC'>('CGPA_DESC');
  const [deleteConfirmRollNo, setDeleteConfirmRollNo] = useState<string | null>(null);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department.toUpperCase());
    });
    return Array.from(set).sort();
  }, [students]);

  // Statistics
  const stats = useMemo(() => {
    if (students.length === 0) {
      return { total: 0, avgCgpa: 0, topStudent: null, deptCount: 0 };
    }
    const total = students.length;
    const sumCgpa = students.reduce((acc, s) => acc + s.cgpa, 0);
    const avgCgpa = (sumCgpa / total).toFixed(2);
    const sortedByCgpa = [...students].sort((a, b) => b.cgpa - a.cgpa);
    const topStudent = sortedByCgpa[0];
    return {
      total,
      avgCgpa,
      topStudent,
      deptCount: departments.length,
    };
  }, [students, departments]);

  // Filter & Sort
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDept === 'ALL' || s.department.toUpperCase() === selectedDept;
        const matchesCgpa =
          cgpaFilter === 'ALL' ||
          (cgpaFilter === 'DISTINCTION' && s.cgpa >= 9.0) ||
          (cgpaFilter === 'FIRST_CLASS' && s.cgpa >= 8.0);
        return matchesSearch && matchesDept && matchesCgpa;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'CGPA_DESC':
            return b.cgpa - a.cgpa;
          case 'CGPA_ASC':
            return a.cgpa - b.cgpa;
          case 'NAME_ASC':
            return a.name.localeCompare(b.name);
          case 'ROLL_ASC':
            return a.rollNo.localeCompare(b.rollNo);
          default:
            return 0;
        }
      });
  }, [students, searchQuery, selectedDept, cgpaFilter, sortBy]);

  const getStandingBadge = (cgpa: number) => {
    if (cgpa >= 9.5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Award className="w-3 h-3" /> High Honors
        </span>
      );
    }
    if (cgpa >= 9.0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          <Award className="w-3 h-3" /> Dean's List
        </span>
      );
    }
    if (cgpa >= 8.0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
          First Class
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
        Good Standing
      </span>
    );
  };

  const getDeptColor = (dept: string) => {
    switch (dept.toUpperCase()) {
      case 'CSE':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'ECE':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'AI':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'DS':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'ME':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* 4 Quick Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100 font-mono">{stats.total}</div>
            <div className="text-xs text-slate-400">Total Enrolled</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{stats.avgCgpa}</div>
            <div className="text-xs text-slate-400">Average CGPA</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-100 truncate">
              {stats.topStudent ? stats.topStudent.name : 'N/A'}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {stats.topStudent ? `Top: ${stats.topStudent.cgpa.toFixed(2)} CGPA` : 'No records'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400 font-mono">{stats.deptCount}</div>
            <div className="text-xs text-slate-400">Departments</div>
          </div>
        </div>
      </div>

      {/* Action and Filter Control Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-students"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-add-student-main"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            <button
              id="btn-seed-students-main"
              onClick={() => onSeedData(3)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              title="Add 3 sample records"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Sample</span>
            </button>
          </div>
        </div>

        {/* Filter Pills and Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Department Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Dept:
            </span>
            <button
              id="filter-dept-all"
              onClick={() => setSelectedDept('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedDept === 'ALL'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({students.length})
            </button>
            {departments.map((dept) => {
              const count = students.filter((s) => s.department.toUpperCase() === dept).length;
              return (
                <button
                  key={dept}
                  id={`filter-dept-${dept.toLowerCase()}`}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    selectedDept === dept
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>

          {/* Honors Filter & Sort Options */}
          <div className="flex items-center gap-3">
            {/* Honors filter */}
            <div className="flex items-center gap-1">
              <button
                id="filter-cgpa-distinction"
                onClick={() => setCgpaFilter(cgpaFilter === 'DISTINCTION' ? 'ALL' : 'DISTINCTION')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                  cgpaFilter === 'DISTINCTION'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Honors (&ge; 9.0)
              </button>
            </div>

            {/* Sort selection */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                id="select-sort-students"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-500"
              >
                <option value="CGPA_DESC">Highest CGPA</option>
                <option value="CGPA_ASC">Lowest CGPA</option>
                <option value="NAME_ASC">Name (A-Z)</option>
                <option value="ROLL_ASC">Roll Number</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Academic Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isPendingDelete = deleteConfirmRollNo === student.rollNo;

                  return (
                    <tr
                      key={student.rollNo}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Roll Number */}
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-300">
                        {student.rollNo}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-cyan-400 font-semibold uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getDeptColor(
                            student.department
                          )}`}
                        >
                          {student.department.toUpperCase()}
                        </span>
                      </td>

                      {/* CGPA */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-100">
                            {student.cgpa.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500">/ 10.0</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">{getStandingBadge(student.cgpa)}</td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        {isPendingDelete ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-rose-400 font-medium">Delete?</span>
                            <button
                              id={`btn-confirm-delete-${student.rollNo}`}
                              onClick={() => {
                                onDeleteStudent(student.rollNo);
                                setDeleteConfirmRollNo(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                            >
                              Yes
                            </button>
                            <button
                              id={`btn-cancel-delete-${student.rollNo}`}
                              onClick={() => setDeleteConfirmRollNo(null)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {/* Inspect in Engine button */}
                            {onSelectStudentInEngine && (
                              <button
                                id={`btn-inspect-${student.rollNo}`}
                                onClick={() => onSelectStudentInEngine(student.rollNo)}
                                className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                                title="Inspect student in Database Engine"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              id={`btn-edit-${student.rollNo}`}
                              onClick={() => onEditStudent(student)}
                              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                              title="Edit student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              id={`btn-delete-${student.rollNo}`}
                              onClick={() => setDeleteConfirmRollNo(student.rollNo)}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-300">No student records found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Try adjusting your search criteria or add a new student record.
                    </p>
                    <button
                      id="btn-clear-filters"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedDept('ALL');
                        setCgpaFilter('ALL');
                      }}
                      className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-md text-xs transition-colors"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
