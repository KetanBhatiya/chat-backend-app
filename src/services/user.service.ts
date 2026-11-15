import pool from '../config/database.js';

export class UserService {
  public static async registerUser(name: string): Promise<{ userId: string; name: string }> {
    const query = 'INSERT INTO users (name) VALUES ($1) RETURNING id, name';
    const result = await pool.query(query, [name]);

    return {
      userId: result.rows[0].id,
      name: result.rows[0].name,
    };
  }
}
