import { MoodRepository, MoodRecord } from '../repositories/mood.repository';

export class MoodService {
  constructor(private moodRepository: MoodRepository) {}

  public async logMood(userId: string, moodScore: number): Promise<MoodRecord> {
    return this.moodRepository.create(userId, moodScore);
  }

  public async getMoodHistory(userId: string, limit = 30): Promise<MoodRecord[]> {
    return this.moodRepository.findByUserId(userId, limit);
  }

  public async getMoodAnalytics(userId: string): Promise<{ average: number; count: number }> {
    return this.moodRepository.getStatsByUserId(userId);
  }
}
