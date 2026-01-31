import { eq } from 'drizzle-orm';
import { db, pool } from './db/db.js';
import { matches, commentary } from './db/schema.js';

async function main() {
  try {
    console.log('Performing CRUD operations on sports data...');

    // CREATE: Insert a new match
    const [newMatch] = await db
      .insert(matches)
      .values({
        sport: 'Football',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        status: 'scheduled',
        startTime: new Date(),
      })
      .returning();

    if (!newMatch) {
      throw new Error('Failed to create match');
    }

    console.log('✅ CREATE: New match created:', newMatch);

    // READ: Select the match
    const foundMatch = await db
      .select()
      .from(matches)
      .where(eq(matches.id, newMatch.id));
    console.log('✅ READ: Found match:', foundMatch[0]);

    // UPDATE: Change match status
    const [updatedMatch] = await db
      .update(matches)
      .set({ status: 'live', homeScore: 1 })
      .where(eq(matches.id, newMatch.id))
      .returning();

    if (!updatedMatch) {
      throw new Error('Failed to update match');
    }

    console.log('✅ UPDATE: Match updated:', updatedMatch);

    // DELETE: Remove the match
    await db.delete(matches).where(eq(matches.id, newMatch.id));
    console.log('✅ DELETE: Match deleted.');

    console.log('\nCRUD operations completed successfully.');
  } catch (error) {
    console.error('❌ Error performing CRUD operations:', error);
    process.exitCode = 1;
  } finally {
    // Close the pool connection
    if (pool) {
      try {
        await pool.end();
        console.log('Database pool closed.');
      } catch (error) {
        console.error('❌ Error closing database pool:', error);
      }
    }
  }
}

main();