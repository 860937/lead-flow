const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAdminByUsername, getLeads, getLeadById, updateLeadStatus } = require('../db/database');
const { requireAdminAuth, JWT_SECRET } = require('../middleware/auth');
const { adminLoginLimiter } = require('../middleware/rateLimiter');
const { formatPhoneForWhatsApp } = require('../services/mailer');

// POST /api/admin/login
router.post('/login', adminLoginLimiter, (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const admin = getAdminByUsername(username.trim());
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      success: true,
      message: 'Login successful',
      user: { username: admin.username }
    });
  } catch (err) {
    console.error('[Admin] Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/admin/me
router.get('/me', requireAdminAuth, (req, res) => {
  return res.json({ success: true, user: req.admin });
});

// GET /api/admin/leads
router.get('/leads', requireAdminAuth, (req, res) => {
  try {
    const { status } = req.query;
    const leads = getLeads(status);

    // Enhance leads with direct WhatsApp reply link for admin dashboard
    const enhancedLeads = leads.map(l => {
      const waNumber = formatPhoneForWhatsApp(l.phone);
      const text = encodeURIComponent(`Hi ${l.full_name}, this is from Lead Flow regarding your ${l.service} inquiry.`);
      return {
        ...l,
        whatsapp_url: `https://wa.me/${waNumber}?text=${text}`
      };
    });

    return res.json({
      success: true,
      count: enhancedLeads.length,
      leads: enhancedLeads
    });
  } catch (err) {
    console.error('[Admin] Leads fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve leads' });
  }
});

// PATCH /api/admin/leads/:id/status
router.patch('/leads/:id/status', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = ['new', 'contacted', 'qualified', 'closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const lead = getLeadById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    updateLeadStatus(id, status, notes !== undefined ? notes : lead.notes);
    return res.json({ success: true, message: 'Lead status updated successfully' });
  } catch (err) {
    console.error('[Admin] Status update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update lead status' });
  }
});

// GET /api/admin/export-csv
router.get('/export-csv', requireAdminAuth, (req, res) => {
  try {
    const leads = getLeads('all');

    const headers = [
      'ID', 'Date', 'Full Name', 'Phone', 'Email', 'Company', 'Service',
      'Budget', 'Preferred Contact', 'Details', 'Status', 'Notes',
      'Source Page', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Referrer'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = leads.map(l => [
      l.id,
      escapeCsv(l.created_at),
      escapeCsv(l.full_name),
      escapeCsv(l.phone),
      escapeCsv(l.email),
      escapeCsv(l.company),
      escapeCsv(l.service),
      escapeCsv(l.budget),
      escapeCsv(l.preferred_contact),
      escapeCsv(l.project_details),
      escapeCsv(l.status),
      escapeCsv(l.notes),
      escapeCsv(l.source_page),
      escapeCsv(l.utm_source),
      escapeCsv(l.utm_medium),
      escapeCsv(l.utm_campaign),
      escapeCsv(l.referrer)
    ].join(','));

    // UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');

    const filename = `leadflow_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Admin] CSV export error:', err);
    return res.status(500).send('Error generating CSV export');
  }
});

module.exports = router;
