import { Request, Response, NextFunction } from 'express';
import { JournalService } from '../services/journal.service';
import { JournalRepository } from '../repositories/journal.repository';
import { TriggerRepository } from '../repositories/trigger.repository';
import { MoodRepository } from '../repositories/mood.repository';
import { UserRepository } from '../repositories/user.repository';
import { GeminiService } from '../services/gemini.service';

const journalRepository = new JournalRepository();
const triggerRepository = new TriggerRepository();
const moodRepository = new MoodRepository();
const userRepository = new UserRepository();
const geminiService = new GeminiService();

const journalService = new JournalService(
  journalRepository,
  triggerRepository,
  moodRepository,
  userRepository,
  geminiService
);

export class JournalController {
  public async submitJournal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';
      const { content, moodScore } = req.body;

      if (!content || typeof moodScore !== 'number') {
        res.status(400).json({
          success: false,
          error: { message: 'Missing content or moodScore.' }
        });
        return;
      }

      const result = await journalService.processJournal(userId, content, moodScore);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error.message === 'CRISIS_TRIGGER_ALERT' || error.statusCode === 422) {
        res.status(422).json({
          success: false,
          error: {
            message: 'Crisis keywords detected. We care about your safety.',
            crisis: true,
            helpline: 'Vandrevala Foundation: 9999-666-555 | AASRA: 9820466726'
          }
        });
        return;
      }
      next(error);
    }
  }

  public async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || '00000000-0000-0000-0000-000000000000';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const history = await journalService.getJournalHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
}