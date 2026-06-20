import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export interface TriggerAnalysis {
  category: string;
  intensity: number;
  evidence: string;
}

export interface JournalAnalysisResult {
  dominantEmotion: string;
  stressLevel: number;
  detectedTriggers: TriggerAnalysis[];
  copingStrategy: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-1.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      logger.warn('GEMINI_API_KEY not set. GeminiService will run in fallback simulation mode.');
    }
  }

  /**
   * Helper to fetch model instance
   */
  private getModel(systemInstruction?: string, isJson = false) {
    if (!this.genAI) return null;
    return this.genAI.getGenerativeModel({
      model: this.modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: isJson ? { responseMimeType: 'application/json' } : undefined,
      systemInstruction,
    });
  }

  /**
   * Performs GenAI sentiment and stress trigger extraction on a student's journal
   */
  public async analyzeJournal(content: string, targetExam: string): Promise<JournalAnalysisResult> {
    const systemInstruction = `
      You are an expert student mental health advisor and counselor. 
      Analyze the student's daily journal entry. The student is preparing for the highly competitive ${targetExam} exam.
      Identify hidden stress triggers (e.g., peer pressure, syllabus backlogs, score anxiety, parental expectations, sleep deprivation).
      You must respond ONLY with a JSON object conforming to this TypeScript interface:
      interface Response {
        dominantEmotion: string; // The primary emotion (e.g., "Anxious", "Fatigued", "Overwhelmed", "Hopeful", "Frustrated")
        stressLevel: number; // An integer between 1 and 10
        detectedTriggers: Array<{
          category: string; // The trigger name (e.g., "Peer Comparison", "Syllabus Load", "Mock Test Results", "Lack of Sleep")
          intensity: number; // An integer between 1 and 10 representing the severity of this specific stressor
          evidence: string; // A direct quote or phrase from the journal demonstrating this trigger (max 100 characters)
        }>;
        copingStrategy: string; // A supportive, action-oriented strategy tailored to the identified triggers and target exam.
      }
    `;

    try {
      const model = this.getModel(systemInstruction, true);
      if (!model) {
        return this.getFallbackAnalysis(content, targetExam);
      }

      const prompt = `Student Journal Entry:\n"""\n${content}\n"""`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      logger.info('Gemini raw analysis response: ' + responseText);
      const parsed = JSON.parse(responseText.trim()) as JournalAnalysisResult;
      
      // Safety defaults validation
      if (!parsed.dominantEmotion || typeof parsed.stressLevel !== 'number') {
        throw new Error('Invalid JSON structure returned by Gemini API');
      }

      return parsed;
    } catch (error) {
      logger.error('Gemini journal analysis failed. Falling back to local rules:', error);
      return this.getFallbackAnalysis(content, targetExam);
    }
  }

  /**
   * Generates a personalized mindfulness recommendation based on stress levels
   */
  public async generateMindfulnessExercise(moodScore: number, stressLevel: number): Promise<string> {
    const systemInstruction = `
      You are a calming mindfulness and meditation guide. 
      Create a short, practical 3-minute exercise for an exam-stressed student.
      Adapt the exercise to their state:
      - Low Mood (${moodScore}/5) and High Stress (${stressLevel}/10): Focus on calming, anxiety-reducing box breathing or grounding.
      - Low Mood (${moodScore}/5) and Low Stress (${stressLevel}/10): Focus on motivational visualizations and mild energy boosts.
      Keep it brief, comforting, and bulleted.
    `;

    try {
      const model = this.getModel(systemInstruction, false);
      if (!model) {
        return this.getFallbackMindfulness(moodScore, stressLevel);
      }

      const result = await model.generateContent('Generate a custom 3-minute grounding exercise.');
      return result.response.text().trim();
    } catch (error) {
      logger.error('Gemini mindfulness generation failed:', error);
      return this.getFallbackMindfulness(moodScore, stressLevel);
    }
  }

  /**
   * Generates motivational encouragement
   */
  public async generateEncouragement(targetExam: string, moodScore: number): Promise<string> {
    const systemInstruction = `
      You are an inspiring mentor. 
      Write a short, highly motivating 2-sentence affirmation or encouraging word for a student studying for ${targetExam}.
      Tone should be warm, validating, and empathetic. Do not use generic cliches. Address their mood level of ${moodScore}/5.
    `;

    try {
      const model = this.getModel(systemInstruction, false);
      if (!model) {
        return `Remember, preparing for ${targetExam} is a marathon, not a sprint. Take it one question at a time. You are capable of handling this!`;
      }

      const result = await model.generateContent('Provide motivational words.');
      return result.response.text().trim();
    } catch (error) {
      logger.error('Gemini encouragement generation failed:', error);
      return `Remember, preparing for ${targetExam} is a marathon, not a sprint. Take it one question at a time. You are capable of handling this!`;
    }
  }

  /**
   * Interactive Conversational AI Companion
   */
  public async chatCompanion(
    message: string,
    history: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>,
    targetExam: string
  ): Promise<string> {
    const systemInstruction = `
      You are a supportive, warm, and highly empathetic conversational AI companion named "MirrorGuide" for students preparing for the competitive ${targetExam} exam.
      
      CORE RULES:
      1. You are NOT a doctor or therapist. You must never diagnose, prescribe, or give medical advice.
      2. Keep responses brief, conversational, and light (under 150 words). Avoid overwhelming the student with text.
      3. Focus on listening actively, validating their feelings, and proposing simple exam-life tips (e.g., pomodoro breaks, staying hydrated, focusing on progress).
      4. Crisis Protocol: If the user indicates self-harm, suicidal thoughts, or severe mental distress, you MUST output this exact phrase and NOTHING else:
         "[CRISIS_TRIGGER_ALERT] Please reach out for immediate support. You can call the national helpline at 112 or student support networks. You do not have to go through this alone."
    `;

    try {
      const model = this.getModel(systemInstruction, false);
      if (!model) {
        return `I am here to support you. Let's take a deep breath. Preparing for ${targetExam} can be tough, but you are taking it step by step. What topic is on your mind right now?`;
      }

      // Format history matching the Gemini API schema
      const chat = model.startChat({
        history: history.map(item => ({
          role: item.role,
          parts: item.parts.map(p => ({ text: p.text })),
        })),
      });

      const result = await chat.sendMessage(message);
      return result.response.text().trim();
    } catch (error) {
      logger.error('Gemini chat failed. Running mock companion:', error);
      return `I hear you. The pressure of ${targetExam} is real. Let's focus on doing a small, manageable task right now. Remember to drink some water!`;
    }
  }

  // --- Fallback rule-based handlers ---

  private getFallbackAnalysis(content: string, targetExam: string): JournalAnalysisResult {
    const contentLower = content.toLowerCase();
    const result: JournalAnalysisResult = {
      dominantEmotion: 'Anxious',
      stressLevel: 6,
      detectedTriggers: [],
      copingStrategy: 'Break your syllabus down into daily micro-sessions. Try a 5-minute breathing break before your next study slot.',
    };

    if (contentLower.includes('mock') || contentLower.includes('score') || contentLower.includes('test')) {
      result.detectedTriggers.push({
        category: 'Mock Test Score Anxiety',
        intensity: 8,
        evidence: content.substring(0, 50),
      });
      result.stressLevel = 8;
      result.dominantEmotion = 'Overwhelmed';
      result.copingStrategy = `Mock scores do not define your potential for ${targetExam}. Use them strictly as a roadmap of things to practice. Review chemistry errors today with zero pressure.`;
    }

    if (contentLower.includes('parent') || contentLower.includes('father') || contentLower.includes('mother')) {
      result.detectedTriggers.push({
        category: 'Parental Pressure',
        intensity: 7,
        evidence: 'family concern / expectation logs',
      });
      result.stressLevel = Math.max(result.stressLevel, 7);
    }

    if (contentLower.includes('syllabus') || contentLower.includes('backlog') || contentLower.includes('revision')) {
      result.detectedTriggers.push({
        category: 'Syllabus Backlog',
        intensity: 8,
        evidence: 'syllabus overload comments',
      });
      result.stressLevel = Math.max(result.stressLevel, 7);
      result.copingStrategy = 'Set a timer for 25 minutes. Study only one topic. Stop immediately and rest. Small steps beat heavy planning.';
    }

    if (result.detectedTriggers.length === 0) {
      result.detectedTriggers.push({
        category: 'General Study Fatigue',
        intensity: 5,
        evidence: 'general context analysis',
      });
    }

    return result;
  }

  private getFallbackMindfulness(moodScore: number, stressLevel: number): string {
    if (moodScore <= 2 || stressLevel >= 7) {
      return `### 3-Minute Box Breathing Exercise (Calming)
1. **Inhale**: Breathe in slowly through your nose for 4 seconds.
2. **Hold**: Keep the air in your lungs for 4 seconds.
3. **Exhale**: Release the breath through your mouth for 4 seconds.
4. **Hold**: Rest with empty lungs for 4 seconds.
*Repeat this cycle 4 times to calm your autonomic nervous system.*`;
    }
    
    return `### 3-Minute Sensory Grounding (Focus)
*Name these things in your study environment:*
- **5 things** you can see (your books, pen, light, desk)
- **4 things** you can touch (the paper, chair under you)
- **3 things** you can hear (fan, traffic, wind)
- **2 things** you can smell
- **1 thing** you can taste or positive thought.`;
  }

  /**
   * Performs cognitive reframing and study checklists for mock exam panic (MTCR)
   */
  public async reframeMockTestScore(
    subject: string,
    score: number,
    maxScore: number,
    examType: string,
    mistakesSummary?: string
  ): Promise<{ cognitiveReframe: string; actionChecklist: Array<{ id: string; task: string; durationMinutes: number }> }> {
    const systemInstruction = `
      You are an expert academic coach and student mental health advisor.
      The student logged a mock test score for ${examType} and is experiencing stress.
      Perform cognitive reframing of their score, treating it as a diagnostic growth checklist, not a verdict.
      Structure your response exactly as JSON conforming to this TypeScript interface:
      interface Response {
        cognitiveReframe: string; // Empathy-driven, validating, and reframing message (max 3 sentences)
        actionChecklist: Array<{
          id: string; // Unique string, e.g., "task-1", "task-2"
          task: string; // Specific, low-stress study task to resolve mistakes (e.g., review optics formula card) (max 100 characters)
          durationMinutes: number; // Suggested duration between 10 and 30 minutes
        }>;
      }
    `;

    try {
      const model = this.getModel(systemInstruction, true);
      if (!model) {
        return this.getFallbackMockReframe(subject, score, maxScore, examType);
      }

      const prompt = `Mock Score Details:\nSubject: ${subject}\nScore: ${score}/${maxScore}\nMistakes Context: ${mistakesSummary || 'None provided'}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      logger.info('Gemini raw reframe response: ' + text);
      const parsed = JSON.parse(text.trim()) as {
        cognitiveReframe: string;
        actionChecklist: Array<{ id: string; task: string; durationMinutes: number }>;
      };

      if (!parsed.cognitiveReframe || !Array.isArray(parsed.actionChecklist)) {
        throw new Error('Invalid JSON structure returned by Gemini API');
      }

      return parsed;
    } catch (error) {
      logger.error('Gemini mock test reframe failed. Using fallback:', error);
      return this.getFallbackMockReframe(subject, score, maxScore, examType);
    }
  }

  private getFallbackMockReframe(
    subject: string,
    score: number,
    maxScore: number,
    examType: string
  ): { cognitiveReframe: string; actionChecklist: Array<{ id: string; task: string; durationMinutes: number }> } {
    const percentage = Math.round((score / maxScore) * 100);
    let cognitiveReframe = `A score of ${score}/${maxScore} (${percentage}%) is simply a progress snapshot, not the final destination. You have identified specific areas to grow. Let's work on them methodically.`;
    
    if (percentage < 50) {
      cognitiveReframe = `This mock test highlighted exactly where the conceptual gaps are. Scoring ${percentage}% now means you have room to unlock substantial points before the actual ${examType} exam.`;
    } else if (percentage >= 80) {
      cognitiveReframe = `Great baseline of ${percentage}% in ${subject}! Focus now on fine-tuning the remaining 20% by targeting micro-mistakes.`;
    }

    return {
      cognitiveReframe,
      actionChecklist: [
        { id: 'task-1', task: `Review the top 3 incorrect questions in ${subject} with zero time limit.`, durationMinutes: 20 },
        { id: 'task-2', task: 'Summarize the core formula or mechanism that caused the error on a single flashcard.', durationMinutes: 15 },
        { id: 'task-3', task: 'Take a complete 5-minute break away from screens before starting any revisions.', durationMinutes: 5 }
      ]
    };
  }
}

