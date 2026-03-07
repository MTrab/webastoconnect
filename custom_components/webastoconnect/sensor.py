"""Sensors for Webasto Connect."""

from datetime import UTC, datetime, timedelta
import logging
from typing import Any

from homeassistant.components import sensor
from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import EntityCategory
from homeassistant.core import callback
from homeassistant.util import slugify as util_slugify

from . import WebastoConfigEntry
from .api import WebastoConnectUpdateCoordinator
from .base import WebastoBaseEntity, WebastoConnectSensorEntityDescription

LOGGER = logging.getLogger(__name__)
MAIN_OUTPUT_LINES = {"OUTH", "OUTV"}
HEATER_LINE = "OUTH"
WEEKDAY_BITMASK = [64, 1, 2, 4, 8, 16, 32]  # Monday..Sunday (confirmed in pywebasto)


def _main_output_end_time(webasto) -> datetime | None:
    """Return the UTC end timestamp for the active main output."""
    end_time = getattr(webasto, "output_main_end_time", None)
    if isinstance(end_time, datetime):
        return end_time if end_time.tzinfo is not None else end_time.replace(tzinfo=UTC)

    last_data = getattr(webasto, "last_data", None)
    if not isinstance(last_data, dict):
        return None

    outputs = last_data.get("outputs")
    if not isinstance(outputs, list):
        return None

    for output in outputs:
        if not isinstance(output, dict):
            continue
        if output.get("line") not in MAIN_OUTPUT_LINES:
            continue
        if output.get("state") != "ON":
            continue

        ontime = output.get("ontime")
        if isinstance(ontime, int | float) and ontime > 0:
            return datetime.fromtimestamp(ontime, UTC)

    return None


def _main_output_end_name(webasto) -> str:
    """Return a mode-aware name for main output end-time sensor."""
    output_name = getattr(webasto, "output_main_name", None)
    if isinstance(output_name, str) and output_name.strip():
        return f"{output_name} ends"
    return "Output ends"


def _extract_simple_heater_timers(webasto: Any) -> list[dict[str, Any]]:
    """Extract `simple` heater timers from latest API payload."""
    last_data = getattr(webasto, "last_data", None)
    if not isinstance(last_data, dict):
        return []

    timers: list[dict[str, Any]] = []
    for section in ("outputs", "disabled_outputs"):
        outputs = last_data.get(section)
        if not isinstance(outputs, list):
            continue
        for output in outputs:
            if not isinstance(output, dict) or output.get("line") != HEATER_LINE:
                continue
            output_timers = output.get("timers")
            if not isinstance(output_timers, list):
                continue
            for timer in output_timers:
                if isinstance(timer, dict) and timer.get("type") == "simple":
                    timers.append(timer)
    return timers


def _next_timer_occurrence_utc(
    *,
    start: int,
    repeat: int,
    now_utc: datetime,
) -> datetime | None:
    """Calculate next UTC occurrence for a timer."""
    if start <= 0 or start >= 24 * 60:
        return None

    hour = start // 60
    minute = start % 60

    if repeat == 0:
        candidate = now_utc.replace(
            hour=hour,
            minute=minute,
            second=0,
            microsecond=0,
        )
        if candidate <= now_utc:
            candidate += timedelta(days=1)
        return candidate

    for day_offset in range(0, 8):
        candidate_date = now_utc.date() + timedelta(days=day_offset)
        weekday = candidate_date.weekday()
        if repeat & WEEKDAY_BITMASK[weekday] == 0:
            continue

        candidate = datetime(
            candidate_date.year,
            candidate_date.month,
            candidate_date.day,
            hour,
            minute,
            tzinfo=UTC,
        )
        if candidate > now_utc:
            return candidate

    return None


def _timer_start_hhmm(start: int) -> str:
    """Format timer start (minutes after midnight) as HH:MM."""
    hour = start // 60
    minute = start % 60
    return f"{hour:02d}:{minute:02d}"


def _next_timer_sensor_payload(
    webasto: Any,
    *,
    now_utc: datetime | None = None,
) -> tuple[datetime | None, dict[str, Any]]:
    """Build state + attributes for next-enabled-timer sensor."""
    now = now_utc or datetime.now(UTC)
    timers = _extract_simple_heater_timers(webasto)

    timer_items: list[dict[str, Any]] = []
    next_index: int | None = None
    next_occurrence: datetime | None = None
    next_timer: dict[str, Any] | None = None

    for index, timer in enumerate(timers):
        start = int(timer.get("start", 0))
        repeat = int(timer.get("repeat", 0))
        enabled = bool(timer.get("enabled", False))
        duration = int(timer.get("duration", 0))
        location = timer.get("location")
        latitude = location.get("lat") if isinstance(location, dict) else None
        longitude = location.get("lon") if isinstance(location, dict) else None

        occurrence = None
        if enabled and start > 0:
            occurrence = _next_timer_occurrence_utc(
                start=start,
                repeat=repeat,
                now_utc=now,
            )

        item = {
            "index": index,
            "start": start,
            "start_hhmm_utc": _timer_start_hhmm(start) if start > 0 else None,
            "duration": duration,
            "repeat": repeat,
            "enabled": enabled,
            "latitude": latitude,
            "longitude": longitude,
            "next_run_utc": occurrence.isoformat() if occurrence else None,
        }
        timer_items.append(item)

        if not enabled or occurrence is None:
            continue
        if next_occurrence is None or occurrence < next_occurrence:
            next_occurrence = occurrence
            next_index = index
            next_timer = item

    return next_occurrence, {
        "next_timer_index": next_index,
        "next_timer": next_timer,
        "timers": timer_items,
    }


SENSORS = [
    WebastoConnectSensorEntityDescription(
        key="temperature",
        name="Temperature",
        entity_category=None,
        state_class=SensorStateClass.MEASUREMENT,
        device_class=SensorDeviceClass.TEMPERATURE,
        value_fn=lambda webasto: webasto.temperature,
        icon="mdi:thermometer",
        unit_fn=lambda webasto: webasto.temperature_unit,
        suggested_display_precision=0,
    ),
    WebastoConnectSensorEntityDescription(
        key="battery_voltage",
        name="Battery",
        entity_category=None,
        state_class=SensorStateClass.MEASUREMENT,
        device_class=SensorDeviceClass.VOLTAGE,
        native_unit_of_measurement="V",
        value_fn=lambda webasto: webasto.voltage,
        icon="mdi:car-battery",
        suggested_display_precision=1,
    ),
    WebastoConnectSensorEntityDescription(
        key="subscription_expiration",
        name="Subscription Expiration",
        entity_category=EntityCategory.DIAGNOSTIC,
        state_class=None,
        device_class=None,
        entity_registry_enabled_default=False,
        value_fn=lambda webasto: webasto.subscription_expiration.strftime("%d-%m-%Y"),
        icon="mdi:calendar-end",
    ),
    WebastoConnectSensorEntityDescription(
        key="main_output_end_time",
        name="Output ends",
        entity_category=EntityCategory.DIAGNOSTIC,
        state_class=None,
        device_class=SensorDeviceClass.TIMESTAMP,
        entity_registry_enabled_default=False,
        value_fn=_main_output_end_time,
        name_fn=_main_output_end_name,
        icon="mdi:timer-outline",
    ),
    WebastoConnectSensorEntityDescription(
        key="next_enabled_timer",
        name="Next Timer",
        entity_category=EntityCategory.DIAGNOSTIC,
        state_class=None,
        device_class=SensorDeviceClass.TIMESTAMP,
        entity_registry_enabled_default=False,
        value_fn=lambda webasto: _next_timer_sensor_payload(webasto)[0],
        icon="mdi:calendar-clock",
    ),
]


async def async_setup_entry(hass, entry: WebastoConfigEntry, async_add_devices):
    """Set up sensors."""
    sensors = []

    coordinator = entry.runtime_data.coordinator

    for id, device in coordinator.cloud.devices.items():
        LOGGER.debug("Setting up sensors for device: %s", device.name)
        for s in SENSORS:
            entity = WebastoConnectSensor(id, s, coordinator)
            LOGGER.debug(
                "Adding sensor '%s' with entity_id '%s'", s.name, entity.entity_id
            )
            sensors.append(entity)

    async_add_devices(sensors)


class WebastoConnectSensor(WebastoBaseEntity, SensorEntity):
    """Representation of a Webasto Connect Sensor."""

    def __init__(
        self,
        device_id: int,
        description: WebastoConnectSensorEntityDescription,
        coordinator: WebastoConnectUpdateCoordinator,
    ) -> None:
        """Initialize a Webasto Connect Sensor."""
        super().__init__(device_id, coordinator, description)

        self._attr_icon = self.entity_description.icon
        self._attr_native_value = self.entity_description.value_fn(  # type: ignore
            self._cloud.devices[self._device_id]
        )
        if self.entity_description.key == "next_enabled_timer":
            _, attributes = _next_timer_sensor_payload(
                self._cloud.devices[self._device_id]
            )
            self._attr_extra_state_attributes = attributes

        if not isinstance(description.unit_fn, type(None)):
            self._attr_native_unit_of_measurement = description.unit_fn(
                self._cloud.devices[self._device_id]
            )

        self.entity_id = sensor.ENTITY_ID_FORMAT.format(
            util_slugify(
                f"{self._cloud.devices[self._device_id].name} {self._attr_name}"
            )
        )

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        if not isinstance(self.entity_description.name_fn, type(None)):  # type: ignore
            self._attr_name = self.entity_description.name_fn(  # type: ignore
                self._cloud.devices[self._device_id]
            )
        self._attr_native_value = self.entity_description.value_fn(  # type: ignore
            self._cloud.devices[self._device_id]
        )
        if self.entity_description.key == "next_enabled_timer":
            _, attributes = _next_timer_sensor_payload(
                self._cloud.devices[self._device_id]
            )
            self._attr_extra_state_attributes = attributes
        self.async_write_ha_state()
