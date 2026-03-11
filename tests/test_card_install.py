"""Tests for bundled card install/version handling."""

from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from homeassistant.components.lovelace.const import CONF_RESOURCE_TYPE_WS, CONF_TYPE, CONF_URL, LOVELACE_DATA, MODE_STORAGE

import custom_components.webastoconnect as integration
from custom_components.webastoconnect.card_install import (
    ensure_card_installed,
    read_card_hash,
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


def test_read_card_hash_returns_short_hash(tmp_path: Path) -> None:
    """Card hash should be stable and short enough for cache-busting."""
    card_file = tmp_path / "card.js"
    card_file.write_text("console.log('webasto');", encoding="utf-8")

    card_hash = read_card_hash(card_file)

    assert card_hash is not None
    assert len(card_hash) == 12


def test_should_install_card_logic(tmp_path: Path) -> None:
    """Install should happen when file missing, version differs, or content changes."""
    source = tmp_path / "source-webasto-connect-card.js"
    target = tmp_path / "webasto-connect-card.js"
    source.write_text("same-content", encoding="utf-8")

    assert should_install_card("0.1.0", None, source, target) is True

    target.write_text("same-content", encoding="utf-8")
    assert should_install_card("0.1.0", "0.1.0", source, target) is False
    assert should_install_card("0.1.0", "0.0.9", source, target) is True
    assert should_install_card(None, "0.1.0", source, target) is False

    target.write_text("changed-content", encoding="utf-8")
    assert should_install_card("0.1.0", "0.1.0", source, target) is True


def test_ensure_card_installed_copies_bundle(tmp_path: Path) -> None:
    """Built card should be copied to www folder."""
    integration_path = _prepare_source_tree(tmp_path, "0.1.0")
    www_path = tmp_path / "www"

    installed, version, card_hash = ensure_card_installed(integration_path, www_path)

    assert installed is True
    assert version == "0.1.0"
    assert card_hash is not None
    assert (www_path / "webastoconnect" / "webasto-connect-card.js").exists()


def test_ensure_card_installed_skips_when_up_to_date(tmp_path: Path) -> None:
    """Second install with same version should be skipped."""
    integration_path = _prepare_source_tree(tmp_path, "0.1.0")
    www_path = tmp_path / "www"

    first_installed, _, _ = ensure_card_installed(integration_path, www_path)
    second_installed, version, card_hash = ensure_card_installed(
        integration_path, www_path
    )

    assert first_installed is True
    assert second_installed is False
    assert version == "0.1.0"
    assert card_hash is not None


@pytest.mark.asyncio
async def test_ensure_lovelace_resource_updates_stable_path_with_hash() -> None:
    """Resource URL should keep a stable path and only change the hash query."""
    resources = SimpleNamespace(
        async_items=lambda: [
            {
                "id": "res-1",
                CONF_URL: "/local/webastoconnect/webasto-connect-card.js?v=oldhash",
                CONF_TYPE: "module",
            }
        ],
        async_update_item=AsyncMock(),
        async_create_item=AsyncMock(),
    )
    hass = SimpleNamespace(
        data={
            LOVELACE_DATA: SimpleNamespace(
                resource_mode=MODE_STORAGE,
                resources=resources,
            )
        }
    )

    await integration._async_ensure_lovelace_card_resource(hass, "newhash123456")

    resources.async_update_item.assert_awaited_once_with(
        "res-1",
        {CONF_URL: "/local/webastoconnect/webasto-connect-card.js?v=newhash123456"},
    )
    resources.async_create_item.assert_not_called()


@pytest.mark.asyncio
async def test_ensure_lovelace_resource_creates_stable_path_when_missing() -> None:
    """Missing resource should be created at the stable card path."""
    resources = SimpleNamespace(
        async_items=lambda: [],
        async_update_item=AsyncMock(),
        async_create_item=AsyncMock(),
    )
    hass = SimpleNamespace(
        data={
            LOVELACE_DATA: SimpleNamespace(
                resource_mode=MODE_STORAGE,
                resources=resources,
            )
        }
    )

    await integration._async_ensure_lovelace_card_resource(hass, "abc123def456")

    resources.async_create_item.assert_awaited_once_with(
        {
            CONF_URL: "/local/webastoconnect/webasto-connect-card.js?v=abc123def456",
            CONF_RESOURCE_TYPE_WS: "module",
        }
    )
    resources.async_update_item.assert_not_called()
