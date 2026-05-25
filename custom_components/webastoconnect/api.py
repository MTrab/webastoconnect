"""API connector class."""

import asyncio
from collections.abc import Awaitable, Callable
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, TypeVar

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from pywebasto import WebastoConnect
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

from .const import DOMAIN

SCAN_INTERVAL = timedelta(seconds=60)
LOGGER = logging.getLogger(__name__)
_T = TypeVar("_T")


def _credential_store_path(hass: HomeAssistant, entry: ConfigEntry) -> str:
    """Return the pywebasto app credential store path for a config entry."""
    return hass.config.path(".storage", f"webasto_{entry.entry_id}.json")


def _load_credentials(path: Path) -> dict[str, str] | None:
    """Load pywebasto app credentials."""
    if not path.exists():
        return None

    with path.open(encoding="utf-8") as credential_file:
        return json.load(credential_file)


def _save_credentials(path: Path, credentials: Any) -> None:
    """Save pywebasto app credentials."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as credential_file:
        json.dump(
            {
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
            },
            credential_file,
            indent=2,
        )
        credential_file.write("\n")


def _credential_callbacks(
    hass: HomeAssistant, entry: ConfigEntry
) -> tuple[
    Callable[[], Awaitable[dict[str, str] | None]], Callable[[Any], Awaitable[None]]
]:
    """Return pywebasto credential callbacks."""
    path = Path(_credential_store_path(hass, entry))

    async def credential_load() -> dict[str, str] | None:
        return await hass.async_add_executor_job(_load_credentials, path)

    async def credential_save(credentials: Any) -> None:
        await hass.async_add_executor_job(_save_credentials, path, credentials)

    return credential_load, credential_save


class WebastoConnectUpdateCoordinator(DataUpdateCoordinator[None]):
    """webasto Connect data update coordinator."""

    def __init__(
        self, hass: HomeAssistant, entry: ConfigEntry, version: str = "unknown"
    ) -> None:
        """Initialize the connection."""
        DataUpdateCoordinator.__init__(
            self,
            hass=hass,
            name=DOMAIN,
            logger=LOGGER,
            update_interval=SCAN_INTERVAL,
        )

        self.hass = hass
        self.config_entry = entry
        credential_load, credential_save = _credential_callbacks(hass, entry)
        self.cloud: WebastoConnect = WebastoConnect(
            username=entry.options.get(CONF_EMAIL, entry.data.get(CONF_EMAIL)),
            password=entry.options.get(CONF_PASSWORD, entry.data.get(CONF_PASSWORD)),
            credential_load=credential_load,
            credential_save=credential_save,
            client_info=f"HomeAssistant-Webasto {version} {int(datetime.now().timestamp())}",
        )
        self._cloud_operation_lock = asyncio.Lock()
        self.device_names: dict[str, str] = {}

    async def async_execute_cloud_call(
        self,
        cloud_call: Callable[..., Awaitable[_T]],
        *args: Any,
        **kwargs: Any,
    ) -> _T:
        """Serialize cloud operations to avoid device context races."""
        async with self._cloud_operation_lock:
            return await cloud_call(*args, **kwargs)

    async def _async_update_data(self) -> datetime | None:
        """Handle data update request from the coordinator."""
        LOGGER.debug("Data update called")
        try:
            await self.async_execute_cloud_call(self.cloud.update)
        except UnauthorizedException as err:
            raise ConfigEntryAuthFailed("Authentication with Webasto failed") from err
        except InvalidRequestException as err:
            raise UpdateFailed(f"Webasto API request failed: {err}") from err
        except (ForbiddenException, InvalidResponseException) as err:
            raise UpdateFailed(
                f"Webasto API temporary failure: {err}",
                retry_after=300,
            ) from err
        except TooManyRequestsException as err:
            raise UpdateFailed(
                f"Webasto API rate limited: {err}",
                retry_after=300,
            ) from err
        except Exception as err:
            LOGGER.exception(
                "Unexpected error during Webasto update (%s)",
                type(err).__name__,
            )
            raise UpdateFailed(
                f"Unexpected update failure ({type(err).__name__}): {err}",
                retry_after=300,
            ) from err
