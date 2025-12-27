"""Base definitions."""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Callable, Optional, Union

from homeassistant.components.binary_sensor import BinarySensorEntityDescription
from homeassistant.components.number import NumberEntityDescription
from homeassistant.components.sensor import SensorEntityDescription
from homeassistant.components.switch import SwitchEntityDescription
from pywebasto import WebastoConnect, WebastoDevice


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
