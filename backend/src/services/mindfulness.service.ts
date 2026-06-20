import { GeminiService } from './gemini.service';

export class MindfulnessService {
  constructor(private geminiService: GeminiService) {}

  public async getMindfulnessRecommendation(moodScore: number, stressLevel: number): Promise<string> {
    return this.geminiService.generateMindfulnessExercise(moodScore, stressLevel);
  }
}
