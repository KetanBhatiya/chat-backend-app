import pool from '../config/database.js';
import { AppError } from '../middlewares/error.js';

export interface CreateChatResult {
  chatId: string;
}

export class ChatService {
  public static async getOrCreateChat(
    userAId: string,
    userBId: string
  ): Promise<CreateChatResult> {
    // Normalize user pair order so userA < userB
    const [userA, userB] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify both users exist
      const usersCheck = await client.query(
        'SELECT id FROM users WHERE id IN ($1, $2)',
        [userA, userB]
      );

      if (usersCheck.rows.length < 2) {
        throw new AppError('One or both users do not exist', 404);
      }

      // Check if chat already exists
      const existingChat = await client.query(
        'SELECT id FROM chats WHERE user_a_id = $1 AND user_b_id = $2',
        [userA, userB]
      );

      if (existingChat.rows.length > 0) {
        await client.query('COMMIT');
        return { chatId: existingChat.rows[0].id };
      }

      // Insert new chat record (ON CONFLICT handles concurrent requests)
      const insertChat = await client.query(
        `INSERT INTO chats (user_a_id, user_b_id)
         VALUES ($1, $2)
         ON CONFLICT (user_a_id, user_b_id) DO NOTHING
         RETURNING id`,
        [userA, userB]
      );

      let chatId: string;

      if (insertChat.rows.length > 0) {
        chatId = insertChat.rows[0].id;

        // Insert members into chat_members table
        await client.query(
          `INSERT INTO chat_members (chat_id, user_id)
           VALUES ($1, $2), ($1, $3)
           ON CONFLICT (chat_id, user_id) DO NOTHING`,
          [chatId, userA, userB]
        );
      } else {
        // If ON CONFLICT was triggered concurrently, fetch the existing chat ID
        const raceChat = await client.query(
          'SELECT id FROM chats WHERE user_a_id = $1 AND user_b_id = $2',
          [userA, userB]
        );
        chatId = raceChat.rows[0].id;
      }

      await client.query('COMMIT');
      return { chatId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
