"""Device tracker for Webasto Connect."""

import logging

from homeassistant.components import device_tracker
from homeassistant.components.device_tracker import SourceType, TrackerEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback
from homeassistant.helpers.entity import EntityDescription
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
)
from homeassistant.util import slugify as util_slugify

from .api import WebastoConnectUpdateCoordinator
from .const import ATTR_COORDINATOR, ATTR_DIRECTION, ATTR_SPEED, DOMAIN

LOGGER = logging.getLogger(__name__)

TRACKER = EntityDescription(
    key="devicetracker",
    name="Location",
    entity_registry_enabled_default=True,
    icon="mdi:car",
)


async def async_setup_entry(hass, entry: ConfigEntry, async_add_devices):
    """Setup device tracker."""
    coordinator = hass.data[DOMAIN][entry.entry_id][ATTR_COORDINATOR]
    trackers = []

    for id, device in coordinator.cloud.devices.items():
        LOGGER.debug("Setting up device tracker for device: %s", device.name)
        entity = WebastoConnectDeviceTracker(id, TRACKER, coordinator)
        LOGGER.debug("Adding device tracker with entity_id '%s'", entity.entity_id)
        trackers.append(entity)

    async_add_devices(trackers)


class WebastoConnectDeviceTracker(
    CoordinatorEntity[DataUpdateCoordinator[None]], TrackerEntity
):
    """A device tracker for Webasto Connect."""

    def __init__(
        self,
        device_id: str,
        description: EntityDescription,
        coordinator: WebastoConnectUpdateCoordinator,
    ) -> None:
        """Initialize a Webasto Connect device tracker."""
        super().__init__(coordinator)

        self.entity_description = description
        self._config = coordinator.entry
        self.coordinator = coordinator
        self._hass = coordinator.hass
        self._device_id = device_id

        self._attr_name = description.name
        self._attr_unique_id = util_slugify(
            f"{self.coordinator.cloud.devices[self._device_id].device_id}_{self._attr_name}"
        )

        self._prev_lat = self.coordinator.cloud.devices[self._device_id].location["lat"]
        self._prev_lon = self.coordinator.cloud.devices[self._device_id].location["lon"]

        self._attr_should_poll = False

        self._attr_device_info = {
            "identifiers": {(DOMAIN, self._device_id)},
            "name": self.coordinator.cloud.devices[self._device_id].name,
            "model": "ThermoConnect",
            "manufacturer": "Webasto",
        }

        self.entity_id = device_tracker.ENTITY_ID_FORMAT.format(
            util_slugify(
                f"{self.coordinator.cloud.devices[self._device_id].name} {self._attr_name}"
            )
        )

        self._attributes = {}

    @property
    def extra_state_attributes(self):
        """Return device specific attributes."""
        return self._attributes

    @property
    def available(self) -> bool:
        """Handle the location states."""
        if isinstance(
            self.coordinator.cloud.devices[self._device_id].location, type(None)
        ):
            self._attr_available = False
            return False
        else:
            self._attr_available = True
            return True

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        if (
            self.coordinator.cloud.devices[self._device_id].location["lat"]
            != self._prev_lat
            or self.coordinator.cloud.devices[self._device_id].location["lon"]
            != self._prev_lon
        ):
            self._prev_lat = self.coordinator.cloud.devices[self._device_id].location[
                "lat"
            ]
            self._prev_lon = self.coordinator.cloud.devices[self._device_id].location[
                "lon"
            ]
            self._attributes = {}

            self.async_write_ha_state()

    @property
    def source_type(self) -> SourceType | str | None:
        """Return the source type, eg gps or router, of the device."""
        if isinstance(
            self.coordinator.cloud.devices[self._device_id].location, type(None)
        ):
            return None

        return SourceType.GPS

    @property
    def latitude(self) -> float | None:
        """Return latitude value of the device."""
        if isinstance(
            self.coordinator.cloud.devices[self._device_id].location, type(None)
        ):
            return None

        return float(self.coordinator.cloud.devices[self._device_id].location["lat"])

    @property
    def longitude(self) -> float | None:
        """Return longitude value of the device."""
        if isinstance(
            self.coordinator.cloud.devices[self._device_id].location, type(None)
        ):
            return None

        return float(self.coordinator.cloud.devices[self._device_id].location["lon"])
