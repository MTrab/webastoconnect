"""Tests for Webasto base entity behavior."""

from types import SimpleNamespace

from homeassistant.util import slugify as util_slugify

from custom_components.webastoconnect.base import WebastoBaseEntity, webasto_device_name
from custom_components.webastoconnect.sensor import WebastoConnectSensor


def test_device_name_uses_app_alias_when_device_name_is_id() -> None:
    """Device info name should use the approved app name when available."""
    entity = object.__new__(WebastoBaseEntity)
    device = SimpleNamespace(
        device_id="123",
        name="123",
        app_data={"alias": "Car"},
    )
    entity._device_id = "123"
    entity._cloud = SimpleNamespace(devices={"123": device})

    assert entity._device_name == "Car"


def test_device_name_uses_fallback_name() -> None:
    """Device name should use webapi fallback when app data has no name."""
    device = SimpleNamespace(
        device_id="123",
        name="123",
        app_data={"id": "123"},
    )

    assert webasto_device_name(device, "Car") == "Car"


def test_entity_id_uses_app_alias_when_device_name_is_id() -> None:
    """Entity id should use the configured device name."""
    sensor = object.__new__(WebastoConnectSensor)
    device = SimpleNamespace(
        device_id="123",
        name="123",
        app_data={"alias": "Car"},
    )
    sensor._device_id = "123"
    sensor._cloud = SimpleNamespace(devices={"123": device})
    sensor._attr_name = "Temperature"

    entity_id = "sensor." + util_slugify(f"{sensor._device_name} {sensor._attr_name}")

    assert entity_id == "sensor.car_temperature"
