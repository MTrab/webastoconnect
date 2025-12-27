"""Add Webasto ThermoConnect support to Home Assistant."""

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration
from pywebasto.exceptions import UnauthorizedException

from .api import WebastoConnectUpdateCoordinator
from .const import ATTR_COORDINATOR, ATTR_DEVICES, DOMAIN, PLATFORMS, STARTUP

LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up cloud API connector from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    result = await _async_setup(hass, entry)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return result


async def _async_setup(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Setup the integration using a config entry."""
    integration = await async_get_integration(hass, DOMAIN)
    LOGGER.info(
        STARTUP,
        integration.version,
    )

    coordinator = WebastoConnectUpdateCoordinator(hass, entry)
    try:
        await hass.async_add_executor_job(coordinator.cloud.connect)
        LOGGER.debug("Connected to Webasto API for %s", entry.data.get(CONF_EMAIL))
    except UnauthorizedException:
        LOGGER.error("Invalid email or password specified!")
        return False

    hass.data[DOMAIN][entry.entry_id] = {
        ATTR_COORDINATOR: coordinator,
        ATTR_DEVICES: {},
    }

    await coordinator.async_config_entry_first_refresh()

    for id, device in coordinator.cloud.devices.items():
        LOGGER.debug("Found device: %s", device.name)
        hass.data[DOMAIN][entry.entry_id][ATTR_DEVICES][id] = device

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
