import { Request, Response, NextFunction } from 'express';
import { MockTestService } from '../services/mocktest.service';
import { MockTestRepository } from '../repositories/mocktest.repository';
import { GeminiService } from '../services/gemini.service';
import { AppError } from '../utils/errors';

const mockTestRepository = new MockTestRepository();
const geminiService = new GeminiService();
const mockTestService = new MockTestService(mockTestRepository, geminiService);

export class MockTestController {
  public async submitMockTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';
      const { subject, score, maxScore, examType, mistakesSummary } = req.body;

      if (!subject || typeof score !== 'number' || typeof maxScore !== 'number' || !examType) {
        throw new AppError('Missing required fields: subject, score, maxScore, and examType are required.', 400);
      }

      const result = await mockTestService.logAndReframeMockTest(
        userId,
        subject,
        score,
        maxScore,
        examType,
        mistakesSummary
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || '00000000-0000-0000-0000-000000000000';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const history = await mockTestService.getHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
