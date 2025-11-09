/**
 * Migration script: Convert studentId to studentIds array in sessions.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessionsPath = join(__dirname, '..', 'data', 'sessions.json');

console.log('🔄 Migrating sessions from studentId to studentIds...');

try {
  // Read sessions
  const sessionsData = readFileSync(sessionsPath, 'utf8');
  const sessions = JSON.parse(sessionsData);

  let migratedCount = 0;

  // Migrate each session
  const migratedSessions = sessions.map(session => {
    if (session.studentId && !session.studentIds) {
      // Convert studentId to studentIds array
      const { studentId, ...rest } = session;
      migratedCount++;
      return {
        ...rest,
        studentIds: [studentId]
      };
    }
    return session;
  });

  // Write back
  writeFileSync(sessionsPath, JSON.stringify(migratedSessions, null, 2));

  console.log(`✅ Migration complete! Migrated ${migratedCount} sessions.`);
  console.log(`📊 Total sessions: ${sessions.length}`);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}

