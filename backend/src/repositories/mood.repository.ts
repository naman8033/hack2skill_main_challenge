import { query } from '../config/db';

export interface MoodRecord {
  id: string;
  user_id: string;
  mood_score: number;
  logged_at: Date;
}

export class MoodRepository {
  public async create(userId: string, moodScore: number): Promise<MoodRecord> {
    const text = `
      INSERT INTO mood_records (user_id, mood_score)
      VALUES ($1, $2)
      RETURNING id, user_id, mood_score, logged_at;
    `;
    const params = [userId, moodScore];
    const result = await query(text, params);
    return result.rows[0] as MoodRecord;
  }

  public async findByUserId(userId: string, limit = 100): Promise<MoodRecord[]> {
    const text = `
      SELECT id, user_id, mood_score, logged_at
      FROM mood_records
      WHERE user_id = $1
      ORDER BY logged_at DESC
      LIMIT $2;
    `;
    const result = await query(text, [userId, limit]);
    return result.rows as MoodRecord[];
  }

  public async getStatsByUserId(userId: string): Promise<{ average: number; count: number }> {
    const text = `
      SELECT AVG(mood_score)::FLOAT as average, COUNT(*)::INT as count
      FROM mood_records
      WHERE user_id = $1;
    `;
    const result = await query(text, [userId]);
    return result.rows[0] as { average: number; count: number };
  }
}
