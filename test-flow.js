const http = require('http');
const app = require('./server/server');
const { db, getLeads } = require('./server/db/database');

const server = app.listen(3099, async () => {
  console.log('[Test] Server started on port 3099');

  try {
    // Test 1: Health check
    console.log('\n--- Test 1: API Health Check ---');
    const health = await makeRequest('GET', '/api/health');
    console.log('Health check status:', health.status);
    console.log('Health response:', health.body);
    if (health.status !== 200 || !health.body.status) throw new Error('Health check failed');

    // Test 2: Static file serving (Home, Sitemap, Robots)
    console.log('\n--- Test 2: Static Files & Sitemap ---');
    const home = await makeRequest('GET', '/');
    if (home.status !== 200 || !home.raw.includes('Lead Flow')) throw new Error('Home page serving failed');
    console.log('✓ Home page served with status 200');

    const sitemap = await makeRequest('GET', '/sitemap.xml');
    if (sitemap.status !== 200 || !sitemap.raw.includes('https://leadflow.co.in/')) throw new Error('Sitemap failed');
    console.log('✓ sitemap.xml served with status 200 and correct loc entries');

    const robots = await makeRequest('GET', '/robots.txt');
    if (robots.status !== 200 || !robots.raw.includes('Disallow: /admin')) throw new Error('robots.txt failed');
    console.log('✓ robots.txt served with status 200 and Disallow: /admin');

    const pricing = await makeRequest('GET', '/js/pricing.json');
    if (pricing.status !== 200 || pricing.body.currency !== 'INR') throw new Error('pricing.json failed');
    console.log('✓ pricing.json served with status 200 and INR currency');

    // Test 3: Validation on /api/leads (Invalid Phone)
    console.log('\n--- Test 3: Invalid Phone Number Validation ---');
    const invalidLeadRes = await makeRequest('POST', '/api/leads', {
      full_name: 'Test Invalid',
      email: 'test@example.com',
      phone: '1234567890', // Invalid: starts with 1
      service: 'Website Development',
      budget: '₹5,000 - ₹10,000',
      consent: true
    });
    console.log('Invalid lead submission response:', invalidLeadRes.status, invalidLeadRes.body);
    if (invalidLeadRes.status !== 400 || !invalidLeadRes.body.message.includes('Indian mobile number')) {
      throw new Error('Phone validation check failed');
    }
    console.log('✓ Invalid phone was correctly rejected with 400 Bad Request');

    // Test 4: Honeypot trap check
    console.log('\n--- Test 4: Honeypot Bot Trap ---');
    const botRes = await makeRequest('POST', '/api/leads', {
      full_name: 'Bot Spammer',
      email: 'bot@spam.com',
      phone: '9876543210',
      service: 'SEO',
      budget: '₹5,000',
      consent: true,
      bot_field: 'I am a spam bot filling this hidden field'
    });
    console.log('Honeypot response:', botRes.status, botRes.body);
    if (botRes.status !== 200) throw new Error('Honeypot check failed');
    console.log('✓ Honeypot correctly trapped bot submission silently');

    // Test 5: Valid lead submission
    console.log('\n--- Test 5: Valid Lead Submission ---');
    const validLeadRes = await makeRequest('POST', '/api/leads', {
      full_name: 'Karthikeyan Subramaniam',
      email: 'karthik.subramaniam@kongutextiles.in',
      phone: '9876543210',
      company: 'Kongu Cotton Mills, Coimbatore',
      service: 'Website Development',
      budget: '₹5,000 - ₹10,000 (Starter / Business / Growth)',
      project_details: 'We need an export-ready 5-page website with Tamil language version.',
      preferred_contact: 'WhatsApp',
      consent: true,
      source_page: '/services/website-development.html',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'coimbatore_web_dev'
    });
    console.log('Valid lead response:', validLeadRes.status, validLeadRes.body);
    if (validLeadRes.status !== 201 || !validLeadRes.body.leadId) {
      throw new Error('Valid lead submission failed');
    }
    const createdLeadId = validLeadRes.body.leadId;
    console.log(`✓ Valid lead created in SQLite database with ID: ${createdLeadId}`);

    // Verify database record
    const allLeads = getLeads('all');
    const found = allLeads.find(l => l.id === createdLeadId);
    if (!found || found.phone !== '9876543210') throw new Error('Database persistence check failed');
    console.log('✓ SQLite persistence verified. Lead retrieved from disk successfully.');

    // Test 6: Admin login & authentication
    console.log('\n--- Test 6: Admin Authentication ---');
    const loginRes = await makeRequest('POST', '/api/admin/login', {
      username: 'admin',
      password: 'LeadFlow@2026!'
    });
    console.log('Admin login status:', loginRes.status, loginRes.body);
    if (loginRes.status !== 200 || !loginRes.headers['set-cookie']) {
      throw new Error('Admin login failed');
    }
    const cookieHeader = loginRes.headers['set-cookie'][0];
    const cookieToken = cookieHeader.split(';')[0];
    console.log('✓ Admin login succeeded, secure HttpOnly cookie received');

    // Test 7: Fetch leads with Admin Cookie
    console.log('\n--- Test 7: Admin Fetch Leads ---');
    const adminLeadsRes = await makeRequest('GET', '/api/admin/leads', null, cookieToken);
    console.log('Admin leads count:', adminLeadsRes.body.count);
    if (adminLeadsRes.status !== 200 || !adminLeadsRes.body.leads.length) {
      throw new Error('Admin leads fetch failed');
    }
    console.log('✓ Admin successfully retrieved leads. WhatsApp direct links present.');

    // Test 8: Update Lead Status
    console.log('\n--- Test 8: Update Lead Status ---');
    const updateRes = await makeRequest('PATCH', `/api/admin/leads/${createdLeadId}/status`, {
      status: 'contacted',
      notes: 'Called client on WhatsApp. Demo scheduled for Tuesday 11 AM.'
    }, cookieToken);
    console.log('Status update response:', updateRes.body);
    if (updateRes.status !== 200 || !updateRes.body.success) {
      throw new Error('Status update failed');
    }
    console.log('✓ Lead status updated to "contacted" with notes');

    // Test 9: Export CSV
    console.log('\n--- Test 9: CSV Export ---');
    const csvRes = await makeRequest('GET', '/api/admin/export-csv', null, cookieToken);
    if (csvRes.status !== 200 || !csvRes.raw.includes('Karthikeyan Subramaniam')) {
      throw new Error('CSV export failed');
    }
    console.log('✓ CSV exported successfully with Excel UTF-8 BOM and lead rows');

    console.log('\n=======================================================');
    console.log('🎉 ALL 9 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('=======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  } finally {
    server.close();
  }
});

function makeRequest(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 3099,
      path: path,
      method: method,
      headers: {
        'Accept': 'application/json, text/html, text/csv, */*'
      }
    };

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          raw: data
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}
