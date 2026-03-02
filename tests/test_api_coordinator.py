"""Tests for Webasto coordinator update handling."""

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
    coordinator.cloud = SimpleNamespace(update=update_mock)
    return coordinator


@pytest.mark.asyncio
async def test_update_data_calls_cloud_update() -> None:
    """Coordinator should call cloud update once."""
    update_mock = AsyncMock()
    coordinator = _build_coordinator(update_mock)

    await coordinator._async_update_data()

    update_mock.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_data_maps_unauthorized_to_auth_failed() -> None:
    """Unauthorized errors should trigger config entry reauth flow."""
    update_mock = AsyncMock(side_effect=UnauthorizedException("invalid auth"))
    coordinator = _build_coordinator(update_mock)

    with pytest.raises(ConfigEntryAuthFailed):
        await coordinator._async_update_data()


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
