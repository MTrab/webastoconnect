"""Tests for setup bootstrap refresh behavior."""

from types import SimpleNamespace
from pathlib import Path
from unittest.mock import AsyncMock, Mock

import pytest
from homeassistant.const import CONF_EMAIL
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryError,
)
from pywebasto.exceptions import (
    InvalidRequestException,
    TooManyRequestsException,
    UnauthorizedException,
)

import custom_components.webastoconnect as integration


@pytest.fixture(autouse=True)
def mock_issue_delete(monkeypatch) -> None:
    """Avoid using the real issue registry in setup unit tests."""
    monkeypatch.setattr(integration.ir, "async_delete_issue", Mock())
    monkeypatch.setattr(
        integration, "_async_webapi_device_names", AsyncMock(return_value={})
    )


def _mock_hass_for_setup() -> SimpleNamespace:
    """Build a minimal hass mock compatible with integration._async_setup."""

    async def async_add_executor_job(func, *args):
        if getattr(func, "__name__", "") == "ensure_card_installed":
            return (False, None, None)
        return func(*args)

    return SimpleNamespace(
        async_add_executor_job=async_add_executor_job,
        config=SimpleNamespace(
            path=lambda *parts, **_kwargs: str(Path("/tmp", *parts))
        ),
        data={},
    )


@pytest.mark.asyncio
async def test_setup_skips_first_refresh_when_connect_hydrates_devices(
    monkeypatch,
) -> None:
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
    update_device_name_mock = AsyncMock()
    monkeypatch.setattr(
        integration, "_async_update_device_registry_name", update_device_name_mock
    )

    hass = _mock_hass_for_setup()
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    result = await integration._async_setup(hass, entry)

    coordinator = created[0]
    assert result is coordinator
    coordinator.cloud.connect.assert_awaited_once()
    coordinator.async_set_updated_data.assert_called_once_with(None)
    coordinator.async_config_entry_first_refresh.assert_not_awaited()
    migrate_mock.assert_awaited_once_with(hass, 1, "Heater", entry)
    update_device_name_mock.assert_awaited_once_with(hass, 1, "Heater")


@pytest.mark.asyncio
async def test_setup_runs_first_refresh_when_connect_has_no_devices(
    monkeypatch,
) -> None:
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

    with pytest.raises(ConfigEntryError):
        await integration._async_setup(hass, entry)

    created[0].cloud.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_setup_closes_client_when_connect_is_rate_limited(monkeypatch) -> None:
    """Rate-limited setup should close the pywebasto client."""
    created: list[SimpleNamespace] = []

    def coordinator_factory(*_args, **_kwargs):
        coordinator = SimpleNamespace(
            cloud=SimpleNamespace(
                connect=AsyncMock(side_effect=TooManyRequestsException("too many")),
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

    with pytest.raises(ConfigEntryError) as exc_info:
        await integration._async_setup(hass, entry)

    assert "Rate limited" in str(exc_info.value)
    created[0].cloud.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_setup_stops_when_device_is_pending_approval(monkeypatch) -> None:
    """Pending approval should stop setup and create a repair issue."""
    created: list[SimpleNamespace] = []
    issues: list[dict] = []
    deleted_issues: list[tuple] = []
    device = SimpleNamespace(name="Heater", device_id=1, pending_approval=True)

    def coordinator_factory(*_args, **_kwargs):
        coordinator = SimpleNamespace(
            cloud=SimpleNamespace(
                connect=AsyncMock(),
                close=AsyncMock(),
                devices={1: device},
            ),
            async_config_entry_first_refresh=AsyncMock(),
            async_set_updated_data=Mock(),
        )
        created.append(coordinator)
        return coordinator

    def create_issue(*args, **kwargs):
        issues.append({"args": args, "kwargs": kwargs})

    def delete_issue(*args):
        deleted_issues.append(args)

    monkeypatch.setattr(
        integration, "WebastoConnectUpdateCoordinator", coordinator_factory
    )
    monkeypatch.setattr(
        integration,
        "async_get_integration",
        AsyncMock(return_value=SimpleNamespace(version="test", file_path="/tmp")),
    )
    monkeypatch.setattr(integration.ir, "async_create_issue", create_issue)
    monkeypatch.setattr(integration.ir, "async_delete_issue", delete_issue)

    hass = _mock_hass_for_setup()
    entry = SimpleNamespace(entry_id="entry-1", data={CONF_EMAIL: "a@b.c"}, options={})

    with pytest.raises(ConfigEntryError) as exc_info:
        await integration._async_setup(hass, entry)

    assert "pending approval" in str(exc_info.value)
    created[0].cloud.close.assert_awaited_once()
    created[0].async_set_updated_data.assert_not_called()
    created[0].async_config_entry_first_refresh.assert_not_awaited()
    assert issues[0]["kwargs"]["is_fixable"] is True
    assert issues[0]["kwargs"]["data"] == {"entry_id": "entry-1"}
    assert issues[0]["kwargs"]["translation_key"] == "pending_approval"
    assert issues[0]["kwargs"]["translation_placeholders"] == {"devices": "Heater"}
    assert not deleted_issues


def test_device_names_from_webapi_data() -> None:
    """Device names should be extracted from webapi data."""
    data = {
        "id": "123",
        "alias": "Car",
        "account_info": {"devices": [["456", "Van"]]},
    }

    assert integration._device_names_from_webapi_data(data) == {
        "123": "Car",
        "456": "Van",
    }
