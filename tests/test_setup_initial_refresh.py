"""Tests for setup bootstrap refresh behavior."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from homeassistant.const import CONF_EMAIL
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

import custom_components.webastoconnect as integration


def _mock_hass_for_setup() -> SimpleNamespace:
    """Build a minimal hass mock compatible with integration._async_setup."""
    return SimpleNamespace(
        async_add_executor_job=AsyncMock(return_value=(False, None, None)),
        config=SimpleNamespace(path=lambda *_args, **_kwargs: "/tmp"),
        data={},
    )


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

    monkeypatch.setattr(
        integration, "WebastoConnectUpdateCoordinator", coordinator_factory
    )
    monkeypatch.setattr(
        integration,
        "async_get_integration",
        AsyncMock(return_value=SimpleNamespace(version="test", file_path="/tmp")),
    )
    migrate_mock = AsyncMock()
    monkeypatch.setattr(integration, "_async_migrate_unique_ids", migrate_mock)

    hass = _mock_hass_for_setup()
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    result = await integration._async_setup(hass, entry)

    coordinator = created[0]
    assert result is coordinator
    coordinator.cloud.connect.assert_awaited_once()
    coordinator.async_set_updated_data.assert_called_once_with(None)
    coordinator.async_config_entry_first_refresh.assert_not_awaited()
    migrate_mock.assert_awaited_once_with(hass, 1, "Heater", entry)


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

    monkeypatch.setattr(
        integration, "WebastoConnectUpdateCoordinator", coordinator_factory
    )
    monkeypatch.setattr(
        integration,
        "async_get_integration",
        AsyncMock(return_value=SimpleNamespace(version="test", file_path="/tmp")),
    )

    hass = _mock_hass_for_setup()
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    result = await integration._async_setup(hass, entry)

    coordinator = created[0]
    assert result is coordinator
    coordinator.cloud.connect.assert_awaited_once()
    coordinator.async_config_entry_first_refresh.assert_awaited_once()
    coordinator.async_set_updated_data.assert_not_called()


@pytest.mark.asyncio
async def test_setup_closes_client_when_connect_auth_fails(monkeypatch) -> None:
    """Failed auth during setup should close the pywebasto client."""
    created: list[SimpleNamespace] = []

    def coordinator_factory(*_args, **_kwargs):
        coordinator = SimpleNamespace(
            cloud=SimpleNamespace(
                connect=AsyncMock(side_effect=UnauthorizedException("bad auth")),
                close=AsyncMock(),
                devices={},
            ),
            async_config_entry_first_refresh=AsyncMock(),
            async_set_updated_data=Mock(),
        )
        created.append(coordinator)
        return coordinator

    monkeypatch.setattr(
        integration, "WebastoConnectUpdateCoordinator", coordinator_factory
    )
    monkeypatch.setattr(
        integration,
        "async_get_integration",
        AsyncMock(return_value=SimpleNamespace(version="test", file_path="/tmp")),
    )

    hass = _mock_hass_for_setup()
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    with pytest.raises(ConfigEntryAuthFailed):
        await integration._async_setup(hass, entry)

    created[0].cloud.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_setup_closes_client_when_connect_temporarily_fails(monkeypatch) -> None:
    """Temporary connect failures during setup should close the pywebasto client."""
    created: list[SimpleNamespace] = []

    def coordinator_factory(*_args, **_kwargs):
        coordinator = SimpleNamespace(
            cloud=SimpleNamespace(
                connect=AsyncMock(side_effect=InvalidRequestException("retry later")),
                close=AsyncMock(),
                devices={},
            ),
            async_config_entry_first_refresh=AsyncMock(),
            async_set_updated_data=Mock(),
        )
        created.append(coordinator)
        return coordinator

    monkeypatch.setattr(
        integration, "WebastoConnectUpdateCoordinator", coordinator_factory
    )
    monkeypatch.setattr(
        integration,
        "async_get_integration",
        AsyncMock(return_value=SimpleNamespace(version="test", file_path="/tmp")),
    )

    hass = _mock_hass_for_setup()
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    with pytest.raises(ConfigEntryNotReady):
        await integration._async_setup(hass, entry)

    created[0].cloud.close.assert_awaited_once()
