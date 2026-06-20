import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { ChatRepository } from '../repositories/chat.repository';
import { UserRepository } from '../repositories/user.repository';
import { GeminiService } from '../services/gemini.service';

const chatRepository = new ChatRepository();
const userRepository = new UserRepository();
const geminiService = new GeminiService();
const chatService = new ChatService(chatRepository, userRepository, geminiService);

export class ChatController {
  public async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';
      const session = await chatService.createSession(userId);
      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || '00000000-0000-0000-0000-000000000000';
      const sessions = await chatService.getSessionsByUserId(userId);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const messages = await chatService.getMessagesBySessionId(sessionId);
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  public async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';
      const { content } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          error: { message: 'Message content is required.' },
        });
        return;
      }

      const reply = await chatService.sendMessage(userId, sessionId, content);
      res.status(201).json({
        success: true,
        data: reply,
      });
    } catch (error) {
      next(error);
    }
  }
}