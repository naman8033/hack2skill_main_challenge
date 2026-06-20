import { query } from '../config/db';

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_score: number;
  created_at: Date;
}

export class JournalRepository {
  public async create(userId: string, content: string, moodScore: number): Promise<JournalEntry> {
    const text = `
      INSERT INTO journal_entries (user_id, content, mood_score)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, content, mood_score, created_at;
    `;
    const params = [userId, content, moodScore];
    const result = await query(text, params);
    return result.rows[0] as JournalEntry;
  }

  public async findById(id: string): Promise<JournalEntry | null> {
    const text = `
      SELECT id, user_id, content, mood_score, created_at
      FROM journal_entries
      WHERE id = $1;
    `;
    const result = await query(text, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0] as JournalEntry;
  }

  public async findByUserId(userId: string, limit = 50): Promise<JournalEntry[]> {
    const text = `
      SELECT id, user_id, content, mood_score, created_at
      FROM journal_entries
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await query(text, [userId, limit]);
    return result.rows as JournalEntry[];
  }
}
