"""Tests for diagnostics payload shaping and redaction."""

from types import SimpleNamespace

import pytest

from custom_components.webastoconnect.const import ATTR_COORDINATOR, DOMAIN
from custom_components.webastoconnect.diagnostics import (
    async_get_config_entry_diagnostics,
)


@pytest.mark.asyncio
async def test_diagnostics_keeps_api_payload_and_redacts_sensitive_fields() -> None:
    """Diagnostics should include API payloads without dumping the full private object."""
    device = SimpleNamespace(
        device_id=123,
        name="My Heater",
        last_data={
            "location": {"lat": 55.5, "lon": 12.3},
            "outputs": [],
        },
        settings={
            "general": {"acc_email": "user@example.com"},
        },
        dev_data={"subscription": {"expiration": 1}},
        temperature=10,
        voltage=12.4,
        is_ventilation=False,
        output_main=True,
        output_aux1=False,
        output_aux2=False,
        temperature_unit="°C",
        _WebastoDevice__internal_only="should_not_be_exposed",
    )

    hass = SimpleNamespace(
        data={
            DOMAIN: {
                "entry-1": {
                    ATTR_COORDINATOR: SimpleNamespace(
                        cloud=SimpleNamespace(devices={123: device})
                    )
                }
            }
        }
    )
    entry = SimpleNamespace(
        entry_id="entry-1",
        as_dict=lambda: {
            "title": "user@example.com",
            "unique_id": "user@example.com",
            "data": {"email": "user@example.com", "password": "secret"},
        },
    )

    diagnostics = await async_get_config_entry_diagnostics(hass, entry)
    payload = diagnostics["devices"]["123"]

    assert payload["api_payload"]["last_data"]["location"]["lat"] == "**REDACTED**"
    assert payload["api_payload"]["last_data"]["location"]["lon"] == "**REDACTED**"
    assert payload["api_payload"]["settings"]["general"]["acc_email"] == "**REDACTED**"
    assert diagnostics["entry"]["data"]["email"] == "**REDACTED**"
    assert diagnostics["entry"]["data"]["password"] == "**REDACTED**"
    assert diagnostics["entry"]["title"] == "**REDACTED**"
    assert diagnostics["entry"]["unique_id"] == "**REDACTED**"
    assert "_WebastoDevice__internal_only" not in payload
