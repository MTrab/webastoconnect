"""API connector class."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, TypeVar
from collections.abc import Awaitable, Callable

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from pywebasto import WebastoConnect
from pywebasto.exceptions import InvalidRequestException, UnauthorizedException

try:
    from pywebasto.exceptions import ForbiddenException, InvalidResponseException
except ImportError:
    ForbiddenException = InvalidRequestException
    InvalidResponseException = InvalidRequestException

from .const import DOMAIN

SCAN_INTERVAL = timedelta(seconds=30)
LOGGER = logging.getLogger(__name__)
_T = TypeVar("_T")


class WebastoConnector:
    """Webasto Connector."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize the connector."""
        self.hass = hass
        self.cloud: WebastoConnect = WebastoConnect(
            entry.options.get(CONF_EMAIL, entry.data.get(CONF_EMAIL)),
            entry.options.get(CONF_PASSWORD, entry.data.get(CONF_PASSWORD)),
        )


class WebastoConnectUpdateCoordinator(DataUpdateCoordinator[None]):
    """webasto Connect data update coordinator."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
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
        self.cloud: WebastoConnect = WebastoConnect(
            entry.options.get(CONF_EMAIL, entry.data.get(CONF_EMAIL)),
            entry.options.get(CONF_PASSWORD, entry.data.get(CONF_PASSWORD)),
        )
        self._cloud_operation_lock = asyncio.Lock()

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
            raise ConfigEntryAuthFailed(
                "Authentication with Webasto failed"
            ) from err
        except InvalidRequestException as err:
            raise UpdateFailed(f"Webasto API request failed: {err}") from err
        except (ForbiddenException, InvalidResponseException) as err:
            raise UpdateFailed(
                f"Webasto API temporary failure: {err}",
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
