"""Tests for write paths that avoid redundant coordinator refreshes."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from custom_components.webastoconnect.number import NUMBERS, WebastoConnectNumber
from custom_components.webastoconnect.switch import WebastoConnectSwitch


async def _passthrough_cloud_call(func, *args):
    """Execute cloud calls directly for write-path unit tests."""
    return await func(*args)


@pytest.mark.asyncio
async def test_switch_turn_on_updates_listeners_without_refresh() -> None:
    """Switch turn_on should notify listeners and skip extra refresh."""
    command_fn = AsyncMock()
    coordinator = SimpleNamespace(
        async_update_listeners=Mock(),
        async_refresh=AsyncMock(),
        async_execute_cloud_call=AsyncMock(side_effect=_passthrough_cloud_call),
    )
    switch = object.__new__(WebastoConnectSwitch)
    switch.entity_id = "switch.test"
    switch.entity_description = SimpleNamespace(command_fn=command_fn)
    switch._cloud = SimpleNamespace(devices={1: object()})
    switch._device_id = 1
    switch.coordinator = coordinator

    await switch.async_turn_on()

    command_fn.assert_awaited_once_with(switch._cloud, switch._cloud.devices[1], True)
    coordinator.async_execute_cloud_call.assert_awaited_once()
    coordinator.async_update_listeners.assert_called_once()
    coordinator.async_refresh.assert_not_called()


@pytest.mark.asyncio
async def test_switch_turn_off_updates_listeners_without_refresh() -> None:
    """Switch turn_off should notify listeners and skip extra refresh."""
    command_fn = AsyncMock()
    coordinator = SimpleNamespace(
        async_update_listeners=Mock(),
        async_refresh=AsyncMock(),
        async_execute_cloud_call=AsyncMock(side_effect=_passthrough_cloud_call),
    )
    switch = object.__new__(WebastoConnectSwitch)
    switch.entity_id = "switch.test"
    switch.entity_description = SimpleNamespace(command_fn=command_fn)
    switch._cloud = SimpleNamespace(devices={1: object()})
    switch._device_id = 1
    switch.coordinator = coordinator

    await switch.async_turn_off()

    command_fn.assert_awaited_once_with(switch._cloud, switch._cloud.devices[1], False)
    coordinator.async_execute_cloud_call.assert_awaited_once()
    coordinator.async_update_listeners.assert_called_once()
    coordinator.async_refresh.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("description_key", "method_name", "value"),
    [
        ("low_voltage_cutoff", "set_low_voltage_cutoff", 12.5),
        ("ext_temp_comp", "set_temperature_compensation", -1.5),
    ],
)
async def test_number_set_value_updates_listeners_without_refresh(
    description_key: str, method_name: str, value: float
) -> None:
    """Number writes should notify listeners and skip extra refresh."""
    set_fn = AsyncMock()
    device = object()
    cloud = SimpleNamespace(devices={1: device}, **{method_name: set_fn})
    coordinator = SimpleNamespace(
        async_update_listeners=Mock(),
        async_refresh=AsyncMock(),
        async_execute_cloud_call=AsyncMock(side_effect=_passthrough_cloud_call),
    )
    number = object.__new__(WebastoConnectNumber)
    number.entity_id = "number.test"
    number.entity_description = next(
        description for description in NUMBERS if description.key == description_key
    )
    number._cloud = cloud
    number._device_id = 1
    number.coordinator = coordinator

    await number.async_set_native_value(value)

    set_fn.assert_awaited_once_with(device, value)
    coordinator.async_execute_cloud_call.assert_awaited_once_with(
        number.entity_description.set_fn, cloud, device, value
    )
    coordinator.async_update_listeners.assert_called_once()
    coordinator.async_refresh.assert_not_called()
