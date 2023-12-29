"""Support for number entities in Webasto Connect."""

import logging
from typing import cast

from homeassistant.components import number
from homeassistant.components.number import NumberEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
)
from homeassistant.util import slugify as util_slugify

from .api import WebastoConnectUpdateCoordinator
from .base import WebastoConnectNumberEntityDescription
from .const import ATTR_COORDINATOR, DOMAIN

LOGGER = logging.getLogger(__name__)

NUMBERS = [
    WebastoConnectNumberEntityDescription(
        key="low_voltage_cutoff",
        name="Low Voltage Cutoff",
        entity_category=EntityCategory.CONFIG,
        value_fn=lambda webasto: webasto.low_voltage_cutoff,
        set_fn=lambda webasto, state: webasto.set_low_voltage_cutoff(state),
        native_min_value=0,
        native_max_value=30,
        native_step=0.1,
        native_unit_of_measurement="V",
        entity_registry_enabled_default=False,
        icon="mdi:battery-off",
    ),
    WebastoConnectNumberEntityDescription(
        key="ext_temp_comp",
        name="Temperature Compensation",
        entity_category=EntityCategory.CONFIG,
        value_fn=lambda webasto: webasto.temperature_compensation,
        set_fn=lambda webasto, state: webasto.set_temperature_compensation(state),
        native_min_value=-10,
        native_max_value=10,
        native_step=0.5,
        unit_fn=lambda webasto: webasto.temperature_unit,
        entity_registry_enabled_default=False,
        icon="mdi:thermometer-alert",
    ),
]


async def async_setup_entry(hass, entry: ConfigEntry, async_add_devices):
    """Setup switch."""
    numbers_list = []

    coordinator = hass.data[DOMAIN][entry.entry_id][ATTR_COORDINATOR]

    for num in NUMBERS:
        entity = WebastoConnectNumber(num, coordinator)
        LOGGER.debug(
            "Adding number '%s' with entity_id '%s'", num.name, entity.entity_id
        )
        numbers_list.append(entity)

    async_add_devices(numbers_list)


class WebastoConnectNumber(
    CoordinatorEntity[DataUpdateCoordinator[None]], NumberEntity
):
    """Representation of a Webasto Connect number."""

    def __init__(
        self,
        description: WebastoConnectNumberEntityDescription,
        coordinator: WebastoConnectUpdateCoordinator,
    ) -> None:
        """Initialize a Webasto Connect number."""
        super().__init__(coordinator)

        self.entity_description = description
        self._config = coordinator.entry
        self.coordinator = coordinator
        self._hass = coordinator.hass

        self._attr_name = self.entity_description.name
        self._attr_unique_id = util_slugify(
            f"{self._attr_name}_{self._config.entry_id}"
        )
        self._attr_should_poll = False
        self._attr_device_info = {
            "identifiers": {(DOMAIN, self.coordinator.cloud.device_id)},
            "name": self.coordinator.cloud.name,
            "model": "ThermoConnect",
            "manufacturer": "Webasto",
        }

        if not isinstance(description.unit_fn, type(None)):
            self._attr_native_unit_of_measurement = description.unit_fn(
                coordinator.cloud
            )

        self.entity_id = number.ENTITY_ID_FORMAT.format(
            util_slugify(f"{self.coordinator.cloud.name} {self._attr_name}")
        )

    @property
    def native_value(self) -> float | None:
        """Get the native value."""
        return cast(float, self.entity_description.value_fn(self.coordinator.cloud))

    async def async_set_native_value(self, value: float) -> None:
        """Set new value."""
        LOGGER.debug("Setting '%s' to '%s'", self.entity_id, value)
        await self._hass.async_add_executor_job(
            self.entity_description.set_fn, self.coordinator.cloud, value
        )
        await self.coordinator.async_refresh()
