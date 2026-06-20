import { ChatRepository, ChatMessage, ChatSession } from '../repositories/chat.repository';
import { GeminiService } from './gemini.service';
import { UserRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private userRepository: UserRepository,
    private geminiService: GeminiService
  ) {}

  public async createSession(userId: string): Promise<ChatSession> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }
    return this.chatRepository.createSession(userId);
  }

  public async getSessionsByUserId(userId: string): Promise<ChatSession[]> {
    return this.chatRepository.findSessionsByUserId(userId);
  }

  public async getMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found.');
    }
    return this.chatRepository.findMessagesBySessionId(sessionId);
  }

  public async sendMessage(
    userId: string,
    sessionId: string,
    content: string
  ): Promise<ChatMessage> {
    // 1. Verify user and session exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found.');
    }

    if (session.user_id !== userId) {
      throw new NotFoundError('Chat session does not belong to this user.');
    }

    // 2. Persist user message
    await this.chatRepository.createMessage(sessionId, 'user', content);

    // 3. Fetch past messages to format chat history for Gemini API
    const pastMessages = await this.chatRepository.findMessagesBySessionId(sessionId);
    
    // Format history: skip the very last user message that we just sent,
    // so we pass history *excluding* the latest message to geminiService.chatCompanion,
    // or we can pass all of it. Gemini's startChat history doesn't contain the message we are about to sendMessage with.
    // So history contains all previous messages except the current one.
    const historyForGemini = pastMessages
      .slice(0, pastMessages.length - 1)
      .map((msg) => ({
        role: (msg.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.content }],
      }));

    // 4. Invoke Gemini Companion Chat
    let assistantReply = '';
    try {
      assistantReply = await this.geminiService.chatCompanion(
        content,
        historyForGemini,
        user.target_exam
      );
    } catch (error) {
      logger.error('Gemini chat service failed, falling back to static support reply:', error);
      assistantReply = `I'm here to support you. Reaching your goal for ${user.target_exam} is a journey. Take a short 5-minute deep breathing break and tell me what specifically is stressing you.`;
    }

    // 5. Persist assistant message
    const replyMessage = await this.chatRepository.createMessage(sessionId, 'assistant', assistantReply);
    return replyMessage;
  }
}