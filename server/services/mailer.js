const nodemailer = require('nodemailer');

// Extract clean 10-digit number for WhatsApp link
function formatPhoneForWhatsApp(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return '91' + digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || process.env.NOTIFICATION_EMAIL || 'suganth46801@gmail.com';
  const pass = process.env.SMTP_PASS; // Gmail App Password

  if (!pass) {
    console.warn('[Mailer] Warning: SMTP_PASS is not configured in .env. Email notifications will be simulated in console.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for 587
    auth: {
      user: user,
      pass: pass
    }
  });

  return transporter;
}

/**
 * Send notification email when a new lead is captured
 */
async function sendLeadNotification(lead) {
  const recipient = process.env.NOTIFICATION_EMAIL || 'suganth46801@gmail.com';
  const sender = process.env.SMTP_FROM || `"Lead Flow Notifications" <${process.env.SMTP_USER || 'suganth46801@gmail.com'}>`;
  
  const waNumber = formatPhoneForWhatsApp(lead.phone);
  const waReplyUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${lead.full_name}, thank you for reaching out to Lead Flow regarding your ${lead.service} inquiry. How can I help you today?`)}`;

  const subject = `🚀 New Lead: ${lead.full_name} (${lead.service}) - ₹${lead.budget}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; color: #38bdf8; }
        .header p { margin: 6px 0 0; color: #94a3b8; font-size: 14px; }
        .body { padding: 28px; }
        .field { margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
        .value { font-size: 16px; color: #0f172a; margin-top: 4px; font-weight: 500; }
        .cta-box { margin: 28px 0 10px; text-align: center; }
        .wa-btn { display: inline-block; background: #25d366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
        .footer { padding: 16px 28px; background: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Lead Flow - New Lead Received</h1>
          <p>Captured on ${new Date(lead.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        <div class="body">
          <div class="field">
            <div class="label">Full Name</div>
            <div class="value">${lead.full_name}</div>
          </div>
          <div class="field">
            <div class="label">Phone / WhatsApp</div>
            <div class="value"><a href="tel:${lead.phone}" style="color: #3b82f6; text-decoration: none;">${lead.phone}</a></div>
          </div>
          <div class="field">
            <div class="label">Email Address</div>
            <div class="value"><a href="mailto:${lead.email}" style="color: #3b82f6; text-decoration: none;">${lead.email}</a></div>
          </div>
          <div class="field">
            <div class="label">Company / Brand</div>
            <div class="value">${lead.company || 'Not specified'}</div>
          </div>
          <div class="field">
            <div class="label">Service Requested</div>
            <div class="value"><strong>${lead.service}</strong></div>
          </div>
          <div class="field">
            <div class="label">Budget Estimate</div>
            <div class="value">${lead.budget}</div>
          </div>
          <div class="field">
            <div class="label">Preferred Contact Mode</div>
            <div class="value">${lead.preferred_contact || 'WhatsApp'}</div>
          </div>
          <div class="field">
            <div class="label">Project Details & Notes</div>
            <div class="value" style="white-space: pre-wrap;">${lead.project_details || 'No details provided'}</div>
          </div>
          <div class="field">
            <div class="label">Lead Source</div>
            <div class="value">${lead.source_page || 'Website'} ${lead.utm_source ? `(UTM: ${lead.utm_source} / ${lead.utm_medium})` : ''}</div>
          </div>

          <div class="cta-box">
            <a href="${waReplyUrl}" class="wa-btn" target="_blank" rel="noopener noreferrer">
              💬 Reply to ${lead.full_name} on WhatsApp
            </a>
          </div>
        </div>
        <div class="footer">
          Lead Flow • Coimbatore, Tamil Nadu • Confidential Lead Notification
        </div>
      </div>
    </body>
    </html>
  `;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[Mailer:SIMULATED] Email to ${recipient}:`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Lead: ${lead.full_name} | Phone: ${lead.phone} | Service: ${lead.service}`);
    console.log(`   WhatsApp Reply Link: ${waReplyUrl}`);
    return { simulated: true, success: true };
  }

  try {
    const info = await transport.sendMail({
      from: sender,
      to: recipient,
      subject: subject,
      html: htmlContent
    });
    console.log(`[Mailer] Lead notification sent successfully (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Mailer] Error sending lead notification email:', err.message);
    // Don't throw, so we don't break lead capture API
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendLeadNotification,
  formatPhoneForWhatsApp
};
