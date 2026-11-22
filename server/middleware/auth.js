const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'leadflow-dev-secret-super-secure-key-2026';

function requireAdminAuth(req, res, next) {
  const token = req.cookies.admin_token;

  if (!token) {
    if (req.accepts('html')) {
      return res.redirect('/admin/login.html');
    }
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.clearCookie('admin_token');
    if (req.accepts('html')) {
      return res.redirect('/admin/login.html');
    }
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
  }
}

module.exports = {
  requireAdminAuth,
  JWT_SECRET
};
