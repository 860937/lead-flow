# Lead Flow - Production Web Agency & Lead Engine

> **Tagline**: Websites That Turn Visitors Into Customers  
> **Location**: Coimbatore, Tamil Nadu, India  
> **Phone / WhatsApp**: +91 76048 94572  
> **Email**: suganth46801@gmail.com  
> **Launch Pricing**: ₹5,000 to ₹10,000 (Centralized configuration in `/public/js/pricing.json`)

---

## 1. Project Overview & Architecture

Lead Flow is a production-ready, ultra-fast website and lead capture engine built specifically for a web development agency based in Coimbatore, Tamil Nadu. It is engineered to rank #1 on Google Search and Google Maps for high-intent web development and SEO terms across Coimbatore, Tiruppur, Erode, Salem, and Tamil Nadu, while converting traffic through direct WhatsApp and form inquiry channels.

### Tech Stack
- **Frontend**: Lightweight semantic HTML5, CSS3 (CSS Grid, Flexbox, Custom Properties), vanilla ES6+ JavaScript. Framework-free for sub-1.5 second loading speeds and 95+ Core Web Vitals scores.
- **Backend**: Node.js + Express with Helmet Content Security Policy (CSP), CORS, rate limiting, and input sanitization.
- **Database**: SQLite with `better-sqlite3` and Write-Ahead Logging (WAL) for high concurrency, zero setup, and trivial migration to PostgreSQL.
- **Security**: HttpOnly, SameSite=Strict cookies, bcrypt password hashing, honeypot bot trap, rate limiting on quote submissions and admin authentication.
- **Privacy**: Compliant with India's Digital Personal Data Protection (DPDP) Act, 2023 and the Information Technology Act, 2000.

---

## 2. Directory Structure

```
lead-flow/
├── public/                     # Static frontend assets & HTML crawlable pages
│   ├── index.html              # Main homepage
│   ├── services.html           # Services directory hub
│   ├── services/               # Dedicated service pages (600+ words each)
│   │   ├── website-development.html
│   │   ├── ecommerce-development.html
│   │   ├── landing-pages.html
│   │   ├── web-app-development.html
│   │   ├── ui-ux-design.html
│   │   ├── seo-services.html
│   │   └── website-maintenance.html
│   ├── web-development-company-coimbatore.html  # Local landing page 1
│   ├── website-design-coimbatore.html          # Local landing page 2
│   ├── seo-services-coimbatore.html            # Local landing page 3
│   ├── ecommerce-website-development-coimbatore.html # Local landing page 4
│   ├── pricing.html            # Full pricing menu & add-ons
│   ├── portfolio.html          # Client case studies with metrics
│   ├── about.html              # Agency story & E-E-A-T credentials
│   ├── contact.html            # Lead form, map & NAP contact info
│   ├── thank-you.html          # Post-submission page (noindex)
│   ├── privacy-policy.html     # DPDP Act 2023 privacy policy
│   ├── terms.html              # Terms of engagement & 100% IP ownership
│   ├── 404.html                # Custom 404 handler (noindex)
│   ├── ta/                     # Tamil language version
│   │   └── index.html          # Tamil home page with hreflang tags
│   ├── blog/                   # Blog & technical knowledge hub
│   │   ├── index.html          # Blog listing
│   │   ├── website-cost-in-india-2026.html
│   │   ├── website-for-coimbatore-manufacturers-textile.html
│   │   └── landing-page-best-practices-leads.html
│   ├── admin/                  # Password-protected CRM portal
│   │   ├── index.html          # Leads table & status management
│   │   ├── login.html          # Secure login form
│   │   ├── admin.js            # CRM actions & real-time updates
│   │   └── admin.css           # Dashboard styling
│   ├── css/
│   │   └── styles.css          # Comprehensive responsive CSS
│   ├── js/
│   │   ├── config.js           # Central NAP & WhatsApp configuration
│   │   ├── pricing.json        # Single source of truth for pricing
│   │   ├── main.js             # Theme toggle, mobile menu, FAQ accordions
│   │   ├── lead-form.js        # Phone validation, honeypot & fetch POST
│   │   └── analytics.js        # DPDP consent banner & event tracking
│   ├── assets/                 # SVGs, logo, favicon, og-image
│   │   ├── logo.svg
│   │   ├── favicon.svg
│   │   └── og-image.svg
│   ├── robots.txt              # Crawl rules & sitemap pointer
│   └── sitemap.xml             # Complete XML sitemap
├── server/                     # Backend API & Server
│   ├── server.js               # Express app & static server
│   ├── db/
│   │   └── database.js         # SQLite better-sqlite3 database
│   ├── routes/
│   │   ├── leads.js            # POST /api/leads endpoint
│   │   └── admin.js            # /api/admin authentication & CRM APIs
│   ├── middleware/
│   │   ├── auth.js             # JWT & cookie verification
│   │   ├── rateLimiter.js      # Express rate limiters
│   │   └── security.js         # Helmet & strict CSP configuration
│   └── services/
│       └── mailer.js           # Nodemailer lead notifications & WhatsApp links
├── seo/                        # SEO documentation & keyword plans
│   ├── keyword-map.md          # Keyword matrix & intent mapping
│   ├── meta-sheet.md           # Meta title & description sheet
│   ├── local-seo-checklist.md  # Google Business Profile & local citations
│   └── post-launch-checklist.md # GSC, Bing & Core Web Vitals checks
├── data/                       # Local SQLite database files (gitignored)
├── .env.example                # Sample environment configuration
├── .gitignore
├── package.json
└── README.md
```

---

## 3. How to Edit Pricing in ONE Place (`pricing.json`)

All prices displayed across the pricing page, home pricing preview, service pages, and the lead form budget dropdown are managed from **one file**:
👉 `public/js/pricing.json`

### To update prices (e.g., raising Starter from ₹5,000 to ₹7,000):
1. Open `public/js/pricing.json`.
2. Locate the package:
   ```json
   {
     "id": "starter",
     "name": "Starter",
     "price": 7000,
     "priceDisplay": "₹7,000",
     "originalPrice": 10000,
     "originalPriceDisplay": "₹10,000"
   }
   ```
3. Save the file.
4. All frontend elements, JavaScript price loaders, and budget dropdowns automatically reflect the new price without modifying individual HTML files!

---

## 4. Setup & Local Installation

### Prerequisites
- Node.js (v18, v20, or v22 recommended)
- npm (v9+)

### Installation Steps
```bash
# 1. Clone repository or navigate to folder
cd "lead flow"

# 2. Install production dependencies
npm install

# 3. Create your local .env file
cp .env.example .env

# 4. Start the server
npm start
```

The application will be live at:
- **Website**: `http://localhost:3000`
- **Admin CRM**: `http://localhost:3000/admin`
  - **Default Username**: `admin`
  - **Default Password**: `LeadFlow@2026!` (Configurable in `.env`)

---

## 5. Gmail App Password Setup (Lead Email Alerts)

Whenever a prospective customer submits a lead form on the website, Lead Flow triggers an immediate email notification to `suganth46801@gmail.com` with a one-click **"Reply on WhatsApp"** button.

### How to set up your Gmail App Password:
1. Log in to your Google Account: `suganth46801@gmail.com`.
2. Navigate to **Google Account Settings** -> **Security**.
3. Under *"How you sign in to Google"*, verify that **2-Step Verification** is turned ON.
4. Search for or click on **App Passwords** (or navigate to `https://myaccount.google.com/apppasswords`).
5. In the *App name* field, type `Lead Flow Agency Server` and click **Create**.
6. Google will generate a 16-character password (e.g. `abcd efgh ijkl mnop`).
7. Open your `.env` file on the server and insert it:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=suganth46801@gmail.com
   SMTP_PASS=abcdefghijklmnop
   NOTIFICATION_EMAIL=suganth46801@gmail.com
   ```
8. Restart the server (`npm start`). Email alerts will now send instantly on each lead!

---

## 6. Admin CRM Dashboard Guide

The password-protected administrative interface is accessible at:
👉 `https://leadflow.co.in/admin` (or `http://localhost:3000/admin`)

### Capabilities:
- **Instant Overview Metrics**: Total inquiries, new leads, contacted, and qualified/closed deals.
- **Real-time Status Management**: Change lead status (`new`, `contacted`, `qualified`, `closed`) via immediate AJAX updates.
- **Internal Notes**: Add private internal notes for any prospective client.
- **1-Click WhatsApp Quick Reply**: Each lead entry features a direct WhatsApp button pre-filled with the lead's name and service request.
- **Export to CSV**: Download an Excel-compatible UTF-8 BOM CSV export for offline reporting and CRM import.

---

## 7. Production Deployment Guide (India Region)

For the lowest latency across Tamil Nadu and India (sub-25ms response times), deploy on an India-region server (e.g., DigitalOcean Bengaluru, AWS Mumbai, Hetzner, or Railway/Render).

### Nginx Reverse Proxy Configuration (with Gzip, Caching & SSL)
```nginx
server {
    listen 80;
    server_name leadflow.co.in www.leadflow.co.in;
    return 301 https://leadflow.co.in$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.leadflow.co.in;
    ssl_certificate /etc/letsencrypt/live/leadflow.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/leadflow.co.in/privkey.pem;
    return 301 https://leadflow.co.in$request_uri;
}

server {
    listen 443 ssl http2;
    server_name leadflow.co.in;

    ssl_certificate /etc/letsencrypt/live/leadflow.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/leadflow.co.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml font/woff2 image/svg+xml;

    # Static Assets Caching
    location ~* \.(jpg|jpeg|png|webp|svg|ico|css|js|woff2)$ {
        root /var/www/leadflow/public;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Reverse Proxy to Node.js Backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 8. Security & DPDP Compliance Checklist

- [x] **Strict Content-Security-Policy (CSP)**: Configured via Helmet. Zero unauthorized script execution.
- [x] **Rate Limiting**: 5 quote requests per 15 mins on `/api/leads`; 5 login attempts per 15 mins on `/api/admin/login`.
- [x] **Honeypot Bot Trap**: Silent drop on automated bot form submissions.
- [x] **Indian Phone Validation**: Strict server and client validation: `^(?:\+91|91|0)?[6-9]\d{9}$`.
- [x] **DPDP Act 2023 Consent**: Explicit checkbox recorded with timestamp and IP.
- [x] **Email Scraper Protection**: `suganth46801@gmail.com` is never printed as raw HTML text; assembled dynamically via JavaScript.
- [x] **Search Engine Privacy**: `X-Robots-Tag: noindex, nofollow` on `/admin` and `/api` endpoints.
- [x] **NPM Audit**: 0 vulnerabilities.

---

## 9. Local SEO & Google Business Profile Checklist

Refer to the complete SEO documentation folders:
- `seo/keyword-map.md`: Complete matrix of primary and secondary keywords per page.
- `seo/meta-sheet.md`: SERP-optimized title and description reference sheet.
- `seo/local-seo-checklist.md`: Step-by-step Google Business Profile (GBP) and local citation setup.
- `seo/post-launch-checklist.md`: Search Console submission and Core Web Vitals maintenance schedule.
