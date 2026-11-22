/**
 * Lead Flow - Privacy-First Analytics & Event Tracking
 * Aligned with India's Digital Personal Data Protection (DPDP) Act, 2023
 */

(function () {
  'use strict';

  var CONSENT_KEY = 'leadflow_cookie_consent_v1';

  // Check if consent has been granted
  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  }

  // Dispatch custom tracking event
  window.trackLeadFlowEvent = function (eventName, eventData) {
    var payload = eventData || {};
    payload.timestamp = new Date().toISOString();
    payload.url = window.location.pathname;

    // Log to console for debugging in dev
    console.log('[Analytics Event]', eventName, payload);

    // If user has accepted cookies, send to GA4 / Tag Manager
    if (hasConsent() && typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  };

  // Initialize GA4 only after consent
  function initGA4() {
    var gaId = 'G-XXXXXXXXXX'; // Placeholder GA4 Measurement ID
    if (window._gaInitialized) return;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });
    window._gaInitialized = true;
  }

  // Setup DPDP Consent Banner UI
  function setupConsentBanner() {
    if (localStorage.getItem(CONSENT_KEY)) {
      if (hasConsent()) initGA4();
      return;
    }

    var banner = document.createElement('div');
    banner.className = 'consent-banner show';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Privacy and Cookie Consent');
    banner.innerHTML = [
      '<p><strong>Privacy Notice (DPDP Act 2023):</strong> We use essential local storage to remember your preferences and anonymous analytics to improve your experience. No personal data is sold or shared without consent.</p>',
      '<div style="display: flex; gap: 8px;">',
      '  <button id="btn-accept-consent" class="btn btn-primary btn-sm">Accept All</button>',
      '  <button id="btn-reject-consent" class="btn btn-secondary btn-sm">Essential Only</button>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);

    document.getElementById('btn-accept-consent').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'granted');
      banner.classList.remove('show');
      initGA4();
      window.trackLeadFlowEvent('consent_accepted');
    });

    document.getElementById('btn-reject-consent').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'denied');
      banner.classList.remove('show');
    });
  }

  // Bind click tracking to high-intent contact links
  function bindLinkTracking() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a');
      if (!target) return;

      var href = target.getAttribute('href') || '';

      // WhatsApp Clicks
      if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
        window.trackLeadFlowEvent('click_whatsapp', {
          label: target.innerText || target.getAttribute('aria-label') || 'WhatsApp CTA',
          href: href
        });
      }

      // Phone Call Clicks
      if (href.indexOf('tel:') === 0) {
        window.trackLeadFlowEvent('click_call', {
          number: href.replace('tel:', ''),
          label: target.innerText || 'Phone CTA'
        });
      }

      // Email Clicks
      if (href.indexOf('mailto:') === 0) {
        window.trackLeadFlowEvent('click_email', {
          label: target.innerText || 'Email CTA'
        });
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupConsentBanner();
      bindLinkTracking();
    });
  } else {
    setupConsentBanner();
    bindLinkTracking();
  }
})();
