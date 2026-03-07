"""Tests for Webasto coordinator update handling."""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import UpdateFailed
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

from custom_components.webastoconnect.api import WebastoConnectUpdateCoordinator


def _build_coordinator(update_mock: AsyncMock) -> WebastoConnectUpdateCoordinator:
    """Create a minimal coordinator instance for unit testing."""
    coordinator = object.__new__(WebastoConnectUpdateCoordinator)
    coordinator.cloud = SimpleNamespace(update=update_mock, connect=AsyncMock())
    coordinator._cloud_operation_lock = asyncio.Lock()
    return coordinator


@pytest.mark.asyncio
async def test_update_data_calls_cloud_update() -> None:
    """Coordinator should call cloud update once."""
    update_mock = AsyncMock()
    coordinator = _build_coordinator(update_mock)

    await coordinator._async_update_data()

    update_mock.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_data_validates_auth_immediately_on_unauthorized() -> None:
    """Unauthorized should immediately trigger credential validation."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("unauthorized"))
    coordinator = _build_coordinator(update_mock)
    coordinator.cloud.connect = AsyncMock()

    await coordinator._async_update_data()

    coordinator.cloud.connect.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_data_raises_auth_failed_when_validation_is_unauthorized() -> None:
    """Unauthorized during validation should trigger reauth."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("invalid auth"))
    coordinator = _build_coordinator(update_mock)
    coordinator.cloud.connect = AsyncMock(
        side_effect=UnauthorizedException("invalid auth")
    )

    with pytest.raises(ConfigEntryAuthFailed):
        await coordinator._async_update_data()


@pytest.mark.asyncio
async def test_update_data_unauthorized_validation_invalid_request_is_transient() -> None:
    """Invalid request during auth validation should stay transient."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("unauthorized"))
    coordinator = _build_coordinator(update_mock)
    coordinator.cloud.connect = AsyncMock(side_effect=InvalidRequestException("bad state"))

    with pytest.raises(UpdateFailed):
        await coordinator._async_update_data()


@pytest.mark.asyncio
async def test_update_data_unauthorized_validation_network_failure_is_transient() -> None:
    """Unexpected errors during auth validation should not trigger reauth."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("unauthorized"))
    coordinator = _build_coordinator(update_mock)
    coordinator.cloud.connect = AsyncMock(side_effect=RuntimeError("network down"))

    with pytest.raises(UpdateFailed) as exc_info:
        await coordinator._async_update_data()

    assert exc_info.value.retry_after == 300


@pytest.mark.asyncio
async def test_update_data_maps_invalid_request_to_update_failed() -> None:
    """Invalid requests should raise UpdateFailed for coordinator retries."""
    update_mock = AsyncMock(side_effect=InvalidRequestException("bad request"))
    coordinator = _build_coordinator(update_mock)

    with pytest.raises(UpdateFailed):
        await coordinator._async_update_data()


@pytest.mark.asyncio
async def test_update_data_sets_retry_after_for_unexpected_errors() -> None:
    """Unexpected exceptions should request delayed retry."""
    update_mock = AsyncMock(side_effect=RuntimeError("boom"))
    coordinator = _build_coordinator(update_mock)

    with pytest.raises(UpdateFailed) as exc_info:
        await coordinator._async_update_data()

    assert exc_info.value.retry_after == 300


@pytest.mark.asyncio
async def test_update_data_includes_exception_type_for_unexpected_errors() -> None:
    """Unexpected failures should include original exception type in message."""
    update_mock = AsyncMock(side_effect=TimeoutError())
    coordinator = _build_coordinator(update_mock)

    with pytest.raises(UpdateFailed) as exc_info:
        await coordinator._async_update_data()

    assert exc_info.value.retry_after == 300
    assert "TimeoutError" in str(exc_info.value)
