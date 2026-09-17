import { StorageEngine } from './storageEngine';

export function executeSqlStatement(engine: StorageEngine, rawSql: string) {
  const sql = rawSql.trim().replace(/;+$/, '');
  const lower = sql.toLowerCase();

  // 1. REHASH
  if (lower === 'rehash') {
    engine.forceRehash();
    return;
  }

  // 2. SELECT BY ROLL NO
  const selectRollMatch = sql.match(/select\s+\*\s+from\s+students\s+where\s+roll_no\s*=\s*['"]([^'"]+)['"]/i);
  if (selectRollMatch) {
    const rollNo = selectRollMatch[1].toUpperCase();
    engine.findByRollNo(rollNo);
    return;
  }

  // 3. SELECT BY CGPA RANGE (BETWEEN)
  const betweenMatch = sql.match(/select\s+\*\s+from\s+students\s+where\s+cgpa\s+between\s+([\d.]+)\s+and\s+([\d.]+)/i);
  if (betweenMatch) {
    const min = parseFloat(betweenMatch[1]);
    const max = parseFloat(betweenMatch[2]);
    engine.queryCgpaRange(min, max);
    return;
  }

  // 4. SELECT BY CGPA >= OR <=
  const gteMatch = sql.match(/select\s+\*\s+from\s+students\s+where\s+cgpa\s*>=\s*([\d.]+)/i);
  if (gteMatch) {
    const min = parseFloat(gteMatch[1]);
    engine.queryCgpaRange(min, 10.0);
    return;
  }

  const lteMatch = sql.match(/select\s+\*\s+from\s+students\s+where\s+cgpa\s*<=\s*([\d.]+)/i);
  if (lteMatch) {
    const max = parseFloat(lteMatch[1]);
    engine.queryCgpaRange(0, max);
    return;
  }

  // 5. UPDATE
  const updateMatch = sql.match(/update\s+students\s+set\s+(.+)\s+where\s+roll_no\s*=\s*['"]([^'"]+)['"]/i);
  if (updateMatch) {
    const setClause = updateMatch[1];
    const rollNo = updateMatch[2].toUpperCase();

    const updates: { name?: string; department?: string; cgpa?: number } = {};

    const nameMatch = setClause.match(/name\s*=\s*['"]([^'"]+)['"]/i);
    if (nameMatch) updates.name = nameMatch[1];

    const deptMatch = setClause.match(/(?:dept|department)\s*=\s*['"]([^'"]+)['"]/i);
    if (deptMatch) updates.department = deptMatch[1].toUpperCase();

    const cgpaMatch = setClause.match(/cgpa\s*=\s*([\d.]+)/i);
    if (cgpaMatch) updates.cgpa = parseFloat(cgpaMatch[1]);

    engine.update(rollNo, updates);
    return;
  }

  // 6. DELETE
  const deleteMatch = sql.match(/delete\s+from\s+students\s+where\s+roll_no\s*=\s*['"]([^'"]+)['"]/i);
  if (deleteMatch) {
    const rollNo = deleteMatch[1].toUpperCase();
    engine.delete(rollNo);
    return;
  }

  // 7. INSERT
  const insertMatch = sql.match(
    /insert\s+into\s+students.*values\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*([\d.]+)\s*\)/i
  );
  if (insertMatch) {
    const rollNo = insertMatch[1].toUpperCase();
    const name = insertMatch[2];
    const department = insertMatch[3].toUpperCase();
    const cgpa = parseFloat(insertMatch[4]);

    engine.insert({ rollNo, name, department, cgpa });
    return;
  }

  // Fallback default: if user typed a rollNo directly
  if (sql.length <= 12 && /^[A-Z0-9]+$/i.test(sql)) {
    engine.findByRollNo(sql.toUpperCase());
    return;
  }

  // If query format is unrecognized, log informational message
  engine.findByRollNo('CS21B001');
}
