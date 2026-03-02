"""Tests for setup bootstrap refresh behavior."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from homeassistant.const import CONF_EMAIL

import custom_components.webastoconnect as integration
from custom_components.webastoconnect.const import ATTR_DEVICES, DOMAIN


@pytest.mark.asyncio
async def test_setup_skips_first_refresh_when_connect_hydrates_devices(monkeypatch) -> None:
    """Skip the coordinator first refresh if connect already provided devices."""
    created: list[SimpleNamespace] = []
    device = SimpleNamespace(name="Heater", device_id=1)

    def coordinator_factory(*_args, **_kwargs):
        coordinator = SimpleNamespace(
            cloud=SimpleNamespace(connect=AsyncMock(), devices={1: device}),
            async_config_entry_first_refresh=AsyncMock(),
            async_set_updated_data=Mock(),
        )
        created.append(coordinator)
        return coordinator

    monkeypatch.setattr(integration, "WebastoConnectUpdateCoordinator", coordinator_factory)
    monkeypatch.setattr(
        integration,
        "async_get_integration",
        AsyncMock(return_value=SimpleNamespace(version="test")),
    )
    monkeypatch.setattr(integration, "_async_migrate_unique_ids", AsyncMock())

    hass = SimpleNamespace(data={DOMAIN: {}})
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    assert await integration._async_setup(hass, entry) is True

    coordinator = created[0]
    coordinator.cloud.connect.assert_awaited_once()
    coordinator.async_set_updated_data.assert_called_once_with(None)
    coordinator.async_config_entry_first_refresh.assert_not_awaited()
    assert hass.data[DOMAIN]["entry-1"][ATTR_DEVICES][1] is device


@pytest.mark.asyncio
async def test_setup_runs_first_refresh_when_connect_has_no_devices(monkeypatch) -> None:
    """Run the coordinator first refresh when connect did not hydrate devices."""
    created: list[SimpleNamespace] = []

    def coordinator_factory(*_args, **_kwargs):
        coordinator = SimpleNamespace(
            cloud=SimpleNamespace(connect=AsyncMock(), devices={}),
            async_config_entry_first_refresh=AsyncMock(),
            async_set_updated_data=Mock(),
        )
        created.append(coordinator)
        return coordinator

    monkeypatch.setattr(integration, "WebastoConnectUpdateCoordinator", coordinator_factory)
    monkeypatch.setattr(
        integration,
        "async_get_integration",
        AsyncMock(return_value=SimpleNamespace(version="test")),
    )

    hass = SimpleNamespace(data={DOMAIN: {}})
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    assert await integration._async_setup(hass, entry) is True

    coordinator = created[0]
    coordinator.cloud.connect.assert_awaited_once()
    coordinator.async_config_entry_first_refresh.assert_awaited_once()
    coordinator.async_set_updated_data.assert_not_called()
