"""Tests for output end timestamp sensor parsing."""

from datetime import UTC, datetime
from types import SimpleNamespace

from custom_components.webastoconnect.sensor import (
    _main_output_end_name,
    _main_output_end_time,
)


def test_main_output_end_time_returns_timestamp_for_active_main_output() -> None:
    """Active OUTH/OUTV output with ontime should return UTC datetime."""
    device = SimpleNamespace(
        last_data={
            "outputs": [
                {"line": "OUTH", "state": "ON", "ontime": 1_772_469_422},
            ]
        }
    )

    result = _main_output_end_time(device)

    assert result == datetime.fromtimestamp(1_772_469_422, UTC)


def test_main_output_end_time_prefers_pywebasto_property() -> None:
    """Use pywebasto property when available."""
    timestamp = datetime.fromtimestamp(1_772_469_422, UTC)
    device = SimpleNamespace(
        output_main_end_time=timestamp,
        last_data={"outputs": [{"line": "OUTH", "state": "ON", "ontime": 1}]},
    )

    assert _main_output_end_time(device) == timestamp


def test_main_output_end_name_uses_output_main_name() -> None:
    """The sensor name should follow the output main label."""
    device = SimpleNamespace(output_main_name="Heater")

    assert _main_output_end_name(device) == "Heater ends"


def test_main_output_end_name_falls_back_for_invalid_name() -> None:
    """Invalid output names should use a safe fallback label."""
    device = SimpleNamespace(output_main_name=False)

    assert _main_output_end_name(device) == "Output ends"


def test_main_output_end_time_returns_none_when_output_is_off() -> None:
    """Inactive outputs should not report an end time."""
    device = SimpleNamespace(
        last_data={
            "outputs": [
                {"line": "OUTH", "state": "OFF", "ontime": 1_772_469_422},
            ]
        }
    )

    assert _main_output_end_time(device) is None


def test_main_output_end_time_ignores_non_main_outputs() -> None:
    """Non-main lines should not be used for main output end time."""
    device = SimpleNamespace(
        last_data={
            "outputs": [
                {"line": "OUT1", "state": "ON", "ontime": 1_772_469_422},
                {"line": "OUTA", "state": "ON", "ontime": 1_772_469_422},
            ]
        }
    )

    assert _main_output_end_time(device) is None


def test_main_output_end_time_returns_none_when_ontime_invalid() -> None:
    """Missing or zero ontime should not produce a timestamp."""
    device = SimpleNamespace(
        last_data={
            "outputs": [
                {"line": "OUTV", "state": "ON", "ontime": 0},
            ]
        }
    )

    assert _main_output_end_time(device) is None
