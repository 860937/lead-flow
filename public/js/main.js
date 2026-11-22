/**
 * Lead Flow - Main Interactive JavaScript
 * Theme toggle, mobile drawer, FAQ accordion, dynamic pricing loader, and email obfuscation
 */

(function () {
  'use strict';

  // 1. Dark / Light Theme Toggle
  function initTheme() {
    var storedTheme = localStorage.getItem('leadflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);

    var toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(function (btn) {
      updateThemeBtnText(btn, storedTheme);
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('leadflow_theme', next);
        toggleBtns.forEach(function (b) { updateThemeBtnText(b, next); });
      });
    });
  }

  function updateThemeBtnText(btn, theme) {
    btn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'Light' : 'Dark') + ' Mode');
  }

  // 2. Mobile Navigation Drawer Toggle
  function initMobileMenu() {
    var burger = document.querySelector('.burger-btn');
    var drawer = document.querySelector('.mobile-nav-drawer');
    if (!burger || !drawer) return;

    burger.addEventListener('click', function () {
      var isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.innerHTML = '☰';
      } else {
        drawer.classList.add('open');
        burger.setAttribute('aria-expanded', 'true');
        burger.innerHTML = '✕';
      }
    });

    // Close when clicking mobile links
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.innerHTML = '☰';
      });
    });
  }

  // 3. FAQ Accordion Interaction
  function initFaqAccordion() {
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
      var btn = item.querySelector('.faq-question');
      var ans = item.querySelector('.faq-answer');
      if (!btn || !ans) return;

      btn.addEventListener('click', function () {
        var isActive = item.classList.contains('active');

        // Optional accordion behavior: close other siblings
        faqItems.forEach(function (other) {
          if (other !== item) {
            other.classList.remove('active');
            var otherAns = other.querySelector('.faq-answer');
            if (otherAns) otherAns.style.maxHeight = null;
          }
        });

        if (isActive) {
          item.classList.remove('active');
          ans.style.maxHeight = null;
        } else {
          item.classList.add('active');
          ans.style.maxHeight = ans.scrollHeight + 30 + 'px';
        }
      });
    });
  }

  // 4. Scraper-Protected Email Link Assembler
  function initProtectedEmail() {
    if (!window.LEADFLOW_CONFIG) return;
    var emailLinks = document.querySelectorAll('.protected-email-link');
    var emailTexts = document.querySelectorAll('.protected-email-text');

    var email = window.LEADFLOW_CONFIG.getEmailAddress();
    var mailto = window.LEADFLOW_CONFIG.getMailtoLink();

    emailLinks.forEach(function (link) {
      link.setAttribute('href', mailto);
      if (link.dataset.showEmail === 'true') {
        link.textContent = email;
      }
    });

    emailTexts.forEach(function (el) {
      el.textContent = email;
    });
  }

  // 5. Dynamic Pricing Data Loader (From /public/js/pricing.json)
  function loadPricingData() {
    fetch('/js/pricing.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        window.LEADFLOW_PRICING = data;

        // Populate Starter, Business, Growth price displays
        data.packages.forEach(function (pkg) {
          var priceEls = document.querySelectorAll('.pricing-val-' + pkg.id);
          var origEls = document.querySelectorAll('.pricing-orig-' + pkg.id);

          priceEls.forEach(function (el) { el.textContent = pkg.priceDisplay; });
          origEls.forEach(function (el) { el.textContent = pkg.originalPriceDisplay; });
        });

        // Trigger custom event so lead-form can populate budget dropdown if needed
        window.dispatchEvent(new CustomEvent('pricingLoaded', { detail: data }));
      })
      .catch(function (err) {
        console.warn('[Pricing] Could not load pricing.json:', err.message);
      });
  }

  // 6. Animated Stats Counter (Triggered on IntersectionObserver)
  function initStatsCounter() {
    var statEls = document.querySelectorAll('.stat-val[data-target]');
    if (!statEls.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var target = parseInt(entry.target.getAttribute('data-target'), 10);
          var prefix = entry.target.getAttribute('data-prefix') || '';
          var suffix = entry.target.getAttribute('data-suffix') || '';
          animateCounter(entry.target, target, prefix, suffix);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    statEls.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el, target, prefix, suffix) {
    var count = 0;
    var duration = 1500;
    var stepTime = 30;
    var step = Math.ceil(target / (duration / stepTime));

    var timer = setInterval(function () {
      count += step;
      if (count >= target) {
        count = target;
        clearInterval(timer);
      }
      el.textContent = prefix + count + suffix;
    }, stepTime);
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initMobileMenu();
    initFaqAccordion();
    initProtectedEmail();
    loadPricingData();
    initStatsCounter();
  });
})();
