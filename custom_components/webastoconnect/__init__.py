"""Add Webasto ThermoConnect support to Home Assistant."""

from collections.abc import Callable
from dataclasses import dataclass
import logging
from pathlib import Path
from typing import Any, TypeAlias

from homeassistant.components.lovelace.const import (
    CONF_RESOURCE_TYPE_WS,
    CONF_TYPE,
    CONF_URL,
    LOVELACE_DATA,
    MODE_STORAGE,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integration
from homeassistant.util import slugify as util_slugify
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

from .api import WebastoConnectUpdateCoordinator
from .card_install import ensure_card_installed
from .const import CARD_FILENAME, CARD_WWW_SUBDIR, DOMAIN, PLATFORMS, STARTUP

LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class WebastoRuntimeData:
    """Runtime data for the Webasto config entry."""

    coordinator: WebastoConnectUpdateCoordinator
    update_listener: Callable[[], None]


WebastoConfigEntry: TypeAlias = ConfigEntry[WebastoRuntimeData]


async def async_setup_entry(hass: HomeAssistant, entry: WebastoConfigEntry) -> bool:
    """Set up cloud API connector from a config entry."""
    coordinator = await _async_setup(hass, entry)
    update_listener = entry.add_update_listener(async_reload_entry)
    entry.runtime_data = WebastoRuntimeData(
        coordinator=coordinator,
        update_listener=update_listener,
    )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


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

        if heater_name.lower() not in str(entity_entry.suggested_object_id):
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


async def _async_setup(
    hass: HomeAssistant, entry: WebastoConfigEntry
) -> WebastoConnectUpdateCoordinator:
    """Set up the integration using a config entry."""
    integration = await async_get_integration(hass, DOMAIN)
    LOGGER.info(
        STARTUP,
        integration.version,
    )
    LOGGER.debug(
        "Checking Webasto Connect Card installation status for /local/webastoconnect/%s",
        CARD_FILENAME,
    )
    installed, card_version, card_hash = await hass.async_add_executor_job(
        ensure_card_installed,
        Path(integration.file_path),
        Path(hass.config.path("www")),
    )
    if installed:
        LOGGER.info(
            "Installed Webasto Connect Card v%s at /local/webastoconnect/%s",
            card_version,
            CARD_FILENAME,
        )
    elif card_version is None:
        LOGGER.warning(
            "Webasto Connect Card assets not found in integration package; skipping install"
        )
    else:
        LOGGER.debug(
            "Webasto Connect Card already up to date (v%s) at /local/webastoconnect/%s",
            card_version,
            CARD_FILENAME,
        )
    await _async_ensure_lovelace_card_resource(hass, card_hash)

    coordinator = WebastoConnectUpdateCoordinator(hass, entry)
    try:
        await coordinator.cloud.connect()
        LOGGER.debug(
            "Connected to Webasto API for %s",
            entry.options.get(CONF_EMAIL, entry.data.get(CONF_EMAIL)),
        )
    except UnauthorizedException:
        raise ConfigEntryAuthFailed("Invalid email or password specified") from None
    except InvalidRequestException:
        raise ConfigEntryNotReady("Error connecting to the API - try again later")

    if coordinator.cloud.devices:
        # connect() already hydrated device state, avoid an immediate duplicate update call.
        coordinator.async_set_updated_data(None)
    else:
        await coordinator.async_config_entry_first_refresh()

    for id, device in coordinator.cloud.devices.items():
        LOGGER.debug("Found device: %s", device.name)
        # Migrate unique IDs
        await _async_migrate_unique_ids(hass, id, device.name, entry)

    return coordinator


async def _async_ensure_lovelace_card_resource(
    hass: HomeAssistant, card_hash: str | None
) -> None:
    """Ensure the Webasto Connect card resource exists in Lovelace storage mode."""
    resource_base_url = f"/local/{CARD_WWW_SUBDIR}/{CARD_FILENAME}"
    resource_url = (
        f"{resource_base_url}?v={card_hash}"
        if card_hash
        else resource_base_url
    )

    if (lovelace_data := hass.data.get(LOVELACE_DATA)) is None:
        LOGGER.debug(
            "Lovelace not loaded yet; cannot auto-register resource %s", resource_url
        )
        return

    if lovelace_data.resource_mode != MODE_STORAGE:
        LOGGER.debug(
            "Lovelace resource mode is '%s'; skipping auto-registration of %s",
            lovelace_data.resource_mode,
            resource_url,
        )
        return

    resources = lovelace_data.resources
    for resource in resources.async_items() or []:
        existing_url = resource.get(CONF_URL) or ""
        existing_base_url = existing_url.split("?", 1)[0]
        if existing_base_url != resource_base_url:
            continue

        update_data: dict[str, str] = {}
        if resource.get(CONF_URL) != resource_url:
            update_data[CONF_URL] = resource_url
        if resource.get(CONF_TYPE) != "module":
            update_data[CONF_RESOURCE_TYPE_WS] = "module"

        if update_data:
            await resources.async_update_item(resource["id"], update_data)
            LOGGER.info("Updated Lovelace resource to %s", resource_url)
        else:
            LOGGER.debug("Lovelace resource already present for %s", resource_url)
        return

    await resources.async_create_item(
        {CONF_URL: resource_url, CONF_RESOURCE_TYPE_WS: "module"}
    )
    LOGGER.info("Created Lovelace resource for %s", resource_url)


async def async_unload_entry(hass: HomeAssistant, entry: WebastoConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        entry.runtime_data.update_listener()
    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: WebastoConfigEntry) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
