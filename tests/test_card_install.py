"""Tests for bundled card install/version handling."""

from pathlib import Path

from custom_components.webastoconnect.card_install import (
    ensure_card_installed,
    read_version_file,
    should_install_card,
)


def _prepare_source_tree(base: Path, version: str) -> Path:
    integration_path = base / "integration"
    source_dir = integration_path / "card"
    (source_dir / "localize").mkdir(parents=True)
    (source_dir / "translations").mkdir(parents=True)

    (source_dir / "webasto-connect-card.js").write_text(
        "console.log('webasto card');", encoding="utf-8"
    )
    (source_dir / "VERSION").write_text(version, encoding="utf-8")
    (source_dir / "localize" / "localize.js").write_text(
        "export const x = 1;", encoding="utf-8"
    )
    (source_dir / "translations" / "en.json").write_text(
        '{"card":{"ui":{"mode":"Mode"}}}', encoding="utf-8"
    )
    return integration_path


def test_read_version_file_returns_none_on_missing(tmp_path: Path) -> None:
    """Missing version file should return None."""
    assert read_version_file(tmp_path / "missing") is None


def test_should_install_card_logic(tmp_path: Path) -> None:
    """Install should happen when file missing or version differs."""
    target = tmp_path / "webasto-connect-card.js"

    assert should_install_card("0.1.0", None, target) is True

    target.write_text("x", encoding="utf-8")
    assert should_install_card("0.1.0", "0.1.0", target) is False
    assert should_install_card("0.1.0", "0.0.9", target) is True
    assert should_install_card(None, "0.1.0", target) is False


def test_ensure_card_installed_copies_assets_and_version(tmp_path: Path) -> None:
    """Card files should be copied to www folder and version persisted."""
    integration_path = _prepare_source_tree(tmp_path, "0.1.0")
    www_path = tmp_path / "www"

    installed, version = ensure_card_installed(integration_path, www_path)

    assert installed is True
    assert version == "0.1.0"
    assert (www_path / "webastoconnect" / "webasto-connect-card.js").exists()
    assert (www_path / "webastoconnect" / "localize" / "localize.js").exists()
    assert (www_path / "webastoconnect" / "translations" / "en.json").exists()
    assert (
        (www_path / "webastoconnect" / "webasto-connect-card.version").read_text(
            encoding="utf-8"
        )
        == "0.1.0"
    )


def test_ensure_card_installed_skips_when_up_to_date(tmp_path: Path) -> None:
    """Second install with same version should be skipped."""
    integration_path = _prepare_source_tree(tmp_path, "0.1.0")
    www_path = tmp_path / "www"

    first_installed, _ = ensure_card_installed(integration_path, www_path)
    second_installed, version = ensure_card_installed(integration_path, www_path)

    assert first_installed is True
    assert second_installed is False
    assert version == "0.1.0"
