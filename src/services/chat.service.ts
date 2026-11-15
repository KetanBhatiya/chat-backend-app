import { db } from '../config/firebase.js';
import pool from '../config/database.js';
import { AppError } from '../middlewares/error.js';
import { FieldValue } from 'firebase-admin/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface CreateChatResult {
  chatId: string;
}

export class ChatService {
  public static async getOrCreateChat(
    userAId: string,
    userBId: string
  ): Promise<CreateChatResult> {
    const [userA, userB] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const usersCheck = await client.query(
        'SELECT id FROM users WHERE id IN ($1, $2)',
        [userA, userB]
      );

      if (usersCheck.rows.length < 2) {
        throw new AppError('One or both users do not exist', 404);
      }

      const existingChat = await client.query(
        'SELECT id FROM chats WHERE user_a_id = $1 AND user_b_id = $2',
        [userA, userB]
      );

      if (existingChat.rows.length > 0) {
        await client.query('COMMIT');
        return { chatId: existingChat.rows[0].id };
      }

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

        await client.query(
          `INSERT INTO chat_members (chat_id, user_id)
           VALUES ($1, $2), ($1, $3)
           ON CONFLICT (chat_id, user_id) DO NOTHING`,
          [chatId, userA, userB]
        );
      } else {
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

  public static async verifyChatAndMember(
    chatId: string,
    userId: string
  ): Promise<void> {
    const chatMember = await pool.query(
      'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chatId, userId]
    );

    if (chatMember.rows.length === 0) {
      throw new AppError('Chat not found or user is not a member', 404);
    }
  }

  public static async verifyMessageExists(chatId: string, messageId: string): Promise<void> {
    const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
    const doc = await messageRef.get();
    if (!doc.exists) {
      throw new AppError('Message not found', 404);
    }
  }

  public static async sendMessage(
    chatId: string,
    senderId: string,
    text: string
  ): Promise<ChatMessage> {
    await this.verifyChatAndMember(chatId, senderId);

    const messageRef = db.collection('chats').doc(chatId).collection('messages').doc();
    const createdAt = FieldValue.serverTimestamp();

    const messageData = {
      senderId,
      text,
      createdAt,
    };

    await messageRef.set(messageData);

    return {
      id: messageRef.id,
      senderId,
      text,
      createdAt,
    };
  }

  public static async getMessages(
    chatId: string,
    limit: number
  ): Promise<ChatMessage[]> {
    const chatExists = await pool.query('SELECT 1 FROM chats WHERE id = $1', [chatId]);
    if (chatExists.rows.length === 0) {
      throw new AppError('Chat not found', 404);
    }

    const messagesSnapshot = await db
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return messagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ChatMessage, 'id' | 'createdAt'>),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  }

  public static async markMessageRead(
    chatId: string,
    messageId: string,
    userId: string
  ): Promise<{ messageId: string; userId: string }> {
    await this.verifyChatAndMember(chatId, userId);
    await this.verifyMessageExists(chatId, messageId);

    const receiptRef = db
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId)
      .collection('readReceipts')
      .doc(userId);

    await receiptRef.set({
      userId,
      readAt: FieldValue.serverTimestamp(),
    });

    return { messageId, userId };
  }

  public static async updateLastSeen(
    chatId: string,
    userId: string,
    messageId: string
  ): Promise<{ userId: string; messageId: string }> {
    await this.verifyChatAndMember(chatId, userId);
    await this.verifyMessageExists(chatId, messageId);

    const lastSeenRef = db
      .collection('chats')
      .doc(chatId)
      .collection('lastSeen')
      .doc(userId);

    await lastSeenRef.set({
      userId,
      messageId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { userId, messageId };
  }
}
