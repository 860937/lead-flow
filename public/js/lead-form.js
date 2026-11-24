/**
 * Lead Flow - Lead Form Controller
 * Robust client-side validation, UTM capture, honeypot protection,
 * dynamic budget population from pricing.json, and fetch submission.
 */

(function () {
  'use strict';

  // Extract UTM parameters from current URL
  function getUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || '',
      referrer: document.referrer || ''
    };
  }

  // Populate budget options from pricing.json
  function populateBudgetDropdowns(budgetRanges) {
    var selects = document.querySelectorAll('.budget-select');
    selects.forEach(function (select) {
      // Clear existing options except placeholder
      select.innerHTML = '<option value="">Select your estimated budget *</option>';
      budgetRanges.forEach(function (b) {
        var opt = document.createElement('option');
        opt.value = b.label;
        opt.textContent = b.label;
        select.appendChild(opt);
      });
    });
  }

  // Validate Indian Phone Number: 10 digits starting 6,7,8,9, optional +91/91/0
  function isValidIndianPhone(phone) {
    var clean = phone.replace(/[\s-]/g, '');
    var regex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    return regex.test(clean);
  }

  // Validate Email
  function isValidEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Bind lead forms across the site
  function initLeadForms() {
    // Populate budget options if pricing loaded, or listen for pricingLoaded event
    if (window.LEADFLOW_PRICING && window.LEADFLOW_PRICING.budgetRanges) {
      populateBudgetDropdowns(window.LEADFLOW_PRICING.budgetRanges);
    } else {
      window.addEventListener('pricingLoaded', function (e) {
        if (e.detail && e.detail.budgetRanges) {
          populateBudgetDropdowns(e.detail.budgetRanges);
        }
      });
    }

    var forms = document.querySelectorAll('.lead-capture-form');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleFormSubmit(form);
      });
    });
  }

  function handleFormSubmit(form) {
    var feedbackEl = form.querySelector('.form-feedback');
    var submitBtn = form.querySelector('button[type="submit"]');

    if (feedbackEl) {
      feedbackEl.className = 'form-feedback';
      feedbackEl.textContent = '';
      feedbackEl.style.display = 'none';
    }

    // Form inputs
    var fullName = form.querySelector('[name="full_name"]');
    var email = form.querySelector('[name="email"]');
    var phone = form.querySelector('[name="phone"]');
    var company = form.querySelector('[name="company"]');
    var service = form.querySelector('[name="service"]');
    var budget = form.querySelector('[name="budget"]');
    var projectDetails = form.querySelector('[name="project_details"]');
    var preferredContact = form.querySelector('[name="preferred_contact"]:checked') ||
                           form.querySelector('[name="preferred_contact"]');
    var consent = form.querySelector('[name="consent"]');
    var botField = form.querySelector('[name="bot_field"]');

    // Basic Validation
    if (!fullName || fullName.value.trim().length < 2) {
      showError(feedbackEl, 'Please enter your full name (at least 2 characters).');
      if (fullName) fullName.focus();
      return;
    }

    if (!email || !isValidEmail(email.value.trim())) {
      showError(feedbackEl, 'Please enter a valid email address.');
      if (email) email.focus();
      return;
    }

    if (!phone || !isValidIndianPhone(phone.value.trim())) {
      showError(feedbackEl, 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).');
      if (phone) phone.focus();
      return;
    }

    if (!service || !service.value.trim()) {
      showError(feedbackEl, 'Please select the service you are interested in.');
      if (service) service.focus();
      return;
    }

    if (!budget || !budget.value.trim()) {
      showError(feedbackEl, 'Please choose an estimated project budget.');
      if (budget) budget.focus();
      return;
    }

    if (!consent || !consent.checked) {
      showError(feedbackEl, 'Please agree to allow Lead Flow to contact you regarding your inquiry.');
      if (consent) consent.focus();
      return;
    }

    // Prepare Payload
    var utm = getUrlParams();
    var payload = {
      full_name: fullName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      company: company ? company.value.trim() : '',
      service: service.value.trim(),
      budget: budget.value.trim(),
      project_details: projectDetails ? projectDetails.value.trim() : '',
      preferred_contact: preferredContact ? preferredContact.value : 'WhatsApp',
      consent: true,
      bot_field: botField ? botField.value : '',
      source_page: window.location.pathname,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_term: utm.utm_term,
      utm_content: utm.utm_content,
      referrer: utm.referrer
    };

    // UI Loading state
    var originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Submitting Your Request...';

    // Submit to Express / Vercel API
    fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = {};
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { rawText: text };
          }
          return { status: res.status, data: data };
        });
      })
      .then(function (resObj) {
        if (resObj.status >= 200 && resObj.status < 300 && resObj.data.success) {
          // Track conversion in analytics
          if (typeof window.trackLeadFlowEvent === 'function') {
            window.trackLeadFlowEvent('generate_lead', {
              service: payload.service,
              budget: payload.budget
            });
          }

          // Redirect to Thank-You Page with lead name for personalized touch
          var thankYouUrl = '/thank-you.html?name=' + encodeURIComponent(payload.full_name) +
                            '&service=' + encodeURIComponent(payload.service);
          window.location.href = thankYouUrl;
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          var errorMsg = resObj.data.message ||
                         resObj.data.error ||
                         (resObj.data.errors && resObj.data.errors[0]) ||
                         (resObj.status >= 400 ? 'Server error (' + resObj.status + '). Please try again or message us on WhatsApp.' : 'Error submitting quote. Please check your details.');
          showError(feedbackEl, errorMsg);
        }
      })
      .catch(function (err) {
        console.error('[FormSubmit] Error:', err);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        showError(feedbackEl, 'Network connection issue. Please try again or message us directly on WhatsApp (+91 76048 94572).');
      });
  }

  function showError(el, message) {
    if (!el) {
      alert(message);
      return;
    }
    el.className = 'form-feedback error';
    el.textContent = message;
    el.style.display = 'block';
  }

  // Initialize when DOM ready
  document.addEventListener('DOMContentLoaded', initLeadForms);
})();
