require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');

const { helmetConfig, noIndexHeader } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const leadsRouter = require('./routes/leads');
const adminRouter = require('./routes/admin');
const { requireAdminAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// 1. Trust proxy if behind Nginx / Cloudflare / reverse proxy
app.set('trust proxy', 1);

// 2. Security Middleware
app.use(helmetConfig);
app.use(noIndexHeader);

// 3. CORS Configuration
const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin) return callback(null, true);
    // Allow localhost for development
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    // Allow Vercel deployments (*.vercel.app) and custom domain if set
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow explicitly configured origin
    if (allowedOrigin && origin === allowedOrigin) return callback(null, true);
    // In production without an explicit allowlist, allow same-origin fetches
    // (the fetch in lead-form.js uses a relative URL so origin matches the host)
    return callback(null, true);
  },
  credentials: true
}));

// 4. Request Parsers with payload size limits (prevent DoS)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// 5. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Lead Flow Agency Lead Engine'
  });
});

// 6. Mount API Routes with Rate Limiting
app.use('/api', apiLimiter);
app.use('/api', leadsRouter);
app.use('/', leadsRouter); // Support serverless environments where /api is stripped
app.use('/api/admin', adminRouter);
app.use('/admin', adminRouter);

// 7. Protect /admin/ dashboard HTML route
app.get('/admin', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin', 'index.html'));
});

// 8. Static Files Serving with caching headers
app.use(express.static(PUBLIC_DIR, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: true,
  extensions: ['html'] // Allows requesting /services/seo-services without .html
}));

// 9. Clean URL rewrite helper for subdirectories (e.g. /services/website-development)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  let reqPath = req.path;
  // If request ends with trailing slash (except root), remove or normalize
  if (reqPath.length > 1 && reqPath.endsWith('/')) {
    reqPath = reqPath.slice(0, -1);
  }

  const potentialFile = path.join(PUBLIC_DIR, `${reqPath}.html`);
  if (fs.existsSync(potentialFile)) {
    return res.sendFile(potentialFile);
  }
  next();
});

// 10. Custom 404 Handler
app.use((req, res) => {
  res.status(404);
  const notFoundPage = path.join(PUBLIC_DIR, '404.html');
  if (fs.existsSync(notFoundPage)) {
    return res.sendFile(notFoundPage);
  }
  res.send('<h1>404 Not Found - Lead Flow</h1><p><a href="/">Return to Home</a></p>');
});

// 11. Centralized Error Handler (Never leak stack traces in production)
app.use((err, req, res, next) => {
  console.error('[ServerError]', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred. Please contact us directly at suganth46801@gmail.com or via WhatsApp.'
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Lead Flow Agency Server running on port ${PORT}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`🔒 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
