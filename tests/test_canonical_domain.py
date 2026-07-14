import json
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(".")


def test_vercel_redirects_www_to_apex_domain():
    config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    redirects = config.get("redirects", [])
    assert redirects, "vercel.json should define redirects"

    redirect = redirects[0]
    assert redirect["source"] == "/:path*"
    assert redirect["destination"] == "https://storyverseai.art/:path*"
    assert redirect["permanent"] is True
    assert {"type": "host", "value": "www.storyverseai.art"} in redirect.get("has", [])


def test_public_html_pages_declare_non_www_canonical_urls():
    expected = {
        "index.html": "https://storyverseai.art/",
        "showcase.html": "https://storyverseai.art/showcase.html",
        "press-release.html": "https://storyverseai.art/press-release.html",
        "skill-policy/index.html": "https://storyverseai.art/skill-policy/",
    }
    for path, canonical in expected.items():
        html = (ROOT / path).read_text(encoding="utf-8")
        assert f'<link rel="canonical" href="{canonical}">' in html


def test_robots_and_sitemap_use_non_www_canonical_urls():
    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    assert "Sitemap: https://storyverseai.art/sitemap.xml" in robots
    assert "www.storyverseai.art" not in robots

    tree = ET.parse(ROOT / "sitemap.xml")
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [loc.text for loc in tree.findall(".//sm:loc", ns)]
    assert locs == [
        "https://storyverseai.art/",
        "https://storyverseai.art/showcase.html",
        "https://storyverseai.art/press-release.html",
        "https://storyverseai.art/skill-policy/",
    ]
