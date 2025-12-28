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
    """Setup device tracker."""
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

        self._prev_lat = self._cloud.devices[self._device_id].location["lat"]  # type: ignore
        self._prev_lon = self._cloud.devices[self._device_id].location["lon"]  # type: ignore

        self._attributes = {}

    @property
    def extra_state_attributes(self):
        """Return device specific attributes."""
        return self._attributes

    @property
    def available(self) -> bool:
        """Handle the location states."""
        if isinstance(self._cloud.devices[self._device_id].location, type(None)):
            self._attr_available = False
            return False
        else:
            self._attr_available = True
            return True

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        if (
            self._cloud.devices[self._device_id].location["lat"] != self._prev_lat  # type: ignore
            or self._cloud.devices[self._device_id].location["lon"] != self._prev_lon  # type: ignore
        ):
            self._prev_lat = self._cloud.devices[self._device_id].location["lat"]  # type: ignore
            self._prev_lon = self._cloud.devices[self._device_id].location["lon"]  # type: ignore
            self._attributes = {}

            self.async_write_ha_state()

    @property
    def source_type(self) -> SourceType | str | None:
        """Return the source type, eg gps or router, of the device."""
        if isinstance(self._cloud.devices[self._device_id].location, type(None)):
            return None

        return SourceType.GPS

    @property
    def latitude(self) -> float | None:
        """Return latitude value of the device."""
        if isinstance(self._cloud.devices[self._device_id].location, type(None)):
            return None

        return float(self._cloud.devices[self._device_id].location["lat"])  # type: ignore

    @property
    def longitude(self) -> float | None:
        """Return longitude value of the device."""
        if isinstance(self._cloud.devices[self._device_id].location, type(None)):
            return None

        return float(self._cloud.devices[self._device_id].location["lon"])  # type: ignore
