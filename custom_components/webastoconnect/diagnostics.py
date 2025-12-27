"""Get diagnostics."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL, CONF_LATITUDE, CONF_LONGITUDE, CONF_PASSWORD
from homeassistant.core import HomeAssistant

from .api import WebastoConnectUpdateCoordinator
from .const import ATTR_COORDINATOR, DOMAIN

TO_REDACT = {
    CONF_PASSWORD,
    CONF_EMAIL,
    CONF_LATITUDE,
    CONF_LONGITUDE,
    "lat",
    "lon",
    "acc_email",
    "stripe_key",
}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    data_dict = {
        "entry": entry.as_dict(),
    }

    api: WebastoConnectUpdateCoordinator = hass.data[DOMAIN][entry.entry_id][
        ATTR_COORDINATOR
    ]

    for id, device in api.cloud.devices.items():
        data_dict.update({str(id): device.__dict__})

    return async_redact_data(data_dict, TO_REDACT)
