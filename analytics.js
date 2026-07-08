/**
 * STORYVERSE AI — GA4 custom events + UTM source tracking.
 * Shared across all static pages. Depends on gtag() being defined in the page <head>.
 *
 * Event map:
 * - generate_lead: contact form submit; params: form_name + UTM
 * - community_qr_view: Community QR reveal; params: UTM
 * - showcase_click: Showcase/category card click; params: showcase_category + UTM
 * - cta_click: Work With Us / Press CTA click; params: cta_label + UTM
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

  function merge(target, source) {
    if (!source) return target;
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined && source[key] !== null && source[key] !== '') {
        target[key] = source[key];
      }
    }
    return target;
  }

  function track(name, params) {
    var payload = merge({}, utm);
    merge(payload, params);
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }
  }

  function normalizeLabel(value) {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function getShowcaseCategory(el) {
    var explicit = el.getAttribute('data-showcase-category');
    if (explicit) return explicit;

    var href = el.getAttribute('href') || '';
    if (href.indexOf('#') > -1) return href.split('#').pop();

    var id = el.getAttribute('id');
    if (id) return id;

    var title = el.querySelector && el.querySelector('.card-title');
    return title ? normalizeLabel(title.textContent) : normalizeLabel(el.getAttribute('aria-label'));
  }

  function getCtaLabel(el) {
    var explicit = el.getAttribute('data-cta-label');
    if (explicit) return explicit;

    var text = normalizeLabel(el.textContent || el.getAttribute('aria-label'));
    if (text.indexOf('work_with_us') > -1) return 'work_with_us';
    if (text.indexOf('press') > -1) return 'press_cta';
    return text || 'cta';
  }

  window.svTrack = track;

  document.addEventListener('DOMContentLoaded', function () {
    // Contact form submit -> generate_lead (primary conversion candidate)
    document.querySelectorAll('.contact-form').forEach(function (form) {
      form.addEventListener('submit', function () {
        track('generate_lead', { form_name: form.getAttribute('data-form-name') || 'contact' });
      });
    });

    // Community button reveals the community QR -> community_qr_view
    document.querySelectorAll('[data-track-community-qr], .hero-btn-wrap > button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        track('community_qr_view', {});
      });
    });

    // Showcase/category cards -> showcase_click (with category)
    document.querySelectorAll('.spatial-card, .project-card, [data-track-showcase-click]').forEach(function (card) {
      card.addEventListener('click', function () {
        track('showcase_click', { showcase_category: getShowcaseCategory(card) });
      });
    });

    // CTA clicks -> cta_click (with label). Intentionally narrow to Work With Us / Press CTAs.
    document.querySelectorAll('a.hero-btn[href="#contact"], a.hero-btn[href="index.html#contact"], a.hero-btn[href="press-release.html"], .marquee-cta a, [data-track-cta]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('cta_click', { cta_label: getCtaLabel(el) });
      });
    });
  });
})();
