import { query } from '../config/db';

export interface MockTestRecord {
  id: string;
  user_id: string;
  subject: string;
  score: number;
  max_score: number;
  exam_type: string;
  mistakes_summary?: string;
  calmed_after_exercise: boolean;
  reframed_response?: string;
  created_at: Date;
}

export class MockTestRepository {
  public async create(
    userId: string,
    subject: string,
    score: number,
    maxScore: number,
    examType: string,
    mistakesSummary?: string,
    calmedAfterExercise = false,
    reframedResponse?: string
  ): Promise<MockTestRecord> {
    const text = `
      INSERT INTO mock_test_records (
        user_id, subject, score, max_score, exam_type, mistakes_summary, calmed_after_exercise, reframed_response
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, subject, score, max_score, exam_type, mistakes_summary, calmed_after_exercise, reframed_response, created_at;
    `;
    const params = [
      userId,
      subject,
      score,
      maxScore,
      examType,
      mistakesSummary || null,
      calmedAfterExercise,
      reframedResponse || null,
    ];
    const result = await query(text, params);
    return result.rows[0] as MockTestRecord;
  }

  public async findByUserId(userId: string, limit = 50): Promise<MockTestRecord[]> {
    const text = `
      SELECT id, user_id, subject, score, max_score, exam_type, mistakes_summary, calmed_after_exercise, reframed_response, created_at
      FROM mock_test_records
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await query(text, [userId, limit]);
    return result.rows as MockTestRecord[];
  }
}
