"""Sensors for Webasto Connect."""

import logging

from homeassistant.components import sensor
from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import slugify as util_slugify

from .api import WebastoConnectUpdateCoordinator
from .base import WebastoConnectSensorEntityDescription
from .const import ATTR_COORDINATOR, DOMAIN

LOGGER = logging.getLogger(__name__)

BINARY_SENSORS = [
    WebastoConnectSensorEntityDescription(
        key="temperature",
        name="Temperature",
        entity_category=None,
        state_class=SensorStateClass.MEASUREMENT,
        device_class=SensorDeviceClass.TEMPERATURE,
        value_fn=lambda webasto: webasto.temperature,
        icon="mdi:thermometer",
        unit_fn=lambda webasto: webasto.temperature_unit,
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
    ),
]


async def async_setup_entry(hass, entry: ConfigEntry, async_add_devices):
    """Setup binary_sensors."""
    sensors = []

    coordinator = hass.data[DOMAIN][entry.entry_id][ATTR_COORDINATOR]

    for b_s in BINARY_SENSORS:
        entity = WebastoConnectSensor(b_s, coordinator)
        LOGGER.debug(
            "Adding binary_sensor '%s' with entity_id '%s'", b_s.name, entity.entity_id
        )
        sensors.append(entity)

    async_add_devices(sensors)


class WebastoConnectSensor(CoordinatorEntity, SensorEntity):
    """Representation of a Webasto Connect Sensor."""

    def __init__(
        self,
        description: WebastoConnectSensorEntityDescription,
        coordinator: WebastoConnectUpdateCoordinator,
    ) -> None:
        """Initialize a Webasto Connect Sensor."""
        super().__init__(coordinator)

        self.entity_description = description
        self.coordinator = coordinator
        self._config = coordinator.entry
        self._hass = coordinator.hass

        self._attr_name = self.entity_description.name
        self._attr_unique_id = util_slugify(
            f"{self._attr_name}_{self._config.entry_id}"
        )
        self._attr_should_poll = False
        self._attr_icon = self.entity_description.icon
        self._attr_native_value = self.entity_description.value_fn(
            self.coordinator.cloud
        )

        if not isinstance(description.unit_fn, type(None)):
            self._attr_native_unit_of_measurement = description.unit_fn(
                coordinator.cloud
            )

        self._attr_device_info = {
            "identifiers": {(DOMAIN, self.coordinator.cloud.device_id)},
            "name": self.name,
            "model": "ThermoConnect",
            "manufacturer": "Webasto",
        }

        self.entity_id = sensor.ENTITY_ID_FORMAT.format(
            util_slugify(f"{self.coordinator.cloud.name} {self._attr_name}")
        )

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        self._attr_native_value = self.entity_description.value_fn(
            self.coordinator.cloud
        )
        self.async_write_ha_state()
