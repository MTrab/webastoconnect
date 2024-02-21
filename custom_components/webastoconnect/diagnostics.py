"""Get diagnostics."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    CONF_EMAIL,
    CONF_PASSWORD,
    CONF_LATITUDE,
    CONF_LONGITUDE,
)
from homeassistant.core import HomeAssistant

from .api import WebastoConnectUpdateCoordinator
from .const import DOMAIN, ATTR_COORDINATOR


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
    data_entry = hass.data[DOMAIN][entry.entry_id]

    data_dict = {
        "entry": entry.as_dict(),
    }

    device_dict = {}
    api: WebastoConnectUpdateCoordinator = hass.data[DOMAIN][entry.entry_id][
        ATTR_COORDINATOR
    ]

    data_dict.update({"Latest API dataset": api.cloud._last_data})
    data_dict.update({"Latest device dataset": api.cloud._dev_data})
    data_dict.update({"Latest settings dataset": api.cloud._settings})

    return async_redact_data(data_dict, TO_REDACT)
