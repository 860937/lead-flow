# Post-Launch Technical SEO & Maintenance Checklist

## 1. Immediate Post-Launch Steps
- [ ] **Google Search Console**:
  - Add domain property `leadflow.co.in` via DNS TXT record or HTML tag.
  - Submit `https://leadflow.co.in/sitemap.xml`.
  - Request indexing for priority URLs (`/index.html`, `/services.html`, `/pricing.html`, `/web-development-company-coimbatore.html`).
- [ ] **Bing Webmaster Tools**:
  - Import property from Google Search Console.
  - Verify sitemap crawl status.
- [ ] **Robots.txt & Sitemap Validation**:
  - Verify `robots.txt` returns status 200 and points to `sitemap.xml`.
  - Ensure `/admin` and `/api` are blocked with `Disallow: /admin` and `Disallow: /api`.
  - Check that noindex tags are active on `/thank-you.html`, `/404.html`, and `/admin`.
- [ ] **Rich Results Test**:
  - Run Google Rich Results Test on `/` (LocalBusiness / Organization / FAQPage).
  - Test `/pricing.html` (Offer schema).
  - Test `/services/website-development.html` (Service schema).
  - Test `/blog/*.html` (Article schema & BreadcrumbList).
- [ ] **Core Web Vitals Audit**:
  - Run PageSpeed Insights on desktop and mobile. Target: 95+ score.
  - Validate LCP < 2.5s, CLS < 0.1, INP < 200ms.
- [ ] **WhatsApp & Contact Links Check**:
  - Test WhatsApp floating button on real mobile devices (opens WhatsApp with pre-filled message).
  - Verify `tel:+917604894572` initiates dialer on Android and iOS.
  - Submit test lead through lead form, verify SQLite insert and email trigger.

---

## 2. Monthly SEO Maintenance Checklist
- **Week 1**: Inspect Google Search Console for crawl errors, 404s, mobile usability, and new indexed pages.
- **Week 2**: Review Google Business Profile performance insights (calls, direction requests, website clicks).
- **Week 3**: Publish 1 fresh localized or industry-specific blog article targeting long-tail Coimbatore keywords.
- **Week 4**: Audit website loading speed, check backup integrity in SQLite, and verify HTTPS SSL expiry.
