/**
 * Lead Flow - Global Client Configuration
 * Centralized Single Source of Truth for Contact & NAP details
 */
window.LEADFLOW_CONFIG = {
  agencyName: "Lead Flow",
  tagline: "Websites That Turn Visitors Into Customers",
  
  // Contact Details
  phoneFormatted: "+91 76048 94572",
  phoneRaw: "917604894572",
  phoneTelLink: "tel:+917604894572",
  
  // WhatsApp Configuration
  whatsappBaseUrl: "https://wa.me/917604894572",
  defaultWhatsappMessage: "Hi Lead Flow, I want to know more about website development",
  
  // Service-Specific WhatsApp Pre-filled Messages
  whatsappMessages: {
    general: "Hi Lead Flow, I want to know more about website development",
    webDev: "Hi Lead Flow, I'm interested in a custom website for my business",
    ecommerce: "Hi Lead Flow, I'd like to get an e-commerce website built",
    landingPages: "Hi Lead Flow, I need a high-converting landing page for my campaigns",
    webApp: "Hi Lead Flow, I have a custom web application idea to discuss",
    uiUx: "Hi Lead Flow, I need professional UI/UX design for my project",
    seo: "Hi Lead Flow, I want to improve my website's Google ranking in Coimbatore",
    maintenance: "Hi Lead Flow, I need ongoing website maintenance and security support",
    coimbatore: "Hi Lead Flow, I'm looking for a web development company in Coimbatore",
    quote: "Hi Lead Flow, I would like to get a quote for a website project",
    tamil: "வணக்கம் Lead Flow, எனது வணிகத்திற்கு புதிய இணையதளம் அமைக்க விரும்புகிறேன்"
  },

  // Address & NAP (Consistent across all pages & Schema)
  address: {
    street: "Cross Cut Road, Gandhipuram",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    fullAddress: "Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012, India",
    geo: {
      latitude: 11.0168,
      longitude: 76.9558
    }
  },

  // Operating Hours
  businessHours: "Mon - Sat: 9:30 AM - 6:30 PM IST (Sunday Closed)",

  // Scraper-Protected Email Components (Assembled dynamically in runtime)
  emailParts: {
    user: "suganth46801",
    domain: "gmail.com"
  },

  // API Endpoints
  endpoints: {
    submitLead: "/api/leads",
    pricingData: "/js/pricing.json"
  },

  // Security & Captcha (Turnstile / reCAPTCHA public key placeholder)
  captchaSiteKey: "1x00000000000000000000AA",

  // Helper Methods
  getWhatsappUrl: function (topicKey) {
    var msg = this.whatsappMessages[topicKey] || this.defaultWhatsappMessage;
    return this.whatsappBaseUrl + "?text=" + encodeURIComponent(msg);
  },

  getEmailAddress: function () {
    return this.emailParts.user + "@" + this.emailParts.domain;
  },

  getMailtoLink: function (subject) {
    var sub = subject || "Website Development Inquiry - Lead Flow";
    return "mailto:" + this.getEmailAddress() + "?subject=" + encodeURIComponent(sub);
  }
};
