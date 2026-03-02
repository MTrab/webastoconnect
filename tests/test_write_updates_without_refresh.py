"""Tests for write paths that avoid redundant coordinator refreshes."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from custom_components.webastoconnect.number import WebastoConnectNumber
from custom_components.webastoconnect.switch import WebastoConnectSwitch


@pytest.mark.asyncio
async def test_switch_turn_on_updates_listeners_without_refresh() -> None:
    """Switch turn_on should notify listeners and skip extra refresh."""
    command_fn = AsyncMock()
    coordinator = SimpleNamespace(
        async_update_listeners=Mock(),
        async_refresh=AsyncMock(),
    )
    switch = object.__new__(WebastoConnectSwitch)
    switch.entity_id = "switch.test"
    switch.entity_description = SimpleNamespace(command_fn=command_fn)
    switch._cloud = SimpleNamespace(devices={1: object()})
    switch._device_id = 1
    switch.coordinator = coordinator

    await switch.async_turn_on()

    command_fn.assert_awaited_once_with(switch._cloud, switch._cloud.devices[1], True)
    coordinator.async_update_listeners.assert_called_once()
    coordinator.async_refresh.assert_not_called()


@pytest.mark.asyncio
async def test_switch_turn_off_updates_listeners_without_refresh() -> None:
    """Switch turn_off should notify listeners and skip extra refresh."""
    command_fn = AsyncMock()
    coordinator = SimpleNamespace(
        async_update_listeners=Mock(),
        async_refresh=AsyncMock(),
    )
    switch = object.__new__(WebastoConnectSwitch)
    switch.entity_id = "switch.test"
    switch.entity_description = SimpleNamespace(command_fn=command_fn)
    switch._cloud = SimpleNamespace(devices={1: object()})
    switch._device_id = 1
    switch.coordinator = coordinator

    await switch.async_turn_off()

    command_fn.assert_awaited_once_with(switch._cloud, switch._cloud.devices[1], False)
    coordinator.async_update_listeners.assert_called_once()
    coordinator.async_refresh.assert_not_called()


@pytest.mark.asyncio
async def test_number_set_value_updates_listeners_without_refresh() -> None:
    """Number writes should notify listeners and skip extra refresh."""
    set_fn = AsyncMock()
    coordinator = SimpleNamespace(
        async_update_listeners=Mock(),
        async_refresh=AsyncMock(),
    )
    number = object.__new__(WebastoConnectNumber)
    number.entity_id = "number.test"
    number.entity_description = SimpleNamespace(set_fn=set_fn)
    number._cloud = SimpleNamespace(devices={1: object()})
    number._device_id = 1
    number.coordinator = coordinator

    await number.async_set_native_value(12.5)

    set_fn.assert_awaited_once_with(number._cloud.devices[1], 12.5)
    coordinator.async_update_listeners.assert_called_once()
    coordinator.async_refresh.assert_not_called()

