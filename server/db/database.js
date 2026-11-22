const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Determine storage directory: /tmp on Vercel/serverless (read-only filesystem elsewhere), ./data locally
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

const storePath = path.join(dataDir, 'leadflow_store.json');

// Initialize store file if it does not exist
function initStore() {
  if (!fs.existsSync(storePath)) {
    const defaultUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'LeadFlow@2026!';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);
    const initialData = {
      leads: [],
      admin_users: [
        {
          id: 1,
          username: defaultUser,
          password_hash: hash,
          created_at: new Date().toISOString()
        }
      ],
      nextLeadId: 1
    };
    try {
      fs.writeFileSync(storePath, JSON.stringify(initialData, null, 2), 'utf8');
      console.log(`[Database] Initialized storage engine with default admin: '${defaultUser}'`);
    } catch (e) {
      console.error('[Database] Failed to write initial store:', e.message);
    }
  }
}

initStore();

function readStore() {
  try {
    if (!fs.existsSync(storePath)) {
      initStore();
    }
    const raw = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Database] Read error, resetting fallback:', err.message);
    return { leads: [], admin_users: [], nextLeadId: 1 };
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Database] Write error:', err.message);
  }
}

module.exports = {
  // Insert a new lead
  createLead: (lead) => {
    const store = readStore();
    const id = store.nextLeadId++;
    const newLead = {
      id,
      created_at: lead.created_at || new Date().toISOString(),
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company || '',
      service: lead.service,
      budget: lead.budget,
      project_details: lead.project_details || '',
      preferred_contact: lead.preferred_contact || 'WhatsApp',
      consent_given: lead.consent_given !== undefined ? lead.consent_given : 1,
      consent_timestamp: lead.consent_timestamp || new Date().toISOString(),
      source_page: lead.source_page || '/',
      utm_source: lead.utm_source || '',
      utm_medium: lead.utm_medium || '',
      utm_campaign: lead.utm_campaign || '',
      utm_term: lead.utm_term || '',
      utm_content: lead.utm_content || '',
      referrer: lead.referrer || '',
      ip_address: lead.ip_address || '',
      status: 'new',
      notes: ''
    };
    store.leads.push(newLead);
    writeStore(store);
    return id;
  },

  // Retrieve leads with optional status filter
  getLeads: (statusFilter) => {
    const store = readStore();
    let list = store.leads.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(l => l.status === statusFilter);
    }
    return list;
  },

  // Retrieve single lead
  getLeadById: (id) => {
    const store = readStore();
    return store.leads.find(l => String(l.id) === String(id));
  },

  // Update lead status and notes
  updateLeadStatus: (id, status, notes) => {
    const store = readStore();
    const lead = store.leads.find(l => String(l.id) === String(id));
    if (lead) {
      lead.status = status;
      if (notes !== undefined) lead.notes = notes;
      writeStore(store);
      return { changes: 1 };
    }
    return { changes: 0 };
  },

  // Get admin user
  getAdminByUsername: (username) => {
    const store = readStore();
    return store.admin_users.find(u => u.username === username);
  }
};
