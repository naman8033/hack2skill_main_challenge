import { JournalRepository, JournalEntry } from '../repositories/journal.repository';
import { TriggerRepository } from '../repositories/trigger.repository';
import { MoodRepository } from '../repositories/mood.repository';
import { UserRepository } from '../repositories/user.repository';
import { GeminiService } from './gemini.service';
import { encrypt, decrypt } from '../utils/crypto';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ProcessedJournalResponse {
  journalId: string;
  moodScore: number;
  dominantEmotion: string;
  stressLevel: number;
  detectedTriggers: Array<{ category: string; intensityScore: number; evidenceSnippet: string }>;
  copingStrategies: string[];
}

export class JournalService {
  private crisisKeywords = [
    'suicide',
    'kill myself',
    'want to die',
    'end my life',
    'harm myself',
    'cutting myself',
    'suicidal'
  ];

  constructor(
    private journalRepository: JournalRepository,
    private triggerRepository: TriggerRepository,
    private moodRepository: MoodRepository,
    private userRepository: UserRepository,
    private geminiService: GeminiService
  ) {}

  public async processJournal(
    userId: string,
    rawContent: string,
    moodScore: number
  ): Promise<ProcessedJournalResponse> {
    // 1. Scan for severe crisis trigger keywords
    const contentLower = rawContent.toLowerCase();
    const hasCrisisSignal = this.crisisKeywords.some((kw) => contentLower.includes(kw));
    
    if (hasCrisisSignal) {
      logger.warn(`Crisis trigger keyword detected for user ${userId}. Halting AI analysis and raising crisis override.`);
      throw new AppError('CRISIS_TRIGGER_ALERT', 422); // Special status code representing Unprocessable/Crisis state
    }

    // 2. Fetch student's target exam context
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    // 3. Perform AI analysis on the journal entry
    const analysis = await this.geminiService.analyzeJournal(rawContent, user.target_exam);

    // 4. Encrypt raw text content and persist the journal entry
    const encryptedContent = encrypt(rawContent);
    const journal = await this.journalRepository.create(userId, encryptedContent, moodScore);

    // 5. Log the mood score in mood repository
    await this.moodRepository.create(userId, moodScore);

    // 6. Save detected triggers
    const savedTriggers = [];
    if (analysis.detectedTriggers && Array.isArray(analysis.detectedTriggers)) {
      for (const trigger of analysis.detectedTriggers) {
        const saved = await this.triggerRepository.createTrigger(
          userId,
          journal.id,
          trigger.category,
          trigger.intensity,
          trigger.evidence
        );
        savedTriggers.push({
          category: saved.category,
          intensityScore: saved.intensity_score,
          evidenceSnippet: saved.evidence_snippet
        });
      }
    }

    // 7. Save the AI-recommended coping strategy
    if (analysis.copingStrategy) {
      await this.triggerRepository.createCopingStrategy(userId, journal.id, analysis.copingStrategy);
    }

    // 8. Return response
    return {
      journalId: journal.id,
      moodScore,
      dominantEmotion: analysis.dominantEmotion,
      stressLevel: analysis.stressLevel,
      detectedTriggers: savedTriggers,
      copingStrategies: analysis.copingStrategy ? [analysis.copingStrategy] : []
    };
  }

  public async getJournalHistory(userId: string, limit = 50): Promise<JournalEntry[]> {
    const entries = await this.journalRepository.findByUserId(userId, limit);
    return entries.map(entry => ({
      ...entry,
      content: decrypt(entry.content)
    }));
  }
}