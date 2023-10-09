"""Base definitions."""

from collections.abc import Callable
from dataclasses import dataclass

from homeassistant.components.binary_sensor import BinarySensorEntityDescription
from homeassistant.components.number import NumberEntityDescription
from homeassistant.components.sensor import SensorEntityDescription
from homeassistant.components.switch import SwitchEntityDescription
from pywebasto import WebastoConnect


@dataclass
class WebastoConnectBaseEntityDescriptionMixin:
    """Describes a basic Webasto entity."""

    value_fn: Callable[[WebastoConnect], bool | str | int | float]


@dataclass
class WebastoConnectBinarySensorEntityDescription(
    BinarySensorEntityDescription, WebastoConnectBaseEntityDescriptionMixin
):
    """Describes a Webasto binary sensor."""

    icon_on: str | None = None
    icon_off: str | None = None


@dataclass
class WebastoConnectSensorEntityDescription(
    SensorEntityDescription, WebastoConnectBaseEntityDescriptionMixin
):
    """Describes a Webasto sensor."""

    unit_fn: Callable[["WebastoConnect"], None] = None


@dataclass
class WebastoConnectSwitchEntityDescription(
    SwitchEntityDescription, WebastoConnectBaseEntityDescriptionMixin
):
    """Describes a Webasto switch."""

    command_fn: Callable[[WebastoConnect], None] = None
    type_fn: Callable[[WebastoConnect], None] = None
    name_fn: Callable[[WebastoConnect], None] = None


@dataclass
class WebastoConnectNumberEntityDescription(
    NumberEntityDescription, WebastoConnectBaseEntityDescriptionMixin
):
    """Describes a Webasto number."""

    set_fn: Callable[[WebastoConnect], None] = None
    unit_fn: Callable[["WebastoConnect"], None] = None
