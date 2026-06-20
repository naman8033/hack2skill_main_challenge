import { query } from '../config/db';

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

export class ChatRepository {
  public async createSession(userId: string): Promise<ChatSession> {
    const text = `
      INSERT INTO chat_sessions (user_id)
      VALUES ($1)
      RETURNING id, user_id, created_at, updated_at;
    `;
    const result = await query(text, [userId]);
    return result.rows[0] as ChatSession;
  }

  public async findSessionsByUserId(userId: string): Promise<ChatSession[]> {
    const text = `
      SELECT id, user_id, created_at, updated_at
      FROM chat_sessions
      WHERE user_id = $1
      ORDER BY updated_at DESC;
    `;
    const result = await query(text, [userId]);
    return result.rows as ChatSession[];
  }

  public async findSessionById(id: string): Promise<ChatSession | null> {
    const text = `
      SELECT id, user_id, created_at, updated_at
      FROM chat_sessions
      WHERE id = $1;
    `;
    const result = await query(text, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0] as ChatSession;
  }

  public async createMessage(
    sessionId: string,
    sender: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessage> {
    const text = `
      INSERT INTO chat_messages (session_id, sender, content)
      VALUES ($1, $2, $3)
      RETURNING id, session_id, sender, content, created_at;
    `;
    const result = await query(text, [sessionId, sender, content]);
    
    // Update session updated_at
    await query(`
      UPDATE chat_sessions
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `, [sessionId]);

    return result.rows[0] as ChatMessage;
  }

  public async findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const text = `
      SELECT id, session_id, sender, content, created_at
      FROM chat_messages
      WHERE session_id = $1
      ORDER BY created_at ASC;
    `;
    const result = await query(text, [sessionId]);
    return result.rows as ChatMessage[];
  }
}