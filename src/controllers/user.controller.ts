import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service.js';
import { AppError } from '../middlewares/error.js';

const registerUserSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty'),
});

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parseResult = registerUserSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw new AppError(errorMessage, 400);
    }

    const { name } = parseResult.data;
    const result = await UserService.registerUser(name);

    return res.status(201).json({
      userId: result.userId,
      name: result.name,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);
    const chats = await UserService.getUserChats(userId);
    return res.status(200).json({ chats });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return next(new AppError('User not found', 404));
    }
    next(error);
  }
};
