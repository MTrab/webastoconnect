"""Tests for deterministic options reload behavior."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

import custom_components.webastoconnect as integration
from custom_components.webastoconnect.config_flow import WebastoConnectOptionsFlow


@pytest.mark.asyncio
async def test_async_setup_entry_registers_update_listener(monkeypatch) -> None:
    """Setup should register a config entry update listener."""
    services = SimpleNamespace(
        has_service=Mock(return_value=False),
        async_register=Mock(),
        async_remove=Mock(),
    )
    hass = SimpleNamespace(
        data={},
        config_entries=SimpleNamespace(async_forward_entry_setups=AsyncMock()),
        services=services,
    )
    remove_listener = Mock()
    entry = SimpleNamespace(entry_id="entry-1", add_update_listener=Mock())
    entry.add_update_listener.return_value = remove_listener
    coordinator = SimpleNamespace()

    async def fake_setup(hass_obj, config_entry):
        return coordinator

    monkeypatch.setattr(integration, "_async_setup", fake_setup)

    result = await integration.async_setup_entry(hass, entry)

    assert result is True
    entry.add_update_listener.assert_called_once_with(integration.async_reload_entry)
    assert entry.runtime_data.coordinator is coordinator
    assert entry.runtime_data.update_listener is remove_listener


@pytest.mark.asyncio
async def test_async_unload_entry_calls_remove_listener_on_success() -> None:
    """Unload should unsubscribe update listener before removing entry data."""
    remove_listener = Mock()
    close_mock = AsyncMock()
    services = SimpleNamespace(
        has_service=Mock(return_value=True),
        async_register=Mock(),
        async_remove=Mock(),
    )
    entry = SimpleNamespace(
        entry_id="entry-1",
        runtime_data=SimpleNamespace(
            update_listener=remove_listener,
            coordinator=SimpleNamespace(cloud=SimpleNamespace(close=close_mock)),
        ),
    )
    hass = SimpleNamespace(
        config_entries=SimpleNamespace(
            async_unload_platforms=AsyncMock(return_value=True),
            async_entries=Mock(return_value=[]),
        ),
        services=services,
    )

    unload_ok = await integration.async_unload_entry(hass, entry)

    assert unload_ok is True
    close_mock.assert_awaited_once()
    remove_listener.assert_called_once()


@pytest.mark.asyncio
async def test_options_flow_creates_entry_after_successful_auth(monkeypatch) -> None:
    """Options flow should create entry directly after successful auth."""
    connect_mock = AsyncMock()
    close_mock = AsyncMock()

    class FakeWebasto:
        """Minimal fake Webasto client for options flow tests."""

        def __init__(self, *args, **kwargs) -> None:
            """Initialize fake client."""

        async def connect(self) -> None:
            """Simulate successful auth."""
            await connect_mock()

        async def close(self) -> None:
            """Close fake resources."""
            await close_mock()

    monkeypatch.setattr(
        "custom_components.webastoconnect.config_flow.WebastoConnect",
        FakeWebasto,
    )

    flow = object.__new__(WebastoConnectOptionsFlow)
    config_entry = SimpleNamespace(data={}, options={})
    flow.hass = SimpleNamespace(
        config_entries=SimpleNamespace(
            async_get_known_entry=Mock(return_value=config_entry)
        )
    )
    flow.handler = "entry-1"
    flow.async_create_entry = Mock(return_value={"type": "create_entry"})

    result = await flow.async_step_init({"email": "user@test", "password": "pw"})

    connect_mock.assert_awaited_once()
    close_mock.assert_awaited_once()
    flow.async_create_entry.assert_called_once_with(
        title="user@test", data={"email": "user@test", "password": "pw"}
    )
    assert result == {"type": "create_entry"}


@pytest.mark.asyncio
async def test_options_flow_returns_error_on_invalid_auth(monkeypatch) -> None:
    """Invalid auth should return form with invalid_auth error."""
    close_mock = AsyncMock()

    class FakeWebasto:
        """Fake client that always fails auth."""

        def __init__(self, *args, **kwargs) -> None:
            """Initialize fake client."""

        async def connect(self) -> None:
            """Simulate auth failure."""
            raise UnauthorizedException("invalid")

        async def close(self) -> None:
            """Close fake resources."""
            await close_mock()

    monkeypatch.setattr(
        "custom_components.webastoconnect.config_flow.WebastoConnect",
        FakeWebasto,
    )

    flow = object.__new__(WebastoConnectOptionsFlow)
    config_entry = SimpleNamespace(data={}, options={})
    flow.hass = SimpleNamespace(
        config_entries=SimpleNamespace(
            async_get_known_entry=Mock(return_value=config_entry)
        )
    )
    flow.handler = "entry-1"
    flow.async_show_form = Mock(return_value={"type": "form"})

    result = await flow.async_step_init({"email": "user@test", "password": "bad"})

    flow.async_show_form.assert_called_once()
    close_mock.assert_awaited_once()
    assert flow.async_show_form.call_args.kwargs["errors"] == {"base": "invalid_auth"}
    assert result == {"type": "form"}


@pytest.mark.asyncio
async def test_options_flow_returns_error_on_connection_validation_failure(
    monkeypatch,
) -> None:
    """Connection validation errors should return cannot_connect."""
    close_mock = AsyncMock()

    class FakeWebasto:
        """Fake client that fails to validate connection."""

        def __init__(self, *args, **kwargs) -> None:
            """Initialize fake client."""

        async def connect(self) -> None:
            """Simulate API validation failure."""
            raise InvalidRequestException("bad response")

        async def close(self) -> None:
            """Close fake resources."""
            await close_mock()

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
    close_mock.assert_awaited_once()
    assert flow.async_show_form.call_args.kwargs["errors"] == {"base": "cannot_connect"}
    assert result == {"type": "form"}
