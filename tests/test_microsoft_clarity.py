from pathlib import Path


PUBLIC_HTML = [
    Path("index.html"),
    Path("showcase.html"),
    Path("press-release.html"),
    Path("skill-policy/index.html"),
]


def test_microsoft_clarity_is_installed_on_public_pages():
    for path in PUBLIC_HTML:
        html = path.read_text(encoding="utf-8")
        assert "https://www.clarity.ms/tag/" in html
        assert '})(window, document, "clarity", "script", "xm4rsune6r");' in html
        assert html.count("www.clarity.ms/tag/") == 1


def test_clarity_data_export_token_is_not_committed():
    combined = "\n".join(path.read_text(encoding="utf-8") for path in PUBLIC_HTML)
    assert "clarity.Data.Exporter" not in combined
    assert "eyJhbGciOiJSUzI1Ni" not in combined
