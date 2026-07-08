from pathlib import Path


ANALYTICS = Path("analytics.js").read_text(encoding="utf-8")
INDEX = Path("index.html").read_text(encoding="utf-8")
SHOWCASE = Path("showcase.html").read_text(encoding="utf-8")
PRESS = Path("press-release.html").read_text(encoding="utf-8")


def test_analytics_tracks_required_custom_events_and_parameters():
    required = {
        "generate_lead": "form_name",
        "community_qr_view": "data-track-community-qr",
        "showcase_click": "showcase_category",
        "cta_click": "cta_label",
    }

    for event_name, param_marker in required.items():
        assert f"track('{event_name}'" in ANALYTICS
        assert param_marker in ANALYTICS


def test_analytics_persists_and_attaches_utm_parameters():
    for key in ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]:
        assert key in ANALYTICS

    assert "sessionStorage.setItem(STORE_KEY" in ANALYTICS
    assert "sessionStorage.getItem(STORE_KEY" in ANALYTICS
    assert "var payload = merge({}, utm)" in ANALYTICS
    assert "window.gtag('event', name, payload)" in ANALYTICS


def test_custom_event_script_is_loaded_on_public_pages():
    for html in [INDEX, SHOWCASE, PRESS]:
        assert '<script src="analytics.js"></script>' in html


def test_homepage_has_expected_tracked_elements():
    assert 'class="contact-form"' in INDEX
    assert 'data-track-community-qr' in INDEX
    assert 'href="#contact" class="hero-btn"' in INDEX
    assert 'href="press-release.html" class="hero-btn hero-btn--outline"' in INDEX


def test_showcase_category_cards_are_tracked_by_project_card_id():
    assert "document.querySelectorAll('.spatial-card, .project-card, [data-track-showcase-click]')" in ANALYTICS
    assert "var id = el.getAttribute('id');" in ANALYTICS
    for category_id in ["microdrama", "feature-film", "animation", "branded-content"]:
        assert f"id: '{category_id}'" in SHOWCASE
