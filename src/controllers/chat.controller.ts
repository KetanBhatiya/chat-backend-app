import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ChatService } from '../services/chat.service.js';
import { AppError } from '../middlewares/error.js';

const createChatSchema = z
  .object({
    userAId: z.string().uuid({ message: 'Invalid userAId UUID format' }),
    userBId: z.string().uuid({ message: 'Invalid userBId UUID format' }),
  })
  .refine((data) => data.userAId !== data.userBId, {
    message: 'userAId and userBId must be different',
    path: ['userBId'],
  });

export const createChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parseResult = createChatSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw new AppError(errorMessage, 400);
    }

    const { userAId, userBId } = parseResult.data;

    const result = await ChatService.getOrCreateChat(userAId, userBId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = z.object({
      chatId: z.string().uuid(),
      senderId: z.string().uuid(),
      text: z.string().min(1, 'Text cannot be empty'),
    });

    const { chatId, senderId, text } = schema.parse({
      ...req.params,
      ...req.body,
    });

    const result = await ChatService.sendMessage(chatId, senderId, text);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paramsSchema = z.object({
      chatId: z.string().uuid(),
    });
    const querySchema = z.object({
      limit: z.coerce.number().min(1).max(100).default(50),
    });

    const { chatId } = paramsSchema.parse(req.params);
    const { limit } = querySchema.parse(req.query);

    const result = await ChatService.getMessages(chatId, limit);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
