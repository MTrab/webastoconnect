"""Tests for bundled card install/version handling."""

from pathlib import Path

from custom_components.webastoconnect.card_install import (
    ensure_card_installed,
    read_card_version,
    should_install_card,
)


def _prepare_source_tree(base: Path, version: str) -> Path:
    integration_path = base / "integration"
    source_dir = integration_path / "card"
    source_dir.mkdir(parents=True)

    (source_dir / "webasto-connect-card.js").write_text(
        f'globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "{version}";\n'
        "console.log('webasto card');",
        encoding="utf-8",
    )
    return integration_path


def test_read_card_version_returns_none_on_missing(tmp_path: Path) -> None:
    """Missing card file should return None."""
    assert read_card_version(tmp_path / "missing.js") is None


def test_read_card_version_from_js_marker(tmp_path: Path) -> None:
    """Card version should be parsed from JavaScript marker line."""
    card_file = tmp_path / "card.js"
    card_file.write_text(
        'globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0";',
        encoding="utf-8",
    )

    assert read_card_version(card_file) == "0.1.0"


def test_should_install_card_logic(tmp_path: Path) -> None:
    """Install should happen when file missing or version differs."""
    target = tmp_path / "webasto-connect-card.js"

    assert should_install_card("0.1.0", None, target) is True

    target.write_text("x", encoding="utf-8")
    assert should_install_card("0.1.0", "0.1.0", target) is False
    assert should_install_card("0.1.0", "0.0.9", target) is True
    assert should_install_card(None, "0.1.0", target) is False


def test_ensure_card_installed_copies_bundle(tmp_path: Path) -> None:
    """Built card should be copied to www folder."""
    integration_path = _prepare_source_tree(tmp_path, "0.1.0")
    www_path = tmp_path / "www"

    installed, version = ensure_card_installed(integration_path, www_path)

    assert installed is True
    assert version == "0.1.0"
    assert (www_path / "webastoconnect" / "webasto-connect-card.js").exists()


def test_ensure_card_installed_skips_when_up_to_date(tmp_path: Path) -> None:
    """Second install with same version should be skipped."""
    integration_path = _prepare_source_tree(tmp_path, "0.1.0")
    www_path = tmp_path / "www"

    first_installed, _ = ensure_card_installed(integration_path, www_path)
    second_installed, version = ensure_card_installed(integration_path, www_path)

    assert first_installed is True
    assert second_installed is False
    assert version == "0.1.0"
