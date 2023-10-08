"""Add Webasto ThermoConnect support to Home Assistant."""

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .api import WebastoConnector, WebastoConnectUpdateCoordinator
from .const import ATTR_COORDINATOR, DOMAIN, PLATFORMS, STARTUP
from .pywebasto.exceptions import UnauthorizedException

LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up cloud API connector from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    result = await _async_setup(hass, entry)

    if result:
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
        LOGGER.debug("Connected to %s", coordinator.cloud.name)
    except UnauthorizedException:
        LOGGER.error("Invalid email or password specified!")
        return False

    hass.data[DOMAIN][entry.entry_id] = {
        ATTR_COORDINATOR: coordinator,
    }

    await coordinator.async_config_entry_first_refresh()

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    for platform in PLATFORMS:
        await hass.config_entries.async_forward_entry_unload(entry, platform)

    hass.data[DOMAIN].pop(entry.entry_id)

    return True


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
