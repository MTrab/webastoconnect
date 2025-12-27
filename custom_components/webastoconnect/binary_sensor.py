"""Binary sensors for Webasto Connect."""

import logging
from typing import cast

from homeassistant.components import binary_sensor
from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import callback
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
)
from homeassistant.util import slugify as util_slugify

from .api import WebastoConnectUpdateCoordinator
from .base import WebastoConnectBinarySensorEntityDescription
from .const import ATTR_COORDINATOR, DOMAIN

LOGGER = logging.getLogger(__name__)

BINARY_SENSORS = [
    WebastoConnectBinarySensorEntityDescription(
        key="allow_location",
        name="Allow Location Services",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda webasto: cast(bool, webasto.allow_location),
        icon_on="mdi:map-marker",
        icon_off="mdi:map-marker-off",
        entity_registry_enabled_default=False,
    )
]


async def async_setup_entry(hass, entry: ConfigEntry, async_add_devices):
    """Setup binary_sensors."""
    binarysensors = []

    coordinator = hass.data[DOMAIN][entry.entry_id][ATTR_COORDINATOR]

    for id, device in coordinator.cloud.devices.items():
        LOGGER.debug("Setting up binary_sensors for device: %s", device.name)
        for b_s in BINARY_SENSORS:
            entity = WebastoConnectBinarySensor(id, b_s, coordinator)
            LOGGER.debug(
                "Adding binary_sensor '%s' with entity_id '%s'",
                b_s.name,
                entity.entity_id,
            )
            binarysensors.append(entity)

    async_add_devices(binarysensors)


class WebastoConnectBinarySensor(
    CoordinatorEntity[DataUpdateCoordinator[None]], BinarySensorEntity
):
    """Representation of a Webasto Connect Binary Sensor."""

    def __init__(
        self,
        device_id: str,
        description: WebastoConnectBinarySensorEntityDescription,
        coordinator: WebastoConnectUpdateCoordinator,
    ) -> None:
        """Initialize a Webasto Connect Binary Sensor."""
        super().__init__(coordinator)

        self.entity_description = description
        self.coordinator = coordinator
        self._config = coordinator.entry
        self._hass = coordinator.hass
        self._device_id = device_id

        self._attr_name = self.entity_description.name
        self._attr_unique_id = util_slugify(
            f"{self.coordinator.cloud.devices[self._device_id].device_id}_{self._attr_name}"
        )
        self._attr_should_poll = False

        self._attr_is_on = self.entity_description.value_fn(self.coordinator.cloud.devices[self._device_id])
        self._attr_icon = (
            self.entity_description.icon_on
            if self._attr_is_on
            else self.entity_description.icon_off
        )

        self._attr_device_info = {
            "identifiers": {(DOMAIN, self._device_id)},
            "name": self.coordinator.cloud.devices[self._device_id].name,
            "model": "ThermoConnect",
            "manufacturer": "Webasto",
        }

        self.entity_id = binary_sensor.ENTITY_ID_FORMAT.format(
            util_slugify(
                f"{self.coordinator.cloud.devices[self._device_id].name} {self._attr_name}"
            )
        )

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        self._attr_is_on = self.entity_description.value_fn(self.coordinator.cloud.devices[self._device_id])
        self._attr_icon = (
            self.entity_description.icon_on
            if self._attr_is_on
            else self.entity_description.icon_off
        )
        self.async_write_ha_state()
