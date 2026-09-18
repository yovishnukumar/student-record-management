import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StorageEngine } from './engine/storageEngine';
import { executeSqlStatement } from './engine/sqlParser';
import { Header } from './components/Header';
import { StudentDirectory } from './components/StudentDirectory';
import { HashTableVisualizer } from './components/HashTableVisualizer';
import { RedBlackTreeVisualizer } from './components/RedBlackTreeVisualizer';
import { HeapMemoryVisualizer } from './components/HeapMemoryVisualizer';
import { QueryConsole } from './components/QueryConsole';
import { EngineLogViewer } from './components/EngineLogViewer';
import { ArchitectureComparisonModal } from './components/ArchitectureComparisonModal';
import { StudentFormModal } from './components/StudentFormModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Student } from './types';

function StorageEngineDashboard() {
  const engineRef = useRef<StorageEngine | null>(null);
  const [, setTick] = useState(0);
  const { token } = useAuth();

  // Initialize engine once
  if (!engineRef.current) {
    const eng = new StorageEngine();
    eng.seedSampleData(6);
    engineRef.current = eng;
  }
  const engine = engineRef.current;

  // View state: default to simple and intuitive 'STUDENTS' view
  const [currentView, setCurrentView] = useState<'STUDENTS' | 'ENGINE'>('STUDENTS');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

  // Force re-render helper
  const refreshUI = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Fetch persisted students from Cloud SQL on initial mount
  useEffect(() => {
    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => {
        if (data.students && Array.isArray(data.students) && data.students.length > 0) {
          engine.reset();
          for (const s of data.students) {
            engine.insert({
              rollNo: s.rollNo,
              name: s.name,
              department: s.department,
              cgpa: parseFloat(s.cgpa),
            });
          }
          refreshUI();
        }
      })
      .catch((err) => {
        console.warn('Initial sync from Cloud SQL:', err);
      });
  }, [engine, refreshUI]);

  // Handler: Insert / Update Student (In-Memory Engine + Cloud SQL sync)
  const handleSaveStudent = useCallback(
    async (student: Student) => {
      const records = engine.heap.getAllRecords();
      const existing = records.find((r) => r.data.rollNo === student.rollNo);

      if (existing) {
        // Update existing student
        engine.update(student.rollNo, {
          name: student.name,
          department: student.department,
          cgpa: student.cgpa,
        });
      } else {
        // Insert new student
        engine.insert(student);
      }
      refreshUI();

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch('/api/students', {
          method: 'POST',
          headers,
          body: JSON.stringify(student),
        });
      } catch (e) {
        console.warn('Failed to persist student to Cloud SQL:', e);
      }
    },
    [engine, refreshUI, token]
  );

  // Handler: Delete student
  const handleDeleteStudent = useCallback(
    async (rollNo: string) => {
      engine.delete(rollNo);
      refreshUI();
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch(`/api/students/${encodeURIComponent(rollNo)}`, {
          method: 'DELETE',
          headers,
        });
      } catch (e) {
        console.warn('Failed to delete student from Cloud SQL:', e);
      }
    },
    [engine, refreshUI, token]
  );

  // Handler: Seed sample records
  const handleSeedData = useCallback(
    async (count: number) => {
      const existingCount = engine.heap.records.size;
      const deptList = ['CSE', 'ECE', 'AI', 'DS', 'ME'];
      const namesList = [
        'Edsger Dijkstra',
        'Tim Berners-Lee',
        'Ken Thompson',
        'Dennis Ritchie',
        'Linus Torvalds',
        'Bjarne Stroustrup',
        'Leslie Lamport',
        'Radia Perlman',
      ];

      for (let i = 0; i < count; i++) {
        const idNum = existingCount + i + 10;
        const dept = deptList[idNum % deptList.length];
        const name = namesList[idNum % namesList.length];
        const cgpa = Number((7.5 + Math.random() * 2.45).toFixed(2));
        const rollNo = `${dept.slice(0, 2)}21B0${idNum.toString().padStart(2, '0')}`;

        const item: Student = {
          rollNo,
          name,
          department: dept,
          cgpa,
        };

        engine.insert(item);
        // Persist to Cloud SQL
        fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        }).catch((err) => console.warn('Sync failed for seeded student:', err));
      }
      refreshUI();
    },
    [engine, refreshUI]
  );

  // Handler: Edit button clicked in table
  const handleOpenEditModal = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsAddModalOpen(true);
  }, []);

  // Handler: Inspect student in engine
  const handleSelectStudentInEngine = useCallback(
    (rollNo: string) => {
      engine.findByRollNo(rollNo);
      setCurrentView('ENGINE');
      refreshUI();
    },
    [engine, refreshUI]
  );

  // Handler: Force Rehash Demo
  const handleForceRehash = useCallback(() => {
    engine.forceRehash();
    refreshUI();
  }, [engine, refreshUI]);

  // Handler: Execute raw SQL
  const handleExecuteSql = useCallback(
    (sql: string) => {
      executeSqlStatement(engine, sql);
      refreshUI();
    },
    [engine, refreshUI]
  );

  // Handler: Preset Experiments
  const handleRunPreset = useCallback(
    (type: 'PK_LOOKUP' | 'RANGE_SCAN' | 'HOT_UPDATE' | 'NON_HOT_UPDATE' | 'REHASH_TRIGGER' | 'DELETE_DEMO') => {
      const records = engine.heap.getAllRecords();
      const firstRollNo = records[0]?.data.rollNo || 'CS21B001';

      switch (type) {
        case 'PK_LOOKUP':
          engine.findByRollNo(firstRollNo);
          break;
        case 'RANGE_SCAN':
          engine.queryCgpaRange(8.5, 10.0);
          break;
        case 'HOT_UPDATE': {
          const depts = ['AI', 'DS', 'ECE', 'CSE', 'ME'];
          const targetRec = records[0];
          if (targetRec) {
            const nextDept = depts[(depts.indexOf(targetRec.data.department) + 1) % depts.length];
            engine.update(targetRec.data.rollNo, { department: nextDept });
            fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rollNo: targetRec.data.rollNo,
                name: targetRec.data.name,
                department: nextDept,
                cgpa: targetRec.data.cgpa,
              }),
            }).catch((e) => console.warn('HOT update sync failed:', e));
          }
          break;
        }
        case 'NON_HOT_UPDATE': {
          const targetRec = records[0];
          if (targetRec) {
            const newCgpa = targetRec.data.cgpa >= 9.8 ? 8.9 : Number((targetRec.data.cgpa + 0.1).toFixed(2));
            engine.update(targetRec.data.rollNo, { cgpa: newCgpa });
            fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rollNo: targetRec.data.rollNo,
                name: targetRec.data.name,
                department: targetRec.data.department,
                cgpa: newCgpa,
              }),
            }).catch((e) => console.warn('Non-HOT update sync failed:', e));
          }
          break;
        }
        case 'REHASH_TRIGGER': {
          const needed = Math.ceil(engine.primaryIndex.capacity * 0.76) - engine.primaryIndex.size + 1;
          for (let i = 0; i < Math.max(1, needed); i++) {
            const roll = `TEST${Math.floor(100 + Math.random() * 900)}`;
            engine.insert({
              rollNo: roll,
              name: `Rehash Test ${i + 1}`,
              department: 'CSE',
              cgpa: Number((8.0 + Math.random() * 1.9).toFixed(2)),
            });
          }
          break;
        }
        case 'DELETE_DEMO': {
          if (records.length > 0) {
            const toDelete = records[records.length - 1].data.rollNo;
            engine.delete(toDelete);
            fetch(`/api/students/${encodeURIComponent(toDelete)}`, { method: 'DELETE' }).catch((e) =>
              console.warn('Delete sync failed:', e)
            );
          }
          break;
        }
      }
      refreshUI();
    },
    [engine, refreshUI]
  );

  // Quick In-Place Actions on Heap Cards
  const handleQuickHotUpdate = useCallback(
    (rollNo: string) => {
      const records = engine.heap.getAllRecords();
      const record = records.find((r) => r.data.rollNo === rollNo);
      if (record) {
        const nextDept = record.data.department === 'AI' ? 'CSE' : 'AI';
        engine.update(rollNo, { department: nextDept });
        refreshUI();
        fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rollNo,
            name: record.data.name,
            department: nextDept,
            cgpa: record.data.cgpa,
          }),
        }).catch((e) => console.warn('Quick HOT sync failed:', e));
      }
    },
    [engine, refreshUI]
  );

  const handleQuickNonHotUpdate = useCallback(
    (rollNo: string) => {
      const records = engine.heap.getAllRecords();
      const record = records.find((r) => r.data.rollNo === rollNo);
      if (record) {
        const newCgpa = record.data.cgpa >= 9.9 ? 8.5 : Number((record.data.cgpa + 0.1).toFixed(2));
        engine.update(rollNo, { cgpa: newCgpa });
        refreshUI();
        fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rollNo,
            name: record.data.name,
            department: record.data.department,
            cgpa: newCgpa,
          }),
        }).catch((e) => console.warn('Quick non-HOT sync failed:', e));
      }
    },
    [engine, refreshUI]
  );

  const handleSelectRollNo = useCallback(
    (rollNo: string) => {
      engine.findByRollNo(rollNo);
      refreshUI();
    },
    [engine, refreshUI]
  );

  const handleExecuteRangeScan = useCallback(
    (min: number, max: number) => {
      engine.queryCgpaRange(min, max);
      refreshUI();
    },
    [engine, refreshUI]
  );

  const handleReset = useCallback(() => {
    engine.reset();
    engine.seedSampleData(5);
    refreshUI();
  }, [engine, refreshUI]);

  const stats = engine.getStats();
  const allStudents = engine.heap.getAllRecords().map((r) => r.data);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header & Navigation Switcher */}
      <Header
        stats={stats}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenAddModal={() => {
          setEditingStudent(null);
          setIsAddModalOpen(true);
        }}
        onForceRehash={handleForceRehash}
        onOpenArchitectureModal={() => setIsArchModalOpen(true)}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {currentView === 'STUDENTS' ? (
          /* Primary Simple & Easy View: Student Directory */
          <StudentDirectory
            students={allStudents}
            onOpenAddModal={() => {
              setEditingStudent(null);
              setIsAddModalOpen(true);
            }}
            onEditStudent={handleOpenEditModal}
            onDeleteStudent={handleDeleteStudent}
            onSelectStudentInEngine={handleSelectStudentInEngine}
            onSeedData={handleSeedData}
          />
        ) : (
          /* Secondary Engine & Internals View */
          <div className="space-y-5">
            {/* Dual Index Architecture Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              <div className="h-full">
                <HashTableVisualizer
                  hashTable={engine.primaryIndex}
                  activeRollNo={engine.lastActiveRollNo}
                  onSelectRollNo={handleSelectRollNo}
                />
              </div>

              <div className="h-full">
                <RedBlackTreeVisualizer
                  tree={engine.secondaryIndex}
                  highlightedNodeIds={engine.lastHighlightedNodeIds}
                  onSelectRollNo={handleSelectRollNo}
                  onExecuteRangeScan={handleExecuteRangeScan}
                />
              </div>
            </div>

            {/* SQL Query Console & EXPLAIN ANALYZE Planner */}
            <div>
              <QueryConsole
                lastPlan={engine.lastPlan}
                onExecuteSql={handleExecuteSql}
                onRunPreset={handleRunPreset}
              />
            </div>

            {/* Address-Stable Heap Memory Pool */}
            <div>
              <HeapMemoryVisualizer
                heap={engine.heap}
                activeRollNo={engine.lastActiveRollNo}
                onSelectRollNo={handleSelectRollNo}
                onQuickHotUpdate={handleQuickHotUpdate}
                onQuickNonHotUpdate={handleQuickNonHotUpdate}
                onQuickDelete={handleDeleteStudent}
              />
            </div>

            {/* Real-Time Engine Event & Memory Pointer Stream */}
            <div>
              <EngineLogViewer
                logs={engine.logs}
                onClearLogs={() => {
                  engine.logs = [];
                  refreshUI();
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-3 px-4 text-center text-xs text-slate-500 font-mono">
        Student Record Management System • Persistent Cloud SQL Storage Engine
      </footer>

      {/* Modals */}
      <ArchitectureComparisonModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      <StudentFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleSaveStudent}
        initialStudent={editingStudent}
        nextSuggestedRollNo={`CS21B${(engine.heap.records.size + 1).toString().padStart(3, '0')}`}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StorageEngineDashboard />
    </AuthProvider>
  );
}
