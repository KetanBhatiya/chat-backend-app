import { Router } from 'express';
import { createChat, sendMessage, getMessages } from '../controllers/chat.controller.js';

const router = Router();

router.post('/create', createChat);
router.post('/:chatId/message/send', sendMessage);
router.get('/:chatId/messages', getMessages);

export default router;
