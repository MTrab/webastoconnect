"""Tests for Webasto device tracker location guards."""

from types import SimpleNamespace
from unittest.mock import Mock

from custom_components.webastoconnect.device_tracker import WebastoConnectDeviceTracker


def _build_tracker(location, prev_lat=None, prev_lon=None) -> WebastoConnectDeviceTracker:
    """Create a minimal tracker instance for unit tests."""
    tracker = object.__new__(WebastoConnectDeviceTracker)
    tracker._device_id = 1
    tracker._cloud = SimpleNamespace(devices={1: SimpleNamespace(location=location)})
    tracker._prev_lat = prev_lat
    tracker._prev_lon = prev_lon
    tracker._attributes = {}
    tracker._attr_available = True
    tracker.async_write_ha_state = Mock()
    return tracker


def test_tracker_location_false_is_unavailable() -> None:
    """Tracker should be unavailable when location data is disabled."""
    tracker = _build_tracker(False)

    assert tracker.available is False
    assert tracker.source_type is None
    assert tracker.latitude is None
    assert tracker.longitude is None


def test_tracker_location_without_coords_is_unavailable() -> None:
    """Tracker should be unavailable when lat/lon are missing."""
    tracker = _build_tracker({"state": "ON"})

    assert tracker.available is False
    assert tracker.latitude is None
    assert tracker.longitude is None


def test_tracker_update_writes_state_when_location_changes() -> None:
    """Tracker should update cached coords and write state on change."""
    tracker = _build_tracker({"lat": 55.0, "lon": 12.0}, prev_lat=54.9, prev_lon=12.0)

    tracker._handle_coordinator_update()

    assert tracker._prev_lat == 55.0
    assert tracker._prev_lon == 12.0
    tracker.async_write_ha_state.assert_called_once()

