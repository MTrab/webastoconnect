"""Service handlers for Webasto timer operations."""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
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
ATTR_REPEAT = "repeat"
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

_BASE_SCHEMA = vol.Schema({vol.Required(ATTR_DEVICE_ID): cv.string})
_CREATE_TIMER_SCHEMA = _BASE_SCHEMA.extend(
    {
        vol.Optional(ATTR_LINE, default=LINE_HEATER): vol.In(VALID_TIMER_LINES),
        vol.Required(ATTR_START): vol.All(vol.Coerce(int), vol.Range(min=1)),
        vol.Required(ATTR_DURATION): vol.All(vol.Coerce(int), vol.Range(min=1)),
        vol.Required(ATTR_REPEAT): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_ENABLED, default=True): cv.boolean,
        vol.Optional(ATTR_LATITUDE): cv.string,
        vol.Optional(ATTR_LONGITUDE): cv.string,
    }
)
_UPDATE_TIMER_SCHEMA = _BASE_SCHEMA.extend(
    {
        vol.Optional(ATTR_LINE, default=LINE_HEATER): vol.In(VALID_TIMER_LINES),
        vol.Required(ATTR_TIMER_INDEX): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_START): vol.All(vol.Coerce(int), vol.Range(min=1)),
        vol.Optional(ATTR_DURATION): vol.All(vol.Coerce(int), vol.Range(min=1)),
        vol.Optional(ATTR_REPEAT): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_ENABLED): cv.boolean,
        vol.Optional(ATTR_LATITUDE): vol.Any(cv.string, None),
        vol.Optional(ATTR_LONGITUDE): vol.Any(cv.string, None),
    }
)
_DELETE_TIMER_SCHEMA = _BASE_SCHEMA.extend(
    {
        vol.Optional(ATTR_LINE, default=LINE_HEATER): vol.In(VALID_TIMER_LINES),
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


def _coerce_timer(
    data: dict[str, Any],
    *,
    existing: Any | None = None,
) -> SimpleTimer:
    """Build a SimpleTimer from service data, optionally patching an existing timer."""
    start = data.get(ATTR_START, getattr(existing, "start", None))
    duration = data.get(ATTR_DURATION, getattr(existing, "duration", None))
    repeat = data.get(ATTR_REPEAT, getattr(existing, "repeat", None))
    enabled = data.get(ATTR_ENABLED, getattr(existing, "enabled", True))

    latitude = data.get(ATTR_LATITUDE, getattr(existing, "latitude", None))
    longitude = data.get(ATTR_LONGITUDE, getattr(existing, "longitude", None))
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
        latitude=None if latitude is None else str(latitude),
        longitude=None if longitude is None else str(longitude),
    )


async def async_create_timer(
    coordinator: Any,
    device: Any,
    timer: SimpleTimer,
    line: str,
) -> None:
    """Create timer by appending to current timer list."""

    async def _operation() -> None:
        output = _output_for_line(line)
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
    line: str,
) -> None:
    """Update timer at index and persist full timer list."""

    async def _operation() -> None:
        output = _output_for_line(line)
        timers = await coordinator.cloud.get_timers(device=device, line=output)
        if timer_index >= len(timers):
            raise HomeAssistantError(
                f"timer_index '{timer_index}' out of range (timers: {len(timers)})"
            )
        timers[timer_index] = _coerce_timer(timer_data, existing=timers[timer_index])
        await coordinator.cloud.save_timers(device=device, timers=timers, line=output)

    await coordinator.async_execute_cloud_call(_operation)
    coordinator.async_update_listeners()


async def async_delete_timer(
    coordinator: Any,
    device: Any,
    timer_index: int,
    line: str,
) -> None:
    """Delete timer at index and persist full timer list."""

    async def _operation() -> None:
        output = _output_for_line(line)
        timers = await coordinator.cloud.get_timers(device=device, line=output)
        if timer_index >= len(timers):
            raise HomeAssistantError(
                f"timer_index '{timer_index}' out of range (timers: {len(timers)})"
            )
        del timers[timer_index]
        await coordinator.cloud.save_timers(device=device, timers=timers, line=output)

    await coordinator.async_execute_cloud_call(_operation)
    coordinator.async_update_listeners()


async def _async_handle_create_timer(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle create_timer service."""
    coordinator, device = _coordinator_and_device(hass, call.data[ATTR_DEVICE_ID])
    _ensure_timer_api_support(coordinator)
    timer = _coerce_timer(dict(call.data))
    line = str(call.data.get(ATTR_LINE, LINE_HEATER))

    try:
        await async_create_timer(coordinator, device, timer, line)
    except (InvalidRequestException, UnauthorizedException) as err:
        raise HomeAssistantError(f"Failed to create timer: {err}") from err


async def _async_handle_update_timer(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle update_timer service."""
    coordinator, device = _coordinator_and_device(hass, call.data[ATTR_DEVICE_ID])
    _ensure_timer_api_support(coordinator)
    timer_index = int(call.data[ATTR_TIMER_INDEX])
    line = str(call.data.get(ATTR_LINE, LINE_HEATER))

    try:
        await async_update_timer(coordinator, device, timer_index, dict(call.data), line)
    except (InvalidRequestException, UnauthorizedException) as err:
        raise HomeAssistantError(f"Failed to update timer: {err}") from err


async def _async_handle_delete_timer(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle delete_timer service."""
    coordinator, device = _coordinator_and_device(hass, call.data[ATTR_DEVICE_ID])
    _ensure_timer_api_support(coordinator)
    timer_index = int(call.data[ATTR_TIMER_INDEX])
    line = str(call.data.get(ATTR_LINE, LINE_HEATER))

    try:
        await async_delete_timer(coordinator, device, timer_index, line)
    except (InvalidRequestException, UnauthorizedException) as err:
        raise HomeAssistantError(f"Failed to delete timer: {err}") from err


def async_register_services(hass: HomeAssistant) -> None:
    """Register domain services."""
    if not hass.services.has_service(DOMAIN, SERVICE_CREATE_TIMER):
        hass.services.async_register(
            DOMAIN,
            SERVICE_CREATE_TIMER,
            lambda call: _async_handle_create_timer(hass, call),
            schema=_CREATE_TIMER_SCHEMA,
        )
    if not hass.services.has_service(DOMAIN, SERVICE_UPDATE_TIMER):
        hass.services.async_register(
            DOMAIN,
            SERVICE_UPDATE_TIMER,
            lambda call: _async_handle_update_timer(hass, call),
            schema=_UPDATE_TIMER_SCHEMA,
        )
    if not hass.services.has_service(DOMAIN, SERVICE_DELETE_TIMER):
        hass.services.async_register(
            DOMAIN,
            SERVICE_DELETE_TIMER,
            lambda call: _async_handle_delete_timer(hass, call),
            schema=_DELETE_TIMER_SCHEMA,
        )


def async_unregister_services(hass: HomeAssistant) -> None:
    """Unregister domain services."""
    for service in (SERVICE_CREATE_TIMER, SERVICE_UPDATE_TIMER, SERVICE_DELETE_TIMER):
        if hass.services.has_service(DOMAIN, service):
            hass.services.async_remove(DOMAIN, service)
