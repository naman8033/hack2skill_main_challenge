import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  }
});

// A stricter rate limiter specifically for heavy AI operations (Gemini invocations)
export const aiOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Generating responses too quickly. Please wait a minute before making another request.'
    }
  }
});
