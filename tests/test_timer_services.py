"""Tests for Webasto timer service helpers."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from homeassistant.exceptions import HomeAssistantError

from custom_components.webastoconnect.services import (
    LINE_VENTILATION,
    SimpleTimer,
    _coerce_timer,
    async_create_timer,
    async_delete_timer,
    async_update_timer,
)


class _CoordinatorStub:
    """Coordinator stub with lock-wrapped execution behavior."""

    def __init__(self, timers: list[SimpleTimer]) -> None:
        self.cloud = SimpleNamespace(
            get_timers=AsyncMock(return_value=list(timers)),
            save_timers=AsyncMock(),
        )
        self.async_update_listeners = Mock()
        self.execute_calls = 0

    async def async_execute_cloud_call(self, cloud_call, *args, **kwargs):
        self.execute_calls += 1
        return await cloud_call(*args, **kwargs)


def _line_value(line: object) -> str:
    """Return string value from enum-like line objects."""
    return getattr(line, "value", line)


@pytest.mark.asyncio
async def test_async_create_timer_appends_and_saves_full_list() -> None:
    """Create should append timer and save full timer list."""
    existing = SimpleTimer(start=600, duration=1800, repeat=64, enabled=True)
    new_timer = SimpleTimer(start=700, duration=1200, repeat=1, enabled=True)
    coordinator = _CoordinatorStub([existing])
    device = SimpleNamespace(device_id="dev1")

    await async_create_timer(coordinator, device, new_timer, line=LINE_VENTILATION)

    coordinator.cloud.get_timers.assert_awaited_once()
    assert _line_value(coordinator.cloud.get_timers.await_args.kwargs["line"]) == "OUTV"
    coordinator.cloud.save_timers.assert_awaited_once()
    assert _line_value(coordinator.cloud.save_timers.await_args.kwargs["line"]) == "OUTV"
    saved = coordinator.cloud.save_timers.await_args.kwargs["timers"]
    assert len(saved) == 2
    assert saved[1].start == 700
    assert coordinator.execute_calls == 1
    coordinator.async_update_listeners.assert_called_once()


@pytest.mark.asyncio
async def test_async_update_timer_replaces_selected_index() -> None:
    """Update should patch one timer and preserve the rest."""
    coordinator = _CoordinatorStub(
        [
            SimpleTimer(start=600, duration=1800, repeat=64, enabled=True),
            SimpleTimer(start=900, duration=1200, repeat=1, enabled=False),
        ]
    )
    device = SimpleNamespace(device_id="dev1")

    await async_update_timer(
        coordinator,
        device,
        timer_index=1,
        timer_data={"enabled": True, "duration": 3600},
        line=LINE_VENTILATION,
    )

    assert _line_value(coordinator.cloud.save_timers.await_args.kwargs["line"]) == "OUTV"
    saved = coordinator.cloud.save_timers.await_args.kwargs["timers"]
    assert saved[0].start == 600
    assert saved[1].start == 900
    assert saved[1].duration == 3600
    assert saved[1].enabled is True
    assert coordinator.execute_calls == 1


@pytest.mark.asyncio
async def test_async_update_timer_without_line_uses_combined_index() -> None:
    """Update without line should resolve index across heater+ventilation timers."""
    coordinator = _CoordinatorStub([])
    coordinator.cloud.get_timers = AsyncMock(
        side_effect=[
            [SimpleTimer(start=600, duration=1800, repeat=64, enabled=True)],
            [SimpleTimer(start=900, duration=1200, repeat=1, enabled=False)],
        ]
    )
    coordinator.cloud.save_timers = AsyncMock()
    device = SimpleNamespace(device_id="dev1")

    await async_update_timer(
        coordinator,
        device,
        timer_index=1,
        timer_data={"enabled": True},
        hass=SimpleNamespace(config=SimpleNamespace(time_zone="UTC")),
    )

    assert _line_value(coordinator.cloud.save_timers.await_args.kwargs["line"]) == "OUTV"
    saved = coordinator.cloud.save_timers.await_args.kwargs["timers"]
    assert len(saved) == 1
    assert saved[0].enabled is True


@pytest.mark.asyncio
async def test_async_delete_timer_removes_selected_index() -> None:
    """Delete should remove one timer on active line and save remaining list."""
    coordinator = _CoordinatorStub(
        [
            SimpleTimer(start=600, duration=1800, repeat=64, enabled=True),
            SimpleTimer(start=900, duration=1200, repeat=1, enabled=False),
        ]
    )
    device = SimpleNamespace(device_id="dev1", is_ventilation=True)

    await async_delete_timer(coordinator, device, timer_index=0)

    assert _line_value(coordinator.cloud.save_timers.await_args.kwargs["line"]) == "OUTV"
    saved = coordinator.cloud.save_timers.await_args.kwargs["timers"]
    assert len(saved) == 1
    assert saved[0].start == 900
    assert coordinator.execute_calls == 1


@pytest.mark.asyncio
async def test_async_update_timer_raises_for_invalid_index() -> None:
    """Update should fail explicitly when timer index is out of range."""
    coordinator = _CoordinatorStub([SimpleTimer(start=600, duration=1800, repeat=64)])
    device = SimpleNamespace(device_id="dev1")

    with pytest.raises(HomeAssistantError):
        await async_update_timer(
            coordinator,
            device,
            timer_index=4,
            timer_data={"enabled": False},
            line=LINE_VENTILATION,
        )

    coordinator.cloud.save_timers.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_delete_timer_raises_for_invalid_index() -> None:
    """Delete should fail explicitly when timer index is out of range."""
    coordinator = _CoordinatorStub([SimpleTimer(start=600, duration=1800, repeat=64)])
    device = SimpleNamespace(device_id="dev1", is_ventilation=True)

    with pytest.raises(HomeAssistantError):
        await async_delete_timer(coordinator, device, timer_index=7)

    coordinator.cloud.save_timers.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_delete_timer_uses_heater_when_not_in_ventilation_mode() -> None:
    """Delete should target heater line when ventilation mode is off."""
    coordinator = _CoordinatorStub([SimpleTimer(start=600, duration=1800, repeat=64)])
    device = SimpleNamespace(device_id="dev1", is_ventilation=False)

    await async_delete_timer(coordinator, device, timer_index=0)

    assert _line_value(coordinator.cloud.save_timers.await_args.kwargs["line"]) == "OUTH"


@pytest.mark.asyncio
async def test_async_update_timer_clears_location_from_null_values() -> None:
    """Update should remove location when null-like values are provided."""
    coordinator = _CoordinatorStub(
        [
            SimpleTimer(
                start=600,
                duration=1800,
                repeat=64,
                enabled=True,
                latitude="56.1",
                longitude="10.2",
            )
        ]
    )
    device = SimpleNamespace(device_id="dev1")

    await async_update_timer(
        coordinator,
        device,
        timer_index=0,
        timer_data={"latitude": "null", "longitude": "null"},
        line=LINE_VENTILATION,
    )

    saved = coordinator.cloud.save_timers.await_args.kwargs["timers"]
    assert saved[0].latitude is None
    assert saved[0].longitude is None


def test_coerce_timer_supports_start_time_and_duration_minutes() -> None:
    """Clock-based start and minute duration should map to API units."""
    hass = SimpleNamespace(config=SimpleNamespace(time_zone="UTC"))

    timer = _coerce_timer(
        {
            "start_time": "10:15",
            "duration_minutes": 45,
            "repeat": 64,
            "enabled": True,
        },
        hass=hass,
    )

    assert timer.start == 615
    assert timer.duration == 2700
    assert timer.repeat == 64


def test_coerce_timer_builds_repeat_mask_from_repeat_days() -> None:
    """repeat_days should be converted to the expected Webasto bitmask."""
    hass = SimpleNamespace(config=SimpleNamespace(time_zone="UTC"))

    timer = _coerce_timer(
        {
            "start_time": "10:15",
            "duration_minutes": 45,
            "repeat_days": ["monday", "friday"],
            "enabled": True,
        },
        hass=hass,
    )

    assert timer.repeat == 72


def test_coerce_timer_allows_empty_repeat_days_for_one_time_timer() -> None:
    """Empty repeat_days should produce repeat mask 0."""
    hass = SimpleNamespace(config=SimpleNamespace(time_zone="UTC"))

    timer = _coerce_timer(
        {
            "start_time": "06:00",
            "duration_minutes": 30,
            "repeat_days": [],
            "enabled": True,
        },
        hass=hass,
    )

    assert timer.repeat == 0
