// Vercel Serverless Function: POST /api/leads
// Native Vercel entry point for lead generation requests

const validator = require('validator');
const { createLead } = require('../server/db/database');
const { sendLeadNotification } = require('../server/services/mailer');

// Clean and sanitize string input
function cleanInput(str) {
  if (typeof str !== 'string') return '';
  return validator.escape(str.trim());
}

// Phone validator: Indian mobile numbers (10 digits starting with 6,7,8,9, optional +91/91/0 prefix)
function validateIndianPhone(phone) {
  if (typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s-]/g, '');
  const indianMobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return indianMobileRegex.test(clean);
}

module.exports = async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Use POST.'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const {
      full_name,
      email,
      phone,
      company,
      service,
      budget,
      project_details,
      preferred_contact,
      consent,
      bot_field,
      source_page,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      referrer
    } = body;

    // Honeypot check: If bot filled the hidden field, silently return success
    if (bot_field && String(bot_field).trim() !== '') {
      console.warn('[Security:Vercel] Honeypot triggered. Dropped silently.');
      return res.status(200).json({
        success: true,
        message: 'Your request has been received.'
      });
    }

    // Validation checks
    const errors = [];

    if (!full_name || String(full_name).trim().length < 2) {
      errors.push('Please enter your full name (at least 2 characters).');
    }

    if (!email || !validator.isEmail(String(email).trim())) {
      errors.push('Please enter a valid email address.');
    }

    if (!phone || !validateIndianPhone(String(phone).trim())) {
      errors.push('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
    }

    if (!service || String(service).trim() === '') {
      errors.push('Please select a service needed.');
    }

    if (!budget || String(budget).trim() === '') {
      errors.push('Please select an estimated budget range.');
    }

    if (!consent || (consent !== true && consent !== 'true' && consent !== 'on' && consent !== 1)) {
      errors.push('Consent to be contacted via Call, WhatsApp, or Email is required under DPDP Act.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors,
        message: errors[0]
      });
    }

    // Prepare sanitized lead
    const sanitizedLead = {
      created_at: new Date().toISOString(),
      full_name: cleanInput(full_name),
      email: validator.normalizeEmail(String(email).trim()) || String(email).trim(),
      phone: String(phone).trim().replace(/[\s-]/g, ''),
      company: cleanInput(company),
      service: cleanInput(service),
      budget: cleanInput(budget),
      project_details: cleanInput(project_details),
      preferred_contact: cleanInput(preferred_contact) || 'WhatsApp',
      consent_given: 1,
      consent_timestamp: new Date().toISOString(),
      source_page: cleanInput(source_page) || 'Direct',
      utm_source: cleanInput(utm_source),
      utm_medium: cleanInput(utm_medium),
      utm_campaign: cleanInput(utm_campaign),
      utm_term: cleanInput(utm_term),
      utm_content: cleanInput(utm_content),
      referrer: cleanInput(referrer),
      ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
    };

    // Store lead
    const leadId = createLead(sanitizedLead);
    sanitizedLead.id = leadId;

    // Send email notification asynchronously
    sendLeadNotification(sanitizedLead).catch(err => {
      console.error('[API:Leads] Notification mail error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your quote request has been received. Our team will review your project and connect with you shortly.',
      leadId: leadId
    });

  } catch (error) {
    console.error('[API:Leads] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your request. Please try again or reach out directly on WhatsApp (+91 76048 94572).'
    });
  }
};
