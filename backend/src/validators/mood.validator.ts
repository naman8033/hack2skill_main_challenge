import { z } from 'zod';

export const logMoodSchema = z.object({
  moodScore: z.number({
    required_error: 'Mood score is required',
  })
  .int('Mood score must be an integer')
  .min(1, 'Mood score must be between 1 and 5')
  .max(5, 'Mood score must be between 1 and 5'),

  userId: z.string().uuid('Invalid user UUID format').optional(),
});
