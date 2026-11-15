import { Router } from 'express';
import { registerUser, getUserChats } from '../controllers/user.controller.js';

const router = Router();

router.post('/register', registerUser);
router.get('/:userId/chats', getUserChats);

export default router;
