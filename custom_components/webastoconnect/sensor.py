"""Sensors for Webasto Connect."""

from datetime import UTC, datetime
import logging

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
        new_name = self._attr_name
        if not isinstance(self.entity_description.name_fn, type(None)):  # type: ignore
            new_name = self.entity_description.name_fn(  # type: ignore
                self._cloud.devices[self._device_id]
            )
        new_value = self.entity_description.value_fn(  # type: ignore
            self._cloud.devices[self._device_id]
        )

        if new_name != self._attr_name or new_value != self._attr_native_value:
            self._attr_name = new_name
            self._attr_native_value = new_value
            self.async_write_ha_state()
