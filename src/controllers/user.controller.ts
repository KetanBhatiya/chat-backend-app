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
