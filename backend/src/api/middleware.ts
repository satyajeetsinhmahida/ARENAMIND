import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';

/**
 * Strips HTML tags, script elements, and truncates overly long queries.
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  const sanitize = (val: any): any => {
    if (typeof val === 'string') {
      // Remove HTML Tags and scripts
      let clean = val.replace(/<[^>]*>?/gm, '');
      clean = clean.trim();
      // Enforce max input buffer length (safety requirement)
      if (clean.length > 1000) {
        clean = clean.substring(0, 1000);
      }
      return clean;
    }
    if (typeof val === 'object' && val !== null) {
      for (const key of Object.keys(val)) {
        val[key] = sanitize(val[key]);
      }
    }
    return val;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
}

/**
 * Standard request logging middleware.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

/**
 * Rate limiting setup to protect chat endpoints from API key drainage.
 */
export const chatRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  message: {
    status: 429,
    message: "Too many request queries. Please slow down and try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});
