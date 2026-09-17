import { relations } from 'drizzle-orm';
import { doublePrecision, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table managed with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Student records stored in Cloud SQL PostgreSQL
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  rollNo: text('roll_no').notNull().unique(),
  name: text('name').notNull(),
  department: text('department').notNull(),
  cgpa: doublePrecision('cgpa').notNull(),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  owner: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
}));
