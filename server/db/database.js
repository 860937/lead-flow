const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const isVercel = !!process.env.VERCEL;
const dataDir = isVercel
  ? path.join('/tmp', 'leadflow_data')
  : path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.warn('[Database] Could not create dataDir:', err.message);
  }
}

const dbPath = path.join(dataDir, 'leadflow.db');

let db = null;
let useJsonFallback = false;
let jsonStorePath = path.join(dataDir, 'leadflow_fallback.json');

try {
  const Database = require('better-sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

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
} catch (err) {
  console.warn('[Database] SQLite native initialization fallback to JSON store:', err.message);
  useJsonFallback = true;
}

// JSON fallback helpers if SQLite cannot be loaded in serverless
function readJsonStore() {
  if (!fs.existsSync(jsonStorePath)) {
    const defaultUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'LeadFlow@2026!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);
    return {
      leads: [],
      admin_users: [{ id: 1, username: defaultUser, password_hash: hash, created_at: new Date().toISOString() }],
      nextLeadId: 1
    };
  }
  try {
    return JSON.parse(fs.readFileSync(jsonStorePath, 'utf8'));
  } catch (e) {
    return { leads: [], admin_users: [], nextLeadId: 1 };
  }
}

function writeJsonStore(data) {
  try {
    fs.writeFileSync(jsonStorePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[Database:JSON] Write error:', e.message);
  }
}

module.exports = {
  db,

  createLead: (lead) => {
    if (!useJsonFallback && db) {
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
    } else {
      const store = readJsonStore();
      const newLead = { ...lead, id: store.nextLeadId++, status: 'new' };
      store.leads.push(newLead);
      writeJsonStore(store);
      return newLead.id;
    }
  },

  getLeads: (statusFilter) => {
    if (!useJsonFallback && db) {
      if (statusFilter && statusFilter !== 'all') {
        return db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC').all(statusFilter);
      }
      return db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    } else {
      const store = readJsonStore();
      let leads = store.leads.slice().reverse();
      if (statusFilter && statusFilter !== 'all') {
        leads = leads.filter(l => l.status === statusFilter);
      }
      return leads;
    }
  },

  getLeadById: (id) => {
    if (!useJsonFallback && db) {
      return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    } else {
      const store = readJsonStore();
      return store.leads.find(l => String(l.id) === String(id));
    }
  },

  updateLeadStatus: (id, status, notes) => {
    if (!useJsonFallback && db) {
      return db.prepare('UPDATE leads SET status = ?, notes = ? WHERE id = ?').run(status, notes || '', id);
    } else {
      const store = readJsonStore();
      const lead = store.leads.find(l => String(l.id) === String(id));
      if (lead) {
        lead.status = status;
        lead.notes = notes || '';
        writeJsonStore(store);
      }
      return { changes: 1 };
    }
  },

  getAdminByUsername: (username) => {
    if (!useJsonFallback && db) {
      return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    } else {
      const store = readJsonStore();
      return store.admin_users.find(u => u.username === username);
    }
  }
};
