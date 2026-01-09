"""Add Webasto ThermoConnect support to Home Assistant."""

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integration
from homeassistant.util import slugify as util_slugify
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


async def _async_migrate_unique_ids(
    hass: HomeAssistant,
    heater_id: int,
    heater_name: str,
    entry: ConfigEntry,
) -> None:
    """Migrate unique IDs to new format."""

    @callback
    def _async_migrator(entity_entry: er.RegistryEntry) -> dict[str, Any] | None:
        """Migrate an entity's unique ID."""
        updates = None
        entity_unique_id = entity_entry.unique_id
        entity_name = entity_entry.original_name

        if not heater_name.lower() in str(entity_entry.suggested_object_id):
            LOGGER.debug(
                "Skipping entity '%s' during migration, heater name '%s' not found in '%s'",
                entity_entry.entity_id,
                heater_name.lower(),
                entity_entry.suggested_object_id,
            )
            return None

        new_unique_id = util_slugify(f"{heater_id}_{entity_name}")

        if entity_unique_id == new_unique_id:
            LOGGER.debug(
                "No migration needed for entity '%s' with unique_id '%s'",
                entity_entry.entity_id,
                entity_unique_id,
            )
            return None

        LOGGER.debug(
            "Migrating entity '%s' unique_id from '%s' to '%s'",
            entity_entry.entity_id,
            entity_unique_id,
            new_unique_id,
        )
        updates = {"new_unique_id": new_unique_id}

        return updates

    await er.async_migrate_entries(
        hass,
        entry.entry_id,
        _async_migrator,
    )


async def _async_setup(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Setup the integration using a config entry."""
    integration = await async_get_integration(hass, DOMAIN)
    LOGGER.info(
        STARTUP,
        integration.version,
    )

    coordinator = WebastoConnectUpdateCoordinator(hass, entry)
    try:
        await coordinator.cloud.connect()
        LOGGER.debug(
            "Connected to Webasto API for %s",
            entry.options.get(CONF_EMAIL, entry.data.get(CONF_EMAIL)),
        )
    except UnauthorizedException:
        raise ConfigEntryAuthFailed("Invalid email or password specified") from None

    hass.data[DOMAIN][entry.entry_id] = {
        ATTR_COORDINATOR: coordinator,
        ATTR_DEVICES: {},
    }

    await coordinator.async_config_entry_first_refresh()

    for id, device in coordinator.cloud.devices.items():
        LOGGER.debug("Found device: %s", device.name)
        # Migrate unique IDs
        await _async_migrate_unique_ids(hass, id, device.name, entry)
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
