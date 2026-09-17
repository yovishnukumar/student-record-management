import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getAllStudents, upsertStudent, deleteStudentByRollNo, seedInitialStudentsIfEmpty } from './src/db/students.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', provider: 'cloudsql_postgresql' });
  });

  // User synchronization endpoint
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Missing user credentials' });
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email || '');
      res.json({ user });
    } catch (error: any) {
      console.error('Failed to sync user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // Get all students from Cloud SQL
  app.get('/api/students', optionalAuth, async (_req, res) => {
    try {
      await seedInitialStudentsIfEmpty();
      const records = await getAllStudents();
      res.json({ students: records });
    } catch (error: any) {
      console.error('Failed to get students from Cloud SQL:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch students' });
    }
  });

  // Upsert a student into Cloud SQL
  app.post('/api/students', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { rollNo, name, department, cgpa } = req.body;
      if (!rollNo || !name || department === undefined || cgpa === undefined) {
        return res.status(400).json({ error: 'Missing required student fields' });
      }

      let userId: number | undefined;
      if (req.user?.uid) {
        try {
          const u = await getOrCreateUser(req.user.uid, req.user.email || '');
          userId = u.id;
        } catch {
          // Non-blocking user link
        }
      }

      const saved = await upsertStudent({
        rollNo,
        name,
        department,
        cgpa: parseFloat(cgpa),
        userId,
      });

      res.json({ student: saved });
    } catch (error: any) {
      console.error('Failed to upsert student:', error);
      res.status(500).json({ error: error.message || 'Failed to save student' });
    }
  });

  // Delete a student from Cloud SQL
  app.delete('/api/students/:rollNo', optionalAuth, async (req, res) => {
    try {
      const { rollNo } = req.params;
      const deleted = await deleteStudentByRollNo(rollNo);
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error('Failed to delete student:', error);
      res.status(500).json({ error: error.message || 'Failed to delete student' });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud SQL Storage Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
