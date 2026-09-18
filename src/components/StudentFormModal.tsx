import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';
import { Student } from '../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: Student) => void;
  initialStudent?: Student | null;
  nextSuggestedRollNo?: string;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialStudent = null,
  nextSuggestedRollNo = 'CS21B099',
}) => {
  const isEditing = Boolean(initialStudent);
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [cgpa, setCgpa] = useState<number>(9.0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStudent) {
      setRollNo(initialStudent.rollNo);
      setName(initialStudent.name);
      setDepartment(initialStudent.department || 'CSE');
      setCgpa(initialStudent.cgpa ?? 9.0);
    } else {
      setRollNo(nextSuggestedRollNo);
      setName('');
      setDepartment('CSE');
      setCgpa(9.0);
    }
    setError(null);
  }, [initialStudent, nextSuggestedRollNo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim()) {
      setError('Roll number is required.');
      return;
    }
    if (!name.trim()) {
      setError('Student full name is required.');
      return;
    }
    const parsedCgpa = Number(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      setError('CGPA must be a valid number between 0.00 and 10.00.');
      return;
    }

    setError(null);
    onSubmit({
      rollNo: rollNo.trim().toUpperCase(),
      name: name.trim(),
      department: department.trim().toUpperCase(),
      cgpa: Number(parsedCgpa.toFixed(2)),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
        <button
          id="btn-close-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {isEditing ? 'Edit Student Record' : 'Add New Student'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? `Update academic information for ${initialStudent?.rollNo}`
                : 'Enter student details to add to the system'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1 font-mono">
              Roll Number {isEditing && '(Unique Identifier)'}
            </label>
            <input
              id="input-student-roll-no"
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value.toUpperCase())}
              placeholder="e.g. CS21B001"
              disabled={isEditing}
              className={`w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono text-xs uppercase focus:outline-none focus:border-cyan-500 ${
                isEditing ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Student Full Name</label>
            <input
              id="input-student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alan Turing"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Department</label>
              <select
                id="select-student-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="CSE">CSE (Computer Science)</option>
                <option value="AI">AI (Artificial Intelligence)</option>
                <option value="ECE">ECE (Electronics)</option>
                <option value="DS">DS (Data Science)</option>
                <option value="ME">ME (Mechanical)</option>
                <option value="EE">EE (Electrical)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">CGPA (Scale 0.0 - 10.0)</label>
              <input
                id="input-student-cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              id="btn-cancel-student"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-student"
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              {isEditing ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
