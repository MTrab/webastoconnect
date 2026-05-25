"""Add Webasto ThermoConnect support to Home Assistant."""

from collections.abc import Callable
from dataclasses import dataclass
import logging
from pathlib import Path
from typing import Any, TypeAlias

from homeassistant.components.lovelace.const import (
    CONF_RESOURCE_TYPE_WS,
    LOVELACE_DATA,
    MODE_STORAGE,
)
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.const import CONF_EMAIL, CONF_TYPE, CONF_URL
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryError,
    ConfigEntryNotReady,
)
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import issue_registry as ir
from homeassistant.loader import async_get_integration
from homeassistant.util import slugify as util_slugify
from pywebasto.enums import Request
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

try:
    from pywebasto.exceptions import (
        ForbiddenException,
        InvalidResponseException,
        TooManyRequestsException,
    )
except ImportError:
    ForbiddenException = InvalidRequestException
    InvalidResponseException = InvalidRequestException
    TooManyRequestsException = InvalidRequestException

from .api import WebastoConnectUpdateCoordinator
from .base import webasto_device_name
from .card_install import ensure_card_installed
from .const import CARD_FILENAME, CARD_WWW_SUBDIR, DOMAIN, PLATFORMS, STARTUP
from .services import async_register_services, async_unregister_services

LOGGER = logging.getLogger(__name__)
PENDING_APPROVAL_ISSUE_ID = "pending_approval"


@dataclass(slots=True)
class WebastoRuntimeData:
    """Runtime data for the Webasto config entry."""

    coordinator: WebastoConnectUpdateCoordinator
    update_listener: Callable[[], None]


WebastoConfigEntry: TypeAlias = ConfigEntry[WebastoRuntimeData]


async def async_setup_entry(hass: HomeAssistant, entry: WebastoConfigEntry) -> bool:
    """Set up cloud API connector from a config entry."""
    coordinator = await _async_setup(hass, entry)
    async_register_services(hass)
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


async def _async_update_device_registry_name(
    hass: HomeAssistant,
    device_id: int,
    device_name: str,
) -> None:
    """Update the device registry name."""
    device_registry = dr.async_get(hass)
    device_entry = device_registry.async_get_device({(DOMAIN, str(device_id))})
    if device_entry is None or device_entry.name_by_user is not None:
        return
    if device_entry.name == device_name:
        return

    device_registry.async_update_device(device_entry.id, name=device_name)


def _device_names_from_webapi_data(data: dict[str, Any]) -> dict[str, str]:
    """Return device names from webapi data."""
    names = {}
    if data.get("id") and data.get("alias"):
        names[str(data["id"])] = str(data["alias"])

    for device in data.get("account_info", {}).get("devices", []):
        if isinstance(device, dict):
            device_id = (
                device.get("id") or device.get("device_id") or device.get("dev_id")
            )
            device_name = device.get("name") or device.get("alias")
        else:
            device_id = device[0] if len(device) > 0 else None
            device_name = device[1] if len(device) > 1 else None
        if device_id and device_name:
            names[str(device_id)] = str(device_name)

    return names


async def _async_webapi_device_names(
    coordinator: WebastoConnectUpdateCoordinator,
) -> dict[str, str]:
    """Fetch device names from webapi when available."""
    if not coordinator.cloud.uses_webapi_session:
        return {}

    try:
        data = await coordinator.cloud._call(Request.GET_DATA_NOPOLL)  # noqa: SLF001
    except (
        InvalidRequestException,
        ForbiddenException,
        InvalidResponseException,
    ) as err:
        LOGGER.debug("Could not fetch Webasto webapi device names: %s", err)
        return {}

    if not isinstance(data, dict):
        return {}

    return _device_names_from_webapi_data(data)


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

    coordinator = WebastoConnectUpdateCoordinator(hass, entry, integration.version)
    try:
        await coordinator.cloud.connect()
        LOGGER.debug(
            "Connected to Webasto API for %s",
            entry.options.get(CONF_EMAIL, entry.data.get(CONF_EMAIL)),
        )
    except UnauthorizedException:
        await coordinator.cloud.close()
        raise ConfigEntryAuthFailed("Invalid email or password specified") from None
    except (InvalidRequestException, ForbiddenException) as err:
        await coordinator.cloud.close()
        raise ConfigEntryError(f"Webasto API rejected setup request: {err}") from err
    except InvalidResponseException as err:
        await coordinator.cloud.close()
        raise ConfigEntryNotReady(
            f"Error connecting to the API - try again later: {err}"
        ) from err
    except TooManyRequestsException as err:
        await coordinator.cloud.close()
        raise ConfigEntryError(
            f"Rate limited - reload the integration later: {err}"
        ) from err

    webapi_device_names = await _async_webapi_device_names(coordinator)
    coordinator.device_names = webapi_device_names

    pending_devices = [
        device
        for device in coordinator.cloud.devices.values()
        if getattr(device, "pending_approval", False)
    ]
    if pending_devices:
        devices = ", ".join(
            webasto_device_name(
                device,
                webapi_device_names.get(str(device.device_id)),
            )
            for device in pending_devices
        )
        ir.async_create_issue(
            hass,
            DOMAIN,
            PENDING_APPROVAL_ISSUE_ID,
            data={"entry_id": entry.entry_id},
            is_fixable=True,
            is_persistent=True,
            severity=ir.IssueSeverity.WARNING,
            translation_key="pending_approval",
            translation_placeholders={"devices": devices},
        )
        await coordinator.cloud.close()
        raise ConfigEntryError(
            "Webasto device association is pending approval in the ThermoConnect app"
        )

    ir.async_delete_issue(hass, DOMAIN, PENDING_APPROVAL_ISSUE_ID)

    if coordinator.cloud.devices:
        # connect() already hydrated device state, avoid an immediate duplicate update call.
        coordinator.async_set_updated_data(None)
    else:
        await coordinator.async_config_entry_first_refresh()

    for id, device in coordinator.cloud.devices.items():
        device_name = webasto_device_name(device, webapi_device_names.get(str(id)))
        LOGGER.debug("Found device: %s", device_name)
        await _async_update_device_registry_name(hass, id, device_name)
        # Migrate unique IDs
        await _async_migrate_unique_ids(hass, id, device_name, entry)

    return coordinator


async def _async_ensure_lovelace_card_resource(
    hass: HomeAssistant, card_hash: str | None
) -> None:
    """Ensure the Webasto Connect card resource exists in Lovelace storage mode."""
    resource_base_url = f"/local/{CARD_WWW_SUBDIR}/{CARD_FILENAME}"
    resource_url = (
        f"{resource_base_url}?v={card_hash}" if card_hash else resource_base_url
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
        await entry.runtime_data.coordinator.cloud.close()
        entry.runtime_data.update_listener()
        loaded_entries = [
            config_entry
            for config_entry in hass.config_entries.async_entries(DOMAIN)
            if config_entry.state is ConfigEntryState.LOADED
            and config_entry.entry_id != entry.entry_id
        ]
        if not loaded_entries:
            async_unregister_services(hass)
    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: WebastoConfigEntry) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
