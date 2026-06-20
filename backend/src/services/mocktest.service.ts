import { MockTestRepository, MockTestRecord } from '../repositories/mocktest.repository';
import { GeminiService } from './gemini.service';

export interface ReframedMockTestResponse {
  recordId: string;
  groundingPrompt: {
    required: boolean;
    type: string;
    durationSeconds: number;
  };
  reframedAnalysis: {
    cognitiveReframe: string;
    actionChecklist: Array<{ id: string; task: string; durationMinutes: number }>;
  };
}

export class MockTestService {
  constructor(
    private mockTestRepository: MockTestRepository,
    private geminiService: GeminiService
  ) {}

  public async logAndReframeMockTest(
    userId: string,
    subject: string,
    score: number,
    maxScore: number,
    examType: string,
    mistakesSummary?: string
  ): Promise<ReframedMockTestResponse> {
    // 1. Generate the reframed perspective and micro-checklist via AI
    const analysis = await this.geminiService.reframeMockTestScore(
      subject,
      score,
      maxScore,
      examType,
      mistakesSummary
    );

    // 2. Persist the mock test record in PostgreSQL
    const record = await this.mockTestRepository.create(
      userId,
      subject,
      score,
      maxScore,
      examType,
      mistakesSummary,
      true, // assume student is directed to breathing immediately
      analysis.cognitiveReframe
    );

    // 3. Formulate the response containing grounding exercises
    return {
      recordId: record.id,
      groundingPrompt: {
        required: true,
        type: '4-7-8 Breathing Technique',
        durationSeconds: 60,
      },
      reframedAnalysis: {
        cognitiveReframe: analysis.cognitiveReframe,
        actionChecklist: analysis.actionChecklist,
      },
    };
  }

  public async getHistory(userId: string, limit = 30): Promise<MockTestRecord[]> {
    return this.mockTestRepository.findByUserId(userId, limit);
  }
}
