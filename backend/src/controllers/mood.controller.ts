import { Request, Response, NextFunction } from 'express';
import { MoodService } from '../services/mood.service';
import { MoodRepository } from '../repositories/mood.repository';
import { AppError } from '../utils/errors';

const moodRepository = new MoodRepository();
const moodService = new MoodService(moodRepository);

export class MoodController {
  public async logMood(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';
      const { moodScore } = req.body;

      if (typeof moodScore !== 'number' || moodScore < 1 || moodScore > 5) {
        throw new AppError('Mood score must be a number between 1 and 5.', 400);
      }

      const record = await moodService.logMood(userId, moodScore);

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || '00000000-0000-0000-0000-000000000000';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const history = await moodService.getMoodHistory(userId, limit);
      const stats = await moodService.getMoodAnalytics(userId);

      // Re-structure to represent dates for easier client chart plotting
      const chartData = history.reverse().map((record) => ({
        date: record.logged_at.toISOString().split('T')[0],
        moodScore: record.mood_score,
      }));

      res.status(200).json({
        success: true,
        data: {
          history: chartData,
          stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
