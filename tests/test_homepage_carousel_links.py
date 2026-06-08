from html.parser import HTMLParser
from pathlib import Path


class SpatialCardAnchorParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.anchors = []
        self._current = None
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self._current is not None:
            # HTMLParser reports <br> as a start tag, but it is a void element.
            if tag not in {"br", "img", "input", "meta", "link"}:
                self._depth += 1
            return

        if tag == "a" and "spatial-card" in set(attrs.get("class", "").split()):
            self._current = {"href": attrs.get("href"), "text": ""}
            self._depth = 1

    def handle_data(self, data):
        if self._current is not None:
            self._current["text"] += data

    def handle_endtag(self, tag):
        if self._current is None:
            return

        self._depth -= 1
        if tag == "a" and self._depth == 0:
            self._current["text"] = " ".join(self._current["text"].split())
            self.anchors.append(self._current)
            self._current = None


def test_homepage_spatial_carousel_cards_link_to_showcase_categories():
    html = Path("index.html").read_text(encoding="utf-8")
    parser = SpatialCardAnchorParser()
    parser.feed(html)

    expected = {
        "Microdrama": "showcase.html#microdrama",
        "Feature Film": "showcase.html#feature-film",
        "Animation": "showcase.html#animation",
        "Branded Content": "showcase.html#branded-content",
    }

    assert len(parser.anchors) == len(expected)
    for title, href in expected.items():
        normalized_title = title.replace(" ", "")
        assert any(
            anchor["href"] == href and normalized_title in anchor["text"].replace(" ", "")
            for anchor in parser.anchors
        )


def test_showcase_contains_matching_deep_link_category_ids_and_hash_loader():
    html = Path("showcase.html").read_text(encoding="utf-8")

    for category_id in ["microdrama", "feature-film", "animation", "branded-content"]:
        assert f"id: '{category_id}'" in html

    assert "function openCategoryFromHash()" in html
    assert "window.location.hash" in html
    assert "categories.find(cat => cat.id === categoryId)" in html
    assert "window.addEventListener('hashchange', openCategoryFromHash)" in html
