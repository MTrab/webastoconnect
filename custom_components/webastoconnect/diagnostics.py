"""Get diagnostics."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_EMAIL, CONF_LATITUDE, CONF_LONGITUDE, CONF_PASSWORD
from homeassistant.core import HomeAssistant

from . import WebastoConfigEntry
from .api import WebastoConnectUpdateCoordinator

TO_REDACT = {
    CONF_PASSWORD,
    CONF_EMAIL,
    "title",
    "unique_id",
    CONF_LATITUDE,
    CONF_LONGITUDE,
    "lat",
    "lon",
    "acc_email",
    "stripe_key",
}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: WebastoConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    data_dict = {
        "entry": entry.as_dict(),
        "devices": {},
    }

    api: WebastoConnectUpdateCoordinator = entry.runtime_data.coordinator

    for id, device in api.cloud.devices.items():
        data_dict["devices"][str(id)] = {
            "device_id": getattr(device, "device_id", None),
            "name": getattr(device, "name", None),
            # Keep raw API payloads for bug reports while avoiding a full private object dump.
            "api_payload": {
                "last_data": getattr(device, "last_data", None),
                "settings": getattr(device, "settings", None),
                "dev_data": getattr(device, "dev_data", None),
            },
            "state": {
                "temperature": getattr(device, "temperature", None),
                "voltage": getattr(device, "voltage", None),
                "is_ventilation": getattr(device, "is_ventilation", None),
                "output_main": getattr(device, "output_main", None),
                "output_aux1": getattr(device, "output_aux1", None),
                "output_aux2": getattr(device, "output_aux2", None),
                "temperature_unit": getattr(device, "temperature_unit", None),
            },
        }

    return async_redact_data(data_dict, TO_REDACT)
