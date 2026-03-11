"""Tests for timer sensor helper logic."""

from datetime import UTC, datetime
from types import SimpleNamespace

from custom_components.webastoconnect.sensor import _next_timer_sensor_payload


def test_next_timer_sensor_payload_selects_soonest_enabled_timer() -> None:
    """Next timer state should point to the nearest enabled timer occurrence."""
    webasto = SimpleNamespace(
        last_data={
            "outputs": [
                {
                    "line": "OUTH",
                    "timers": [
                        {
                            "type": "simple",
                            "start": 600,  # 10:00 UTC
                            "duration": 1800,
                            "repeat": 64,  # Monday
                            "enabled": True,
                        },
                        {
                            "type": "simple",
                            "start": 500,  # 08:20 UTC -> next day when now is 09:00
                            "duration": 1200,
                            "repeat": 0,
                            "enabled": True,
                        },
                    ],
                }
            ],
            "disabled_outputs": [],
        }
    )

    state, attributes = _next_timer_sensor_payload(
        webasto, now_utc=datetime(2026, 3, 2, 9, 0, tzinfo=UTC)
    )

    assert state == datetime(2026, 3, 2, 10, 0, tzinfo=UTC)
    assert attributes["next_timer_index"] == 0
    assert attributes["next_timer"]["line"] == "Heater"
    assert attributes["next_timer"]["line_code"] == "OUTH"
    assert len(attributes["timers"]) == 2


def test_next_timer_sensor_payload_includes_timers_from_disabled_outputs() -> None:
    """Timer attributes should include timers from outputs and disabled_outputs."""
    webasto = SimpleNamespace(
        last_data={
            "outputs": [
                {
                    "line": "OUTH",
                    "timers": [
                        {
                            "type": "simple",
                            "start": 700,
                            "duration": 1800,
                            "repeat": 1,
                            "enabled": False,
                        }
                    ],
                }
            ],
            "disabled_outputs": [
                {
                    "line": "OUTH",
                    "timers": [
                        {
                            "type": "simple",
                            "start": 800,
                            "duration": 1800,
                            "repeat": 1,
                            "enabled": True,
                        }
                    ],
                }
            ],
        }
    )

    state, attributes = _next_timer_sensor_payload(
        webasto, now_utc=datetime(2026, 3, 3, 1, 0, tzinfo=UTC)
    )

    assert state is not None
    assert len(attributes["timers"]) == 2
    assert attributes["timers"][0]["enabled"] is False
    assert attributes["timers"][1]["enabled"] is True


def test_next_timer_sensor_payload_includes_ventilation_line() -> None:
    """Next timer can come from OUTV when it is earlier than OUTH."""
    webasto = SimpleNamespace(
        last_data={
            "outputs": [
                {
                    "line": "OUTH",
                    "timers": [
                        {
                            "type": "simple",
                            "start": 610,  # 10:10
                            "duration": 1800,
                            "repeat": 64,
                            "enabled": True,
                        }
                    ],
                },
                {
                    "line": "OUTV",
                    "timers": [
                        {
                            "type": "simple",
                            "start": 605,  # 10:05
                            "duration": 1800,
                            "repeat": 64,
                            "enabled": True,
                        }
                    ],
                },
            ],
            "disabled_outputs": [],
        }
    )

    state, attributes = _next_timer_sensor_payload(
        webasto, now_utc=datetime(2026, 3, 2, 9, 0, tzinfo=UTC)
    )

    assert state == datetime(2026, 3, 2, 10, 5, tzinfo=UTC)
    assert attributes["next_timer"]["line"] == "Ventilation"
    assert attributes["next_timer"]["line_code"] == "OUTV"
    assert {timer["line"] for timer in attributes["timers"]} == {
        "Heater",
        "Ventilation",
    }
