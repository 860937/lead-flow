const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Ensure data folder exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'leadflow.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & reliability
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    service TEXT NOT NULL,
    budget TEXT NOT NULL,
    project_details TEXT,
    preferred_contact TEXT DEFAULT 'WhatsApp',
    consent_given INTEGER DEFAULT 1,
    consent_timestamp TEXT,
    source_page TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer TEXT,
    ip_address TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Seed default admin user if absent
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
if (adminCount === 0) {
  const defaultUser = process.env.ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'LeadFlow@2026!';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(defaultPassword, salt);
  const now = new Date().toISOString();
  db.prepare('INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)')
    .run(defaultUser, hash, now);
  console.log(`[Database] Initialized default admin user: '${defaultUser}'`);
}

module.exports = {
  db,

  // Insert a new lead securely with parameterized query
  createLead: (lead) => {
    const stmt = db.prepare(`
      INSERT INTO leads (
        created_at, full_name, email, phone, company, service, budget,
        project_details, preferred_contact, consent_given, consent_timestamp,
        source_page, utm_source, utm_medium, utm_campaign, utm_term,
        utm_content, referrer, ip_address, status
      ) VALUES (
        @created_at, @full_name, @email, @phone, @company, @service, @budget,
        @project_details, @preferred_contact, @consent_given, @consent_timestamp,
        @source_page, @utm_source, @utm_medium, @utm_campaign, @utm_term,
        @utm_content, @referrer, @ip_address, 'new'
      )
    `);
    const result = stmt.run(lead);
    return result.lastInsertRowid;
  },

  // Retrieve leads with optional status filter
  getLeads: (statusFilter) => {
    if (statusFilter && statusFilter !== 'all') {
      return db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC').all(statusFilter);
    }
    return db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  },

  // Retrieve single lead
  getLeadById: (id) => {
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  },

  // Update lead status and notes
  updateLeadStatus: (id, status, notes) => {
    return db.prepare('UPDATE leads SET status = ?, notes = ? WHERE id = ?').run(status, notes || '', id);
  },

  // Get admin user
  getAdminByUsername: (username) => {
    return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  }
};
