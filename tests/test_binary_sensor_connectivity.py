"""Tests for Webasto connectivity binary sensor."""

from types import SimpleNamespace

from homeassistant.components.binary_sensor import BinarySensorDeviceClass

from custom_components.webastoconnect.binary_sensor import BINARY_SENSORS


def test_connected_binary_sensor_description_uses_connectivity_device_class() -> None:
    """Connected binary sensor should use the connectivity device class."""
    description = next(sensor for sensor in BINARY_SENSORS if sensor.key == "is_connected")

    assert description.device_class is BinarySensorDeviceClass.CONNECTIVITY
    assert description.entity_category is not None


def test_connected_binary_sensor_value_fn_reads_pywebasto_connectivity() -> None:
    """Connected binary sensor should read pywebasto is_connected directly."""
    description = next(sensor for sensor in BINARY_SENSORS if sensor.key == "is_connected")

    assert description.value_fn(SimpleNamespace(is_connected=True)) is True
    assert description.value_fn(SimpleNamespace(is_connected=False)) is False
    assert description.value_fn(SimpleNamespace(is_connected=None)) is None
