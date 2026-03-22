"""Tests to avoid redundant state writes on unchanged coordinator updates."""

from types import SimpleNamespace
from unittest.mock import Mock

from custom_components.webastoconnect.base import (
    WebastoConnectBinarySensorEntityDescription,
    WebastoConnectNumberEntityDescription,
    WebastoConnectSensorEntityDescription,
    WebastoConnectSwitchEntityDescription,
)
from custom_components.webastoconnect.binary_sensor import WebastoConnectBinarySensor
from custom_components.webastoconnect.number import WebastoConnectNumber
from custom_components.webastoconnect.sensor import WebastoConnectSensor
from custom_components.webastoconnect.switch import WebastoConnectSwitch


def test_sensor_skips_write_when_name_and_value_unchanged() -> None:
    """Sensor should avoid state write when neither name nor value changes."""
    entity = object.__new__(WebastoConnectSensor)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={1: SimpleNamespace(value=21, label="Temp")}
    )
    entity.entity_description = WebastoConnectSensorEntityDescription(
        key="temperature",
        name="Temperature",
        value_fn=lambda dev: dev.value,
        name_fn=lambda dev: dev.label,
    )
    entity._attr_name = "Temp"
    entity._attr_native_value = 21
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_not_called()


def test_sensor_writes_when_value_changes() -> None:
    """Sensor should write state when native value changes."""
    entity = object.__new__(WebastoConnectSensor)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={1: SimpleNamespace(value=22, label="Temp")}
    )
    entity.entity_description = WebastoConnectSensorEntityDescription(
        key="temperature",
        name="Temperature",
        value_fn=lambda dev: dev.value,
        name_fn=lambda dev: dev.label,
    )
    entity._attr_name = "Temp"
    entity._attr_native_value = 21
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_called_once()


def test_switch_writes_when_state_unchanged() -> None:
    """Switches should always write state on coordinator updates."""
    entity = object.__new__(WebastoConnectSwitch)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={
            1: SimpleNamespace(
                output_main_name="Output", output_main=False, is_ventilation=False
            )
        }
    )
    entity.entity_description = WebastoConnectSwitchEntityDescription(
        key="main_output",
        name="Output",
        value_fn=lambda dev: dev.output_main,
        name_fn=lambda dev: dev.output_main_name,
    )
    entity._attr_name = "Output"
    entity._attr_is_on = False
    entity._attr_icon = "mdi:radiator-off"
    entity._attr_available = True
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_called_once()


def test_switch_writes_when_device_becomes_disconnected() -> None:
    """Switch should write state when availability changes to unavailable."""
    entity = object.__new__(WebastoConnectSwitch)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={
            1: SimpleNamespace(
                output_main_name="Output",
                output_main=False,
                is_ventilation=False,
                is_connected=False,
            )
        }
    )
    entity.entity_description = WebastoConnectSwitchEntityDescription(
        key="main_output",
        name="Output",
        value_fn=lambda dev: dev.output_main,
        name_fn=lambda dev: dev.output_main_name,
    )
    entity._attr_name = "Output"
    entity._attr_is_on = False
    entity._attr_icon = "mdi:radiator-off"
    entity._attr_available = True
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_called_once()


def test_aux_switch_writes_when_state_unchanged_without_icon() -> None:
    """Aux switches should always write without requiring icon attributes."""
    entity = object.__new__(WebastoConnectSwitch)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={
            1: SimpleNamespace(
                output_aux1_name="AUX1",
                output_aux1=False,
                is_connected=True,
            )
        }
    )
    entity.entity_description = WebastoConnectSwitchEntityDescription(
        key="aux1_output",
        name="AUX1",
        value_fn=lambda dev: dev.output_aux1,
        name_fn=lambda dev: dev.output_aux1_name,
    )
    entity._attr_name = "AUX1"
    entity._attr_is_on = False
    entity._attr_available = True
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_called_once()


def test_aux_switch_writes_when_state_changes_without_icon() -> None:
    """Aux switches should still write state changes without icon attributes."""
    entity = object.__new__(WebastoConnectSwitch)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={
            1: SimpleNamespace(
                output_aux1_name="AUX1",
                output_aux1=True,
                is_connected=True,
            )
        }
    )
    entity.entity_description = WebastoConnectSwitchEntityDescription(
        key="aux1_output",
        name="AUX1",
        value_fn=lambda dev: dev.output_aux1,
        name_fn=lambda dev: dev.output_aux1_name,
    )
    entity._attr_name = "AUX1"
    entity._attr_is_on = False
    entity._attr_available = True
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_called_once()


def test_number_is_unavailable_when_device_disconnected() -> None:
    """Writable number entities should be unavailable when device disconnects."""
    entity = object.__new__(WebastoConnectNumber)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={1: SimpleNamespace(low_voltage_cutoff=11.5, is_connected=False)}
    )
    entity.entity_description = WebastoConnectNumberEntityDescription(
        key="low_voltage_cutoff",
        name="Low Voltage Cutoff",
        value_fn=lambda dev: dev.low_voltage_cutoff,
    )

    assert entity.available is False


def test_switch_is_available_when_connectivity_unknown() -> None:
    """Switches should stay available unless device is explicitly disconnected."""
    entity = object.__new__(WebastoConnectSwitch)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(
        devices={
            1: SimpleNamespace(
                output_main_name="Output",
                output_main=False,
                is_ventilation=False,
                is_connected=None,
            )
        }
    )
    entity.entity_description = WebastoConnectSwitchEntityDescription(
        key="main_output",
        name="Output",
        value_fn=lambda dev: dev.output_main,
        name_fn=lambda dev: dev.output_main_name,
    )

    assert entity.available is True


def test_binary_sensor_skips_write_when_state_unchanged() -> None:
    """Binary sensor should avoid state write when state and icon are unchanged."""
    entity = object.__new__(WebastoConnectBinarySensor)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(devices={1: SimpleNamespace(allow_location=True)})
    entity.entity_description = WebastoConnectBinarySensorEntityDescription(
        key="allow_location",
        name="Allow Location Services",
        value_fn=lambda dev: dev.allow_location,
        icon_on="mdi:map-marker",
        icon_off="mdi:map-marker-off",
    )
    entity._attr_is_on = True
    entity._attr_icon = "mdi:map-marker"
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_not_called()


def test_binary_sensor_writes_when_state_changes() -> None:
    """Binary sensor should write state when state flips."""
    entity = object.__new__(WebastoConnectBinarySensor)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(devices={1: SimpleNamespace(allow_location=False)})
    entity.entity_description = WebastoConnectBinarySensorEntityDescription(
        key="allow_location",
        name="Allow Location Services",
        value_fn=lambda dev: dev.allow_location,
        icon_on="mdi:map-marker",
        icon_off="mdi:map-marker-off",
    )
    entity._attr_is_on = True
    entity._attr_icon = "mdi:map-marker"
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_called_once()


def test_connected_binary_sensor_skips_write_when_state_unchanged() -> None:
    """Connectivity binary sensor should avoid writes when state is unchanged."""
    entity = object.__new__(WebastoConnectBinarySensor)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(devices={1: SimpleNamespace(is_connected=False)})
    entity.entity_description = WebastoConnectBinarySensorEntityDescription(
        key="is_connected",
        name="Connected",
        value_fn=lambda dev: dev.is_connected,
        icon_on="mdi:wifi",
        icon_off="mdi:wifi-off",
    )
    entity._attr_is_on = False
    entity._attr_icon = "mdi:wifi-off"
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_not_called()


def test_connected_binary_sensor_writes_when_state_becomes_unknown() -> None:
    """Connectivity binary sensor should write when state changes to unknown."""
    entity = object.__new__(WebastoConnectBinarySensor)
    entity._device_id = 1
    entity._cloud = SimpleNamespace(devices={1: SimpleNamespace(is_connected=None)})
    entity.entity_description = WebastoConnectBinarySensorEntityDescription(
        key="is_connected",
        name="Connected",
        value_fn=lambda dev: dev.is_connected,
        icon_on="mdi:wifi",
        icon_off="mdi:wifi-off",
    )
    entity._attr_is_on = True
    entity._attr_icon = "mdi:wifi"
    entity.async_write_ha_state = Mock()

    entity._handle_coordinator_update()

    entity.async_write_ha_state.assert_called_once()
