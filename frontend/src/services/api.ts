import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TriggerAnalysis {
  category: string;
  intensityScore: number;
  evidenceSnippet: string;
}

export interface JournalSubmissionResponse {
  journalId: string;
  moodScore: number;
  dominantEmotion: string;
  stressLevel: number;
  detectedTriggers: TriggerAnalysis[];
  copingStrategies: string[];
}

export interface MoodAnalyticsData {
  history: Array<{ date: string; moodScore: number }>;
  stats: {
    average: number;
    count: number;
  };
}

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

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  target_exam: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface MockTestRecord {
  id: string;
  user_id: string;
  subject: string;
  score: number;
  max_score: number;
  exam_type: string;
  mistakes_summary?: string;
  calmed_after_exercise: boolean;
  reframed_response?: string;
  created_at: string;
}

export const apiService = {
  // User Profile
  async registerUser(email: string, fullName: string, targetExam: string): Promise<UserProfile> {
    const res = await apiClient.post('/users', { email, fullName, targetExam });
    return res.data.data;
  },

  async getUser(id: string): Promise<UserProfile> {
    const res = await apiClient.get(`/users/${id}`);
    return res.data.data;
  },

  // Journaling
  async submitJournal(content: string, moodScore: number, userId?: string): Promise<JournalSubmissionResponse> {
    const res = await apiClient.post('/journals', { content, moodScore, userId });
    return res.data.data;
  },

  async getJournalHistory(userId?: string): Promise<any[]> {
    const res = await apiClient.get('/journals', { params: { userId } });
    return res.data.data;
  },

  // Mood
  async logMood(moodScore: number, userId?: string): Promise<any> {
    const res = await apiClient.post('/moods', { moodScore, userId });
    return res.data.data;
  },

  async getMoodAnalytics(userId?: string): Promise<MoodAnalyticsData> {
    const res = await apiClient.get('/moods/analytics', { params: { userId } });
    return res.data.data;
  },

  // Mock Test Reframer
  async logMockTest(
    subject: string,
    score: number,
    maxScore: number,
    examType: string,
    mistakesSummary?: string,
    userId?: string
  ): Promise<ReframedMockTestResponse> {
    const res = await apiClient.post('/mock-tests', {
      subject,
      score,
      maxScore,
      examType,
      mistakesSummary,
      userId,
    });
    return res.data.data;
  },

  async getMockTestHistory(userId?: string): Promise<MockTestRecord[]> {
    const res = await apiClient.get('/mock-tests', { params: { userId } });
    return res.data.data;
  },

  // Chat Companion
  async createChatSession(userId?: string): Promise<ChatSession> {
    const res = await apiClient.post('/chat/sessions', { userId });
    return res.data.data;
  },

  async getChatSessions(userId?: string): Promise<ChatSession[]> {
    const res = await apiClient.get('/chat/sessions', { params: { userId } });
    return res.data.data;
  },

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const res = await apiClient.get(`/chat/sessions/${sessionId}/messages`);
    return res.data.data;
  },

  async sendChatMessage(sessionId: string, content: string, userId?: string): Promise<ChatMessage> {
    const res = await apiClient.post(`/chat/sessions/${sessionId}/messages`, { content, userId });
    return res.data.data;
  },
};