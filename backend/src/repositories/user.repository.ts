import { query } from '../config/db';

export interface User {
  id: string;
  email: string;
  full_name: string;
  target_exam: string;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository {
  public async findById(id: string): Promise<User | null> {
    const text = `
      SELECT id, email, full_name, target_exam, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const result = await query(text, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0] as User;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const text = `
      SELECT id, email, full_name, target_exam, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
    const result = await query(text, [email]);
    if (result.rows.length === 0) return null;
    return result.rows[0] as User;
  }

  public async create(email: string, fullName: string, targetExam: string): Promise<User> {
    const text = `
      INSERT INTO users (email, full_name, target_exam)
      VALUES ($1, $2, $3)
      RETURNING id, email, full_name, target_exam, created_at, updated_at;
    `;
    const result = await query(text, [email, fullName, targetExam]);
    return result.rows[0] as User;
  }
}
