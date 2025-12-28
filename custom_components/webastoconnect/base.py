"""Base definitions."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Callable, Optional, Union

from homeassistant.components.binary_sensor import BinarySensorEntityDescription
from homeassistant.components.number import NumberEntityDescription
from homeassistant.components.sensor import SensorEntityDescription
from homeassistant.components.switch import SwitchEntityDescription
from homeassistant.helpers.entity import EntityDescription
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
)
from homeassistant.util import slugify as util_slugify
from pywebasto import WebastoConnect, WebastoDevice

from .api import WebastoConnectUpdateCoordinator
from .const import DOMAIN


@dataclass(frozen=True)
class WebastoConnectBaseEntityDescriptionMixin:
    """Describes a basic Webasto entity."""

    value_fn: Callable[[WebastoDevice], bool | str | int | float]


@dataclass(frozen=True)
class WebastoConnectBinarySensorEntityDescription(
    BinarySensorEntityDescription, WebastoConnectBaseEntityDescriptionMixin
):
    """Describes a Webasto binary sensor."""

    icon_on: str | None = None
    icon_off: str | None = None


@dataclass(frozen=True)
class WebastoConnectSensorEntityDescription(SensorEntityDescription):
    """Describes a Webasto sensor."""

    value_fn: Optional[Callable[[Any], Any | None]] = None
    unit_fn: Optional[Callable[[Any], Any]] = None


@dataclass(frozen=True)
class WebastoConnectSwitchEntityDescription(
    SwitchEntityDescription, WebastoConnectBaseEntityDescriptionMixin
):
    """Describes a Webasto switch."""

    # allow command_fn to accept (webasto, id, state) by using a variadic Callable
    command_fn: Optional[Callable[..., Any]] = None
    type_fn: Optional[Callable[[WebastoConnect], None]] = None
    name_fn: Optional[Callable[["WebastoDevice"], Union[str, bool]]] = None


@dataclass(frozen=True)
class WebastoConnectNumberEntityDescription(
    NumberEntityDescription, WebastoConnectBaseEntityDescriptionMixin
):
    """Describes a Webasto number."""

    value_fn: Callable[[Any], Any]
    set_fn: Optional[Callable[[Any, Any], Any]] = None
    unit_fn: Optional[Callable[["WebastoDevice"], Any]] = None


class WebastoBaseEntity(CoordinatorEntity[DataUpdateCoordinator[None]]):
    """Base Webasto Connect Entity."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(
        self,
        device_id: int,
        coordinator: WebastoConnectUpdateCoordinator,
        description: (
            WebastoConnectBinarySensorEntityDescription
            | WebastoConnectSensorEntityDescription
            | WebastoConnectSwitchEntityDescription
            | WebastoConnectNumberEntityDescription
            | EntityDescription
        ),
    ) -> None:
        """Initialize a Webasto Connect Entity."""
        super().__init__(coordinator)

        self.entity_description = description
        self._config = coordinator.entry
        self._hass = coordinator.hass
        self._device_id = device_id
        self._cloud: WebastoConnect = coordinator.cloud

        # ensure _attr_name is a str or None (EntityDescription may use an UNDEFINED sentinel)
        self._attr_name = (
            self.entity_description.name
            if isinstance(self.entity_description.name, str)
            else None
        )

        self._attr_unique_id = util_slugify(
            f"{self._cloud.devices[self._device_id].device_id}_{self._attr_name}"
        )

        settings = self._cloud.devices[self._device_id].settings or {}

        self._attr_device_info = {
            "identifiers": {(DOMAIN, str(self._device_id))},
            "name": self._cloud.devices[self._device_id].name,
            "model": "ThermoConnect",
            "manufacturer": "Webasto",
            "hw_version": settings.get("hw_version", "Unknown"),
            "sw_version": settings.get("sw_version", "Unknown"),
            "configuration_url": "https://my.webastoconnect.com",
        }
