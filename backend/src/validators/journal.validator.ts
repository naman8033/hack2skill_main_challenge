import { z } from 'zod';

export const createJournalSchema = z.object({
  content: z.string({
    required_error: 'Journal content is required',
  })
  .min(3, 'Journal entry is too short (min 3 characters)')
  .max(10000, 'Journal entry exceeds max limit of 10000 characters'),
  
  moodScore: z.number({
    required_error: 'Mood score is required',
  })
  .int('Mood score must be an integer')
  .min(1, 'Mood score must be between 1 and 5')
  .max(5, 'Mood score must be between 1 and 5'),

  userId: z.string().uuid('Invalid user UUID format').optional(),
});
