/**
 * STORYVERSE AI — GA4 event + UTM source tracking.
 * Shared across all static pages. Depends on gtag() being defined in the page <head>.
 *
 * UTM handling: capture utm_* on landing, persist to sessionStorage so the source
 * survives navigation across the multi-page static site, and attach it to every
 * custom event so each event can be sliced by traffic source in GA4.
 */
(function () {
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var STORE_KEY = 'sv_utm';

  function readUtmFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var found = {};
    var has = false;
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) { found[k] = v; has = true; }
    });
    return has ? found : null;
  }

  function getUtm() {
    var fromUrl = readUtmFromUrl();
    if (fromUrl) {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(fromUrl)); } catch (e) {}
      return fromUrl;
    }
    try {
      var stored = sessionStorage.getItem(STORE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
  }

  var utm = getUtm();

  function track(name, params) {
    var payload = {};
    for (var k in utm) { if (utm.hasOwnProperty(k)) payload[k] = utm[k]; }
    if (params) { for (var p in params) { if (params.hasOwnProperty(p)) payload[p] = params[p]; } }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }
  }
  window.svTrack = track;

  document.addEventListener('DOMContentLoaded', function () {
    // Contact form submit -> generate_lead (primary conversion)
    var form = document.querySelector('.contact-form');
    if (form) {
      form.addEventListener('submit', function () {
        track('generate_lead', { form_name: 'contact' });
      });
    }

    // Community button reveals the community QR -> community_qr_view
    var communityBtn = document.querySelector('.hero-btn-wrap .hero-btn');
    if (communityBtn) {
      communityBtn.addEventListener('click', function () {
        track('community_qr_view', {});
      });
    }

    // Showcase spatial cards -> showcase_click (with category)
    document.querySelectorAll('.spatial-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var href = card.getAttribute('href') || '';
        var category = href.indexOf('#') > -1 ? href.split('#')[1] : (card.getAttribute('aria-label') || '');
        track('showcase_click', { showcase_category: category });
      });
    });

    // CTA clicks -> cta_click (with label)
    var ctas = [
      { sel: 'a.hero-btn[href="#contact"]', label: 'work_with_us' },
      { sel: 'a.hero-btn[href="press-release.html"]', label: 'press_release' },
      { sel: '.marquee-cta a', label: 'read_press_release' }
    ];
    ctas.forEach(function (c) {
      document.querySelectorAll(c.sel).forEach(function (el) {
        el.addEventListener('click', function () {
          track('cta_click', { cta_label: c.label });
        });
      });
    });
  });
})();
