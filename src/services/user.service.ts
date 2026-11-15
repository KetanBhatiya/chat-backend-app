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

  public static async getUserChats(userId: string) {
    // Verify user existence
    const userCheck = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      throw new Error('User not found');
    }

    // Join with chat_members to find all chats for this user
    // Then join again to get all members for those chats
    const result = await pool.query(
      `
      SELECT
        c.id as "chatId",
        c.created_at as "createdAt",
        array_agg(cm.user_id) as members
      FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      WHERE c.id IN (
        SELECT chat_id FROM chat_members WHERE user_id = $1
      )
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      `,
      [userId]
    );

    return result.rows.map((row) => ({
      chatId: row.chatId,
      members: row.members,
      createdAt: row.createdAt,
    }));
  }
}
