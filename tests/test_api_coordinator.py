"""Tests for Webasto coordinator update handling."""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import UpdateFailed
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

from custom_components.webastoconnect.api import (
    MAX_CONSECUTIVE_UNAUTHORIZED,
    UNAUTHORIZED_RETRY_AFTER,
    WebastoConnectUpdateCoordinator,
)


def _build_coordinator(update_mock: AsyncMock) -> WebastoConnectUpdateCoordinator:
    """Create a minimal coordinator instance for unit testing."""
    coordinator = object.__new__(WebastoConnectUpdateCoordinator)
    coordinator.cloud = SimpleNamespace(update=update_mock, connect=AsyncMock())
    coordinator._consecutive_unauthorized = 0
    coordinator._cloud_operation_lock = asyncio.Lock()
    return coordinator


@pytest.mark.asyncio
async def test_update_data_calls_cloud_update() -> None:
    """Coordinator should call cloud update once."""
    update_mock = AsyncMock()
    coordinator = _build_coordinator(update_mock)

    await coordinator._async_update_data()

    update_mock.assert_awaited_once()
    assert coordinator._consecutive_unauthorized == 0


@pytest.mark.asyncio
async def test_update_data_retries_on_transient_unauthorized() -> None:
    """Unauthorized should retry first before escalating to reauth."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("invalid auth"))
    coordinator = _build_coordinator(update_mock)

    with pytest.raises(UpdateFailed) as exc_info:
        await coordinator._async_update_data()

    assert exc_info.value.retry_after == UNAUTHORIZED_RETRY_AFTER
    assert coordinator._consecutive_unauthorized == 1


@pytest.mark.asyncio
async def test_update_data_raises_auth_failed_after_consecutive_unauthorized() -> None:
    """Repeated unauthorized responses should trigger reauth."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("invalid auth"))
    coordinator = _build_coordinator(update_mock)
    coordinator.cloud.connect = AsyncMock(
        side_effect=UnauthorizedException("invalid auth")
    )

    for _ in range(MAX_CONSECUTIVE_UNAUTHORIZED - 1):
        with pytest.raises(UpdateFailed):
            await coordinator._async_update_data()

    with pytest.raises(ConfigEntryAuthFailed):
        await coordinator._async_update_data()


@pytest.mark.asyncio
async def test_update_data_does_not_reauth_when_validation_succeeds() -> None:
    """Credential re-validation success should avoid triggering reauth."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("transient unauthorized"))
    coordinator = _build_coordinator(update_mock)

    for _ in range(MAX_CONSECUTIVE_UNAUTHORIZED - 1):
        with pytest.raises(UpdateFailed):
            await coordinator._async_update_data()

    await coordinator._async_update_data()

    coordinator.cloud.connect.assert_awaited_once()
    assert coordinator._consecutive_unauthorized == 0


@pytest.mark.asyncio
async def test_update_data_reauth_validation_network_failure_is_transient() -> None:
    """Unexpected errors during auth validation should not trigger reauth."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("transient unauthorized"))
    coordinator = _build_coordinator(update_mock)
    coordinator.cloud.connect = AsyncMock(side_effect=RuntimeError("network down"))

    for _ in range(MAX_CONSECUTIVE_UNAUTHORIZED - 1):
        with pytest.raises(UpdateFailed):
            await coordinator._async_update_data()

    with pytest.raises(UpdateFailed) as exc_info:
        await coordinator._async_update_data()

    assert exc_info.value.retry_after == 300
    assert coordinator._consecutive_unauthorized == 0


@pytest.mark.asyncio
async def test_update_data_resets_unauthorized_counter_after_success() -> None:
    """A successful update should clear unauthorized streak."""
    update_mock = AsyncMock(side_effect=[UnauthorizedException("invalid auth"), None])
    coordinator = _build_coordinator(update_mock)

    with pytest.raises(UpdateFailed):
        await coordinator._async_update_data()

    assert coordinator._consecutive_unauthorized == 1

    await coordinator._async_update_data()
    assert coordinator._consecutive_unauthorized == 0


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
