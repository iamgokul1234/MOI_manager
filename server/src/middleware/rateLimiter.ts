import rateLimit from 'express-rate-limit';

/** Tight limit for /api/auth/* to slow down credential stuffing. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/** Generous limit for the rest of the API. */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 300,
  message: { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
