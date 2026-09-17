import { db } from './index.ts';
import { students } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface StudentInput {
  rollNo: string;
  name: string;
  department: string;
  cgpa: number;
  userId?: number;
}

export async function getAllStudents() {
  try {
    return await db.select().from(students).orderBy(students.id);
  } catch (error) {
    console.error('Database getAllStudents query failed:', error);
    throw new Error('Failed to retrieve student records from Cloud SQL.', { cause: error });
  }
}

export async function upsertStudent(input: StudentInput) {
  try {
    const result = await db
      .insert(students)
      .values({
        rollNo: input.rollNo.toUpperCase(),
        name: input.name,
        department: input.department.toUpperCase(),
        cgpa: input.cgpa,
        userId: input.userId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: students.rollNo,
        set: {
          name: input.name,
          department: input.department.toUpperCase(),
          cgpa: input.cgpa,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database upsertStudent failed:', error);
    throw new Error('Failed to save student record to Cloud SQL.', { cause: error });
  }
}

export async function deleteStudentByRollNo(rollNo: string) {
  try {
    const result = await db
      .delete(students)
      .where(eq(students.rollNo, rollNo.toUpperCase()))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database deleteStudentByRollNo failed:', error);
    throw new Error('Failed to delete student record from Cloud SQL.', { cause: error });
  }
}

export async function seedInitialStudentsIfEmpty() {
  try {
    const existing = await db.select().from(students).limit(1);
    if (existing.length === 0) {
      const initial = [
        { rollNo: 'CS21B001', name: 'Alan Turing', department: 'CSE', cgpa: 9.85 },
        { rollNo: 'CS21B002', name: 'Ada Lovelace', department: 'CSE', cgpa: 9.92 },
        { rollNo: 'EC21B014', name: 'Claude Shannon', department: 'ECE', cgpa: 9.40 },
        { rollNo: 'CS21B028', name: 'Grace Hopper', department: 'CSE', cgpa: 9.65 },
        { rollNo: 'ME21B033', name: 'James Watt', department: 'ME', cgpa: 8.15 },
        { rollNo: 'AI21B045', name: 'Geoffrey Hinton', department: 'AI', cgpa: 9.78 },
      ];

      for (const item of initial) {
        await db.insert(students).values(item).onConflictDoNothing();
      }
    }
  } catch (error) {
    console.warn('Initial seed skipped or failed:', error);
  }
}
