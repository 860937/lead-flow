const express = require('express');
const router = express.Router();
const validator = require('validator');
const { createLead } = require('../db/database');
const { sendLeadNotification } = require('../services/mailer');
const { leadLimiter } = require('../middleware/rateLimiter');

// Helper to sanitize strings and escape HTML tags
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

// POST /api/leads - Lead generation endpoint
router.post('/leads', leadLimiter, async (req, res) => {
  try {
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
      // Honeypot field
      bot_field,
      // Tracking
      source_page,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      referrer
    } = req.body;

    // Honeypot check: If bot filled the hidden field, silently simulate success
    if (bot_field && bot_field.trim() !== '') {
      console.warn('[Security] Honeypot triggered. Bot submission dropped silently.');
      return res.status(200).json({
        success: true,
        message: 'Your request has been received.'
      });
    }

    // Validation checks
    const errors = [];

    if (!full_name || full_name.trim().length < 2) {
      errors.push('Please enter your full name (at least 2 characters).');
    }

    if (!email || !validator.isEmail(email.trim())) {
      errors.push('Please enter a valid email address.');
    }

    if (!phone || !validateIndianPhone(phone.trim())) {
      errors.push('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
    }

    if (!service || service.trim() === '') {
      errors.push('Please select a service needed.');
    }

    if (!budget || budget.trim() === '') {
      errors.push('Please select an estimated budget range.');
    }

    // DPDP Act 2023 compliance: Explicit consent mandatory
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

    // Clean inputs
    const sanitizedLead = {
      created_at: new Date().toISOString(),
      full_name: cleanInput(full_name),
      email: validator.normalizeEmail(email.trim()) || email.trim(),
      phone: phone.trim().replace(/[\s-]/g, ''),
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
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };

    // Store in SQLite database
    const leadId = createLead(sanitizedLead);
    sanitizedLead.id = leadId;

    // Trigger instant email notification asynchronously (without blocking response)
    sendLeadNotification(sanitizedLead).catch(err => {
      console.error('[LeadRoute] Background mail error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your quote request has been received. Our team will review your project and connect with you shortly.',
      leadId: leadId
    });

  } catch (error) {
    console.error('[LeadRoute] Server error processing lead:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your request. Please try again or reach out directly on WhatsApp (+91 76048 94572).'
    });
  }
});

module.exports = router;
