"""Tests for deterministic options reload behavior."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from pywebasto.exceptions import UnauthorizedException

import custom_components.webastoconnect as integration
from custom_components.webastoconnect.config_flow import WebastoConnectOptionsFlow
from custom_components.webastoconnect.const import ATTR_UPDATE_LISTENER, DOMAIN


@pytest.mark.asyncio
async def test_async_setup_entry_registers_update_listener(monkeypatch) -> None:
    """Setup should register a config entry update listener."""
    hass = SimpleNamespace(
        data={},
        config_entries=SimpleNamespace(async_forward_entry_setups=AsyncMock()),
    )
    remove_listener = Mock()
    entry = SimpleNamespace(entry_id="entry-1", add_update_listener=Mock())
    entry.add_update_listener.return_value = remove_listener

    async def fake_setup(hass_obj, config_entry):
        hass_obj.data.setdefault(DOMAIN, {})
        hass_obj.data[DOMAIN][config_entry.entry_id] = {}
        return True

    monkeypatch.setattr(integration, "_async_setup", fake_setup)

    result = await integration.async_setup_entry(hass, entry)

    assert result is True
    entry.add_update_listener.assert_called_once_with(integration.async_reload_entry)
    assert hass.data[DOMAIN][entry.entry_id][ATTR_UPDATE_LISTENER] is remove_listener


@pytest.mark.asyncio
async def test_async_unload_entry_calls_remove_listener_on_success() -> None:
    """Unload should unsubscribe update listener before removing entry data."""
    remove_listener = Mock()
    entry = SimpleNamespace(entry_id="entry-1")
    hass = SimpleNamespace(
        data={DOMAIN: {"entry-1": {ATTR_UPDATE_LISTENER: remove_listener}}},
        config_entries=SimpleNamespace(async_unload_platforms=AsyncMock(return_value=True)),
    )

    unload_ok = await integration.async_unload_entry(hass, entry)

    assert unload_ok is True
    remove_listener.assert_called_once()
    assert "entry-1" not in hass.data[DOMAIN]


@pytest.mark.asyncio
async def test_options_flow_creates_entry_after_successful_auth(monkeypatch) -> None:
    """Options flow should create entry directly after successful auth."""
    connect_mock = AsyncMock()

    class FakeWebasto:
        """Minimal fake Webasto client for options flow tests."""

        def __init__(self, *args, **kwargs) -> None:
            """Initialize fake client."""

        async def connect(self) -> None:
            """Simulate successful auth."""
            await connect_mock()

    monkeypatch.setattr(
        "custom_components.webastoconnect.config_flow.WebastoConnect",
        FakeWebasto,
    )

    flow = object.__new__(WebastoConnectOptionsFlow)
    config_entry = SimpleNamespace(data={}, options={})
    flow.hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_get_known_entry=Mock(return_value=config_entry))
    )
    flow.handler = "entry-1"
    flow.async_create_entry = Mock(return_value={"type": "create_entry"})

    result = await flow.async_step_init({"email": "user@test", "password": "pw"})

    connect_mock.assert_awaited_once()
    flow.async_create_entry.assert_called_once_with(
        title="user@test", data={"email": "user@test", "password": "pw"}
    )
    assert result == {"type": "create_entry"}


@pytest.mark.asyncio
async def test_options_flow_returns_error_on_invalid_auth(monkeypatch) -> None:
    """Invalid auth should return form with invalid_auth error."""

    class FakeWebasto:
        """Fake client that always fails auth."""

        def __init__(self, *args, **kwargs) -> None:
            """Initialize fake client."""

        async def connect(self) -> None:
            """Simulate auth failure."""
            raise UnauthorizedException("invalid")

    monkeypatch.setattr(
        "custom_components.webastoconnect.config_flow.WebastoConnect",
        FakeWebasto,
    )

    flow = object.__new__(WebastoConnectOptionsFlow)
    config_entry = SimpleNamespace(data={}, options={})
    flow.hass = SimpleNamespace(
        config_entries=SimpleNamespace(async_get_known_entry=Mock(return_value=config_entry))
    )
    flow.handler = "entry-1"
    flow.async_show_form = Mock(return_value={"type": "form"})

    result = await flow.async_step_init({"email": "user@test", "password": "bad"})

    flow.async_show_form.assert_called_once()
    assert flow.async_show_form.call_args.kwargs["errors"] == {"base": "invalid_auth"}
    assert result == {"type": "form"}
