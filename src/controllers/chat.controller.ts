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
