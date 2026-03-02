"""Device tracker for Webasto Connect."""

import logging

from homeassistant.components import device_tracker
from homeassistant.components.device_tracker.config_entry import TrackerEntity
from homeassistant.components.device_tracker.const import SourceType
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback
from homeassistant.helpers.entity import EntityDescription
from homeassistant.util import slugify as util_slugify

from custom_components.webastoconnect.base import WebastoBaseEntity

from .api import WebastoConnectUpdateCoordinator
from .const import ATTR_COORDINATOR, DOMAIN

LOGGER = logging.getLogger(__name__)

TRACKER = EntityDescription(
    key="devicetracker",
    name="Location",
    entity_registry_enabled_default=True,
    icon="mdi:car",
)


async def async_setup_entry(hass, entry: ConfigEntry, async_add_devices):
    """Set up device tracker."""
    coordinator = hass.data[DOMAIN][entry.entry_id][ATTR_COORDINATOR]
    trackers = []

    for id, device in coordinator.cloud.devices.items():
        LOGGER.debug("Setting up device tracker for device: %s", device.name)
        entity = WebastoConnectDeviceTracker(id, TRACKER, coordinator)
        LOGGER.debug("Adding device tracker with entity_id '%s'", entity.entity_id)
        trackers.append(entity)

    async_add_devices(trackers)


class WebastoConnectDeviceTracker(WebastoBaseEntity, TrackerEntity):
    """A device tracker for Webasto Connect."""

    def __init__(
        self,
        device_id: int,
        description: EntityDescription,
        coordinator: WebastoConnectUpdateCoordinator,
    ) -> None:
        """Initialize a Webasto Connect device tracker."""
        super().__init__(device_id, coordinator, description)

        self.entity_id = device_tracker.ENTITY_ID_FORMAT.format(  # type: ignore
            util_slugify(
                f"{self._cloud.devices[self._device_id].name} {self._attr_name}"
            )
        )

        location = self._location_data
        self._prev_lat = location["lat"] if location else None
        self._prev_lon = location["lon"] if location else None

        self._attributes = {}

    @property
    def _location_data(self) -> dict | None:
        """Return validated location data when available."""
        location = self._cloud.devices[self._device_id].location
        if not isinstance(location, dict):
            return None
        if "lat" not in location or "lon" not in location:
            return None
        return location

    @property
    def extra_state_attributes(self):
        """Return device specific attributes."""
        return self._attributes

    @property
    def available(self) -> bool:
        """Handle the location states."""
        is_available = self._location_data is not None
        self._attr_available = is_available
        return is_available

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        location = self._location_data
        lat = location["lat"] if location else None
        lon = location["lon"] if location else None

        if lat != self._prev_lat or lon != self._prev_lon:
            self._prev_lat = lat
            self._prev_lon = lon
            self._attributes = {}

            self.async_write_ha_state()

    @property
    def source_type(self) -> SourceType | str | None:
        """Return the source type, eg gps or router, of the device."""
        if self._location_data is None:
            return None

        return SourceType.GPS

    @property
    def latitude(self) -> float | None:
        """Return latitude value of the device."""
        location = self._location_data
        if location is None:
            return None

        return float(location["lat"])

    @property
    def longitude(self) -> float | None:
        """Return longitude value of the device."""
        location = self._location_data
        if location is None:
            return None

        return float(location["lon"])
