"""Service handlers for Webasto timer operations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, time
import logging
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.util import dt as dt_util
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

try:
    from pywebasto import SimpleTimer
    from pywebasto.enums import Outputs
except ImportError:

    @dataclass(slots=True)
    class SimpleTimer:  # type: ignore[no-redef]
        """Fallback timer model for local/test environments."""

        start: int
        duration: int
        repeat: int
        latitude: str | None = None
        longitude: str | None = None
        enabled: bool = True

    @dataclass(frozen=True, slots=True)
    class _OutputLine:
        """Fallback enum-like output line wrapper."""

        value: str

    class Outputs:  # type: ignore[no-redef]
        """Fallback output constants for environments without timer build."""

        HEATER = _OutputLine("OUTH")
        VENTILATION = _OutputLine("OUTV")


from .const import (
    DOMAIN,
    SERVICE_CREATE_TIMER,
    SERVICE_DELETE_TIMER,
    SERVICE_UPDATE_TIMER,
)

LOGGER = logging.getLogger(__name__)

ATTR_DEVICE_ID = "device_id"
ATTR_TIMER_INDEX = "timer_index"
ATTR_START = "start"
ATTR_DURATION = "duration"
ATTR_START_TIME = "start_time"
ATTR_DURATION_MINUTES = "duration_minutes"
ATTR_REPEAT = "repeat"
ATTR_REPEAT_DAYS = "repeat_days"
ATTR_ENABLED = "enabled"
ATTR_LATITUDE = "latitude"
ATTR_LONGITUDE = "longitude"
ATTR_LINE = "line"
LINE_HEATER = "heater"
LINE_VENTILATION = "ventilation"
LINE_HEATER_LEGACY = "OUTH"
LINE_VENTILATION_LEGACY = "OUTV"
VALID_TIMER_LINES = (
    LINE_HEATER,
    LINE_VENTILATION,
    LINE_HEATER_LEGACY,
    LINE_VENTILATION_LEGACY,
)
WEEKDAY_TO_MASK = {
    "monday": 64,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 4,
    "friday": 8,
    "saturday": 16,
    "sunday": 32,
}

_BASE_SCHEMA = vol.Schema({vol.Required(ATTR_DEVICE_ID): cv.string})
_CREATE_TIMER_SCHEMA = _BASE_SCHEMA.extend(
    {
        vol.Required(ATTR_START_TIME): cv.string,
        vol.Required(ATTR_DURATION_MINUTES): vol.All(
            vol.Coerce(int), vol.Range(min=1)
        ),
        vol.Optional(ATTR_REPEAT_DAYS, default=[]): [vol.In(tuple(WEEKDAY_TO_MASK))],
        vol.Optional(ATTR_REPEAT): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_ENABLED, default=True): cv.boolean,
        vol.Optional(ATTR_LATITUDE): cv.string,
        vol.Optional(ATTR_LONGITUDE): cv.string,
    }
)
_UPDATE_TIMER_SCHEMA = _BASE_SCHEMA.extend(
    {
        vol.Optional(ATTR_LINE, default=LINE_HEATER): vol.In(VALID_TIMER_LINES),
        vol.Required(ATTR_TIMER_INDEX): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_START_TIME): cv.string,
        vol.Optional(ATTR_DURATION_MINUTES): vol.All(
            vol.Coerce(int), vol.Range(min=1)
        ),
        vol.Optional(ATTR_REPEAT_DAYS): [vol.In(tuple(WEEKDAY_TO_MASK))],
        vol.Optional(ATTR_REPEAT): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_ENABLED): cv.boolean,
        vol.Optional(ATTR_LATITUDE): vol.Any(cv.string, None),
        vol.Optional(ATTR_LONGITUDE): vol.Any(cv.string, None),
    }
)
_DELETE_TIMER_SCHEMA = _BASE_SCHEMA.extend(
    {
        vol.Required(ATTR_TIMER_INDEX): vol.All(vol.Coerce(int), vol.Range(min=0)),
    }
)


def _coordinator_and_device(hass: HomeAssistant, device_id: str) -> tuple[Any, Any]:
    """Resolve coordinator + device from HA device id or Webasto API device id."""
    # Backwards compatibility for callers that still pass API device id directly.
    for entry in hass.config_entries.async_entries(DOMAIN):
        runtime_data = getattr(entry, "runtime_data", None)
        if runtime_data is None:
            continue
        coordinator = runtime_data.coordinator
        for cloud_device in coordinator.cloud.devices.values():
            if str(cloud_device.device_id) == str(device_id):
                return coordinator, cloud_device

    # Preferred path: device selector value (HA device registry id).
    device_registry = dr.async_get(hass)
    ha_device = device_registry.async_get(str(device_id))
    if ha_device is not None:
        internal_device_ids = {
            identifier
            for domain, identifier in ha_device.identifiers
            if domain == DOMAIN
        }

        for entry in hass.config_entries.async_entries(DOMAIN):
            runtime_data = getattr(entry, "runtime_data", None)
            if runtime_data is None:
                continue
            coordinator = runtime_data.coordinator
            for internal_id, cloud_device in coordinator.cloud.devices.items():
                if str(internal_id) in internal_device_ids:
                    return coordinator, cloud_device

    raise HomeAssistantError(f"No Webasto device found with device_id '{device_id}'")


def _ensure_timer_api_support(coordinator: Any) -> None:
    """Validate that installed pywebasto provides timer APIs."""
    if not hasattr(coordinator.cloud, "get_timers") or not hasattr(
        coordinator.cloud, "save_timers"
    ):
        raise HomeAssistantError(
            "Installed pywebasto version does not support timers. "
            "Use timer-enabled pywebasto build."
        )


def _output_for_line(line: str) -> Any:
    """Map API line id to pywebasto Outputs value."""
    normalized = line.strip().lower()
    if normalized in (LINE_VENTILATION, LINE_VENTILATION_LEGACY.lower()):
        return Outputs.VENTILATION
    return Outputs.HEATER


def _active_output_for_device(device: Any) -> Any:
    """Resolve active output line from current device mode."""
    return (
        Outputs.VENTILATION
        if bool(getattr(device, "is_ventilation", False))
        else Outputs.HEATER
    )


def _raise_timer_index_error(timer_index: int, timer_count: int, *, scope: str) -> None:
    """Raise a user-friendly out-of-range error for timer index."""
    if timer_count <= 0:
        raise HomeAssistantError(f"No timers available for {scope}.")

    max_index = timer_count - 1
    raise HomeAssistantError(
        f"Invalid timer index {timer_index} for {scope}. "
        f"Valid range is 0..{max_index} ({timer_count} timer(s))."
    )


def _coerce_timer(
    data: dict[str, Any],
    *,
    existing: Any | None = None,
    hass: HomeAssistant | None = None,
) -> SimpleTimer:
    """Build a SimpleTimer from service data, optionally patching an existing timer."""
    def _normalize_geo(value: Any) -> str | None:
        """Normalize user-provided geo values."""
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.strip()
            if normalized.lower() in {"", "null", "none", "nan"}:
                return None
            return normalized
        return str(value)

    def _parse_clock_time(value: Any) -> time:
        """Parse selector value to clock time."""
        if isinstance(value, time):
            return value
        if not isinstance(value, str):
            raise HomeAssistantError("start_time must be provided as HH:MM")

        candidate = value.strip()
        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(candidate, fmt).time()
            except ValueError:
                continue
        raise HomeAssistantError("start_time must be provided as HH:MM")

    def _start_minutes_from_local_time(value: Any) -> int:
        """Convert local clock time to UTC minutes after midnight."""
        if hass is None:
            raise HomeAssistantError("hass context is required for start_time conversion")
        tz = dt_util.get_time_zone(hass.config.time_zone) or UTC
        clock = _parse_clock_time(value)
        now_local = datetime.now(tz)
        local_dt = datetime(
            now_local.year,
            now_local.month,
            now_local.day,
            clock.hour,
            clock.minute,
            tzinfo=tz,
        )
        utc_dt = local_dt.astimezone(UTC)
        return utc_dt.hour * 60 + utc_dt.minute

    def _repeat_mask_from_days(days: Any) -> int:
        """Build repeat bitmask from weekday names."""
        if not isinstance(days, list):
            raise HomeAssistantError("repeat_days must be a list")
        mask = 0
        for day in days:
            if not isinstance(day, str):
                raise HomeAssistantError("repeat_days must contain weekday strings")
            key = day.strip().lower()
            if key not in WEEKDAY_TO_MASK:
                raise HomeAssistantError(f"Unsupported weekday '{day}'")
            mask |= WEEKDAY_TO_MASK[key]
        return mask

    start = data.get(ATTR_START, getattr(existing, "start", None))
    if ATTR_START_TIME in data:
        start = _start_minutes_from_local_time(data.get(ATTR_START_TIME))

    duration = data.get(ATTR_DURATION, getattr(existing, "duration", None))
    if ATTR_DURATION_MINUTES in data:
        duration = int(data[ATTR_DURATION_MINUTES]) * 60

    repeat = data.get(ATTR_REPEAT, getattr(existing, "repeat", None))
    if ATTR_REPEAT_DAYS in data:
        repeat = _repeat_mask_from_days(data[ATTR_REPEAT_DAYS])
    enabled = data.get(ATTR_ENABLED, getattr(existing, "enabled", True))

    latitude = (
        _normalize_geo(data.get(ATTR_LATITUDE))
        if ATTR_LATITUDE in data
        else _normalize_geo(getattr(existing, "latitude", None))
    )
    longitude = (
        _normalize_geo(data.get(ATTR_LONGITUDE))
        if ATTR_LONGITUDE in data
        else _normalize_geo(getattr(existing, "longitude", None))
    )
    if (latitude is None) != (longitude is None):
        raise HomeAssistantError(
            "latitude and longitude must both be provided or both be omitted"
        )

    if start is None or duration is None or repeat is None:
        raise HomeAssistantError("start, duration and repeat are required")

    return SimpleTimer(
        start=int(start),
        duration=int(duration),
        repeat=int(repeat),
        enabled=bool(enabled),
        latitude=latitude,
        longitude=longitude,
    )


async def async_create_timer(
    coordinator: Any,
    device: Any,
    timer: SimpleTimer,
    line: str | None = None,
) -> None:
    """Create timer by appending to current timer list."""

    async def _operation() -> None:
        output = _output_for_line(line) if line is not None else _active_output_for_device(device)
        timers = await coordinator.cloud.get_timers(device=device, line=output)
        timers.append(timer)
        await coordinator.cloud.save_timers(device=device, timers=timers, line=output)

    await coordinator.async_execute_cloud_call(_operation)
    coordinator.async_update_listeners()


async def async_update_timer(
    coordinator: Any,
    device: Any,
    timer_index: int,
    timer_data: dict[str, Any],
    line: str | None = None,
    hass: HomeAssistant | None = None,
) -> None:
    """Update timer at index and persist full timer list."""

    async def _operation() -> None:
        selected_index = timer_index
        total_timers = 0

        if line is not None:
            output = _output_for_line(line)
            timers = await coordinator.cloud.get_timers(device=device, line=output)
            total_timers = len(timers)
        else:
            heater_timers = await coordinator.cloud.get_timers(
                device=device, line=Outputs.HEATER
            )
            if timer_index < len(heater_timers):
                output = Outputs.HEATER
                timers = heater_timers
            else:
                vent_timers = await coordinator.cloud.get_timers(
                    device=device, line=Outputs.VENTILATION
                )
                selected_index = timer_index - len(heater_timers)
                output = Outputs.VENTILATION
                timers = vent_timers
                total_timers = len(heater_timers) + len(vent_timers)

            if total_timers == 0:
                total_timers = len(timers)

        if selected_index >= len(timers):
            _raise_timer_index_error(
                timer_index,
                total_timers,
                scope="heater+ventilation timers",
            )

        timers[selected_index] = _coerce_timer(
            timer_data,
            existing=timers[selected_index],
            hass=hass,
        )
        await coordinator.cloud.save_timers(device=device, timers=timers, line=output)

    await coordinator.async_execute_cloud_call(_operation)
    coordinator.async_update_listeners()


async def async_delete_timer(
    coordinator: Any,
    device: Any,
    timer_index: int,
) -> None:
    """Delete timer at index and persist full timer list."""

    async def _operation() -> None:
        output = _active_output_for_device(device)
        timers = await coordinator.cloud.get_timers(device=device, line=output)
        if timer_index >= len(timers):
            active_scope = (
                "active ventilation timers"
                if output == Outputs.VENTILATION
                else "active heater timers"
            )
            _raise_timer_index_error(timer_index, len(timers), scope=active_scope)
        del timers[timer_index]
        await coordinator.cloud.save_timers(device=device, timers=timers, line=output)

    await coordinator.async_execute_cloud_call(_operation)
    coordinator.async_update_listeners()


async def _async_handle_create_timer(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle create_timer service."""
    coordinator, device = _coordinator_and_device(hass, call.data[ATTR_DEVICE_ID])
    _ensure_timer_api_support(coordinator)
    timer = _coerce_timer(dict(call.data), hass=hass)
    line = (
        str(call.data[ATTR_LINE])
        if ATTR_LINE in call.data and call.data[ATTR_LINE] is not None
        else None
    )

    try:
        await async_create_timer(coordinator, device, timer, line)
    except (InvalidRequestException, UnauthorizedException) as err:
        raise HomeAssistantError(f"Failed to create timer: {err}") from err


async def _async_handle_update_timer(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle update_timer service."""
    coordinator, device = _coordinator_and_device(hass, call.data[ATTR_DEVICE_ID])
    _ensure_timer_api_support(coordinator)
    timer_index = int(call.data[ATTR_TIMER_INDEX])
    line = (
        str(call.data[ATTR_LINE])
        if ATTR_LINE in call.data and call.data[ATTR_LINE] is not None
        else None
    )

    try:
        await async_update_timer(
            coordinator,
            device,
            timer_index,
            dict(call.data),
            line,
            hass=hass,
        )
    except (InvalidRequestException, UnauthorizedException) as err:
        raise HomeAssistantError(f"Failed to update timer: {err}") from err


async def _async_handle_delete_timer(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle delete_timer service."""
    coordinator, device = _coordinator_and_device(hass, call.data[ATTR_DEVICE_ID])
    _ensure_timer_api_support(coordinator)
    timer_index = int(call.data[ATTR_TIMER_INDEX])

    try:
        await async_delete_timer(coordinator, device, timer_index)
    except (InvalidRequestException, UnauthorizedException) as err:
        raise HomeAssistantError(f"Failed to delete timer: {err}") from err


def async_register_services(hass: HomeAssistant) -> None:
    """Register domain services."""
    async def _handle_create(call: ServiceCall) -> None:
        await _async_handle_create_timer(hass, call)

    async def _handle_update(call: ServiceCall) -> None:
        await _async_handle_update_timer(hass, call)

    async def _handle_delete(call: ServiceCall) -> None:
        await _async_handle_delete_timer(hass, call)

    if not hass.services.has_service(DOMAIN, SERVICE_CREATE_TIMER):
        hass.services.async_register(
            DOMAIN,
            SERVICE_CREATE_TIMER,
            _handle_create,
            schema=_CREATE_TIMER_SCHEMA,
        )
    if not hass.services.has_service(DOMAIN, SERVICE_UPDATE_TIMER):
        hass.services.async_register(
            DOMAIN,
            SERVICE_UPDATE_TIMER,
            _handle_update,
            schema=_UPDATE_TIMER_SCHEMA,
        )
    if not hass.services.has_service(DOMAIN, SERVICE_DELETE_TIMER):
        hass.services.async_register(
            DOMAIN,
            SERVICE_DELETE_TIMER,
            _handle_delete,
            schema=_DELETE_TIMER_SCHEMA,
        )


def async_unregister_services(hass: HomeAssistant) -> None:
    """Unregister domain services."""
    for service in (SERVICE_CREATE_TIMER, SERVICE_UPDATE_TIMER, SERVICE_DELETE_TIMER):
        if hass.services.has_service(DOMAIN, service):
            hass.services.async_remove(DOMAIN, service)
