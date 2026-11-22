const rateLimit = require('express-rate-limit');

// Rate limiting on lead form submissions (5 requests per 15 minutes)
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many quote requests from this IP. Please wait a few minutes or message us directly on WhatsApp (+91 76048 94572).'
  }
});

// Rate limiting on admin login attempts (5 attempts per 15 minutes)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Account temporarily locked for 15 minutes.'
  }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  }
});

module.exports = {
  leadLimiter,
  adminLoginLimiter,
  apiLimiter
};
