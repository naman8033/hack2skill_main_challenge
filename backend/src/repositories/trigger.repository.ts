import { query } from '../config/db';

export interface StressTrigger {
  id: string;
  user_id: string;
  journal_id: string;
  category: string;
  intensity_score: number;
  evidence_snippet: string;
  detected_at: Date;
}

export interface CopingStrategy {
  id: string;
  user_id: string;
  journal_id: string;
  strategy_text: string;
  created_at: Date;
}

export class TriggerRepository {
  public async createTrigger(
    userId: string,
    journalId: string,
    category: string,
    intensityScore: number,
    evidenceSnippet: string
  ): Promise<StressTrigger> {
    const text = `
      INSERT INTO stress_triggers (user_id, journal_id, category, intensity_score, evidence_snippet)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, journal_id, category, intensity_score, evidence_snippet, detected_at;
    `;
    const params = [userId, journalId, category, intensityScore, evidenceSnippet];
    const result = await query(text, params);
    return result.rows[0] as StressTrigger;
  }

  public async findTriggersByUserId(userId: string, limit = 50): Promise<StressTrigger[]> {
    const text = `
      SELECT id, user_id, journal_id, category, intensity_score, evidence_snippet, detected_at
      FROM stress_triggers
      WHERE user_id = $1
      ORDER BY detected_at DESC
      LIMIT $2;
    `;
    const result = await query(text, [userId, limit]);
    return result.rows as StressTrigger[];
  }

  public async createCopingStrategy(
    userId: string,
    journalId: string,
    strategyText: string
  ): Promise<CopingStrategy> {
    const text = `
      INSERT INTO coping_strategies (user_id, journal_id, strategy_text)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, journal_id, strategy_text, created_at;
    `;
    const params = [userId, journalId, strategyText];
    const result = await query(text, params);
    return result.rows[0] as CopingStrategy;
  }

  public async findCopingStrategiesByUserId(userId: string, limit = 50): Promise<CopingStrategy[]> {
    const text = `
      SELECT id, user_id, journal_id, strategy_text, created_at
      FROM coping_strategies
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await query(text, [userId, limit]);
    return result.rows as CopingStrategy[];
  }
}
