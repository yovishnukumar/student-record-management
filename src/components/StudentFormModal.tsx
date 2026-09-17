import React, { useState } from 'react';
import { X, UserPlus, Database } from 'lucide-react';
import { Student } from '../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: Student) => void;
  nextSuggestedRollNo?: string;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nextSuggestedRollNo = 'CS21B099',
}) => {
  const [rollNo, setRollNo] = useState(nextSuggestedRollNo);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [cgpa, setCgpa] = useState<number>(9.5);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim()) {
      setError('Roll number is required.');
      return;
    }
    if (!name.trim()) {
      setError('Student name is required.');
      return;
    }
    if (cgpa < 0 || cgpa > 10) {
      setError('CGPA must be between 0.00 and 10.00.');
      return;
    }

    setError(null);
    onSubmit({
      rollNo: rollNo.trim().toUpperCase(),
      name: name.trim(),
      department,
      cgpa: Number(cgpa.toFixed(2)),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Insert Student Tuple</h2>
            <p className="text-xs text-slate-400">
              Allocates on heap, indexes in Hash Table and Red-Black Tree
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1 font-mono">
              Roll Number (Primary Key)
            </label>
            <input
              id="input-student-roll-no"
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value.toUpperCase())}
              placeholder="e.g. CS21B001"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono text-xs uppercase focus:outline-none focus:border-cyan-500"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Indexed via djb2 polynomial hash with separate chaining
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Full Name</label>
            <input
              id="input-student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Margaret Hamilton"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
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
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="AI">AI</option>
                <option value="DS">DS</option>
                <option value="ME">ME</option>
                <option value="EE">EE</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 font-mono">
                CGPA (0.00 - 10.00)
              </label>
              <input
                id="input-student-cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-rose-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Indexed in Red-Black Tree
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              id="btn-cancel-student-modal"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-student-modal"
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors shadow-sm"
            >
              Insert Tuple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
