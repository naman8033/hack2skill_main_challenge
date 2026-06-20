import { Router } from 'express';
import { JournalController } from '../controllers/journal.controller';
import { MoodController } from '../controllers/mood.controller';
import { ChatController } from '../controllers/chat.controller';
import { MockTestController } from '../controllers/mocktest.controller';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/errors';

const router = Router();

const journalController = new JournalController();
const moodController = new MoodController();
const chatController = new ChatController();
const mockTestController = new MockTestController();
const userRepository = new UserRepository();

// 1. User Profiles endpoints
router.post('/users', async (req, res, next) => {
  try {
    const { email, fullName, targetExam } = req.body;
    if (!email || !fullName || !targetExam) {
      throw new AppError('Missing email, fullName, or targetExam.', 400);
    }
    const user = await userRepository.create(email, fullName, targetExam);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// 2. Journal Entry Endpoints
router.post('/journals', (req, res, next) => journalController.submitJournal(req, res, next));
router.get('/journals', (req, res, next) => journalController.getHistory(req, res, next));

// 3. Mood Analytics Endpoints
router.post('/moods', (req, res, next) => moodController.logMood(req, res, next));
router.get('/moods/analytics', (req, res, next) => moodController.getAnalytics(req, res, next));

// 4. Chat Session & Message Endpoints
router.post('/chat/sessions', (req, res, next) => chatController.createSession(req, res, next));
router.get('/chat/sessions', (req, res, next) => chatController.getSessions(req, res, next));
router.get('/chat/sessions/:sessionId/messages', (req, res, next) => chatController.getMessages(req, res, next));
router.post('/chat/sessions/:sessionId/messages', (req, res, next) => chatController.sendMessage(req, res, next));

// 5. Mock Test Reframe Endpoints
router.post('/mock-tests', (req, res, next) => mockTestController.submitMockTest(req, res, next));
router.get('/mock-tests', (req, res, next) => mockTestController.getHistory(req, res, next));

export default router;