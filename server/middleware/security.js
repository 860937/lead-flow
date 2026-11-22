const helmet = require('helmet');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Allow inline scripts only if explicitly needed, but per prompt: No inline scripts for strict CSP compatibility!
        "https://challenges.cloudflare.com",
        "https://www.google.com/recaptcha/",
        "https://www.gstatic.com/recaptcha/"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Needed for dynamic CSS variable updates & transitions
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://challenges.cloudflare.com",
        "https://www.google-analytics.com",
        "https://analytics.google.com"
      ],
      frameSrc: [
        "'self'",
        "https://challenges.cloudflare.com",
        "https://www.google.com/recaptcha/",
        "https://www.google.com/maps/"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Middleware to prevent search engines from crawling /admin and /api
function noIndexHeader(req, res, next) {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  next();
}

module.exports = {
  helmetConfig,
  noIndexHeader
};
