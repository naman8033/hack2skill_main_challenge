import { z } from 'zod';

const chatMessageRole = z.enum(['user', 'model']);

const chatMessagePart = z.object({
  text: z.string().min(1, 'Message text part cannot be empty'),
});

const chatHistoryItem = z.object({
  role: chatMessageRole,
  parts: z.array(chatMessagePart).min(1, 'At least one message part is required'),
});

export const chatMessageSchema = z.object({
  message: z.string({
    required_error: 'Message content is required',
  })
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message cannot exceed 2000 characters'),

  userId: z.string().uuid('Invalid user UUID format').optional(),
  
  history: z.array(chatHistoryItem).optional(),
});
