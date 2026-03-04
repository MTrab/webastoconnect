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

from .const import DOMAIN

SCAN_INTERVAL = timedelta(seconds=30)
UNAUTHORIZED_RETRY_AFTER = 5
MAX_CONSECUTIVE_UNAUTHORIZED = 3
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
        self._consecutive_unauthorized = 0
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
            self._consecutive_unauthorized = 0
        except UnauthorizedException as err:
            self._consecutive_unauthorized += 1
            if self._consecutive_unauthorized >= MAX_CONSECUTIVE_UNAUTHORIZED:
                LOGGER.warning(
                    "Received %s consecutive unauthorized responses, validating credentials before reauth",
                    self._consecutive_unauthorized,
                )
                try:
                    await self.async_execute_cloud_call(self.cloud.connect)
                except UnauthorizedException as verify_err:
                    raise ConfigEntryAuthFailed(
                        "Authentication with Webasto failed"
                    ) from verify_err
                except InvalidRequestException as verify_err:
                    self._consecutive_unauthorized = 0
                    raise UpdateFailed(
                        f"Unable to verify authentication state: {verify_err}"
                    ) from verify_err
                except Exception as verify_err:
                    self._consecutive_unauthorized = 0
                    raise UpdateFailed(
                        f"Temporary failure while verifying authentication state: {verify_err}",
                        retry_after=300,
                    ) from verify_err

                self._consecutive_unauthorized = 0
                return None

            raise UpdateFailed(
                "Received unauthorized from Webasto API, retrying shortly",
                retry_after=UNAUTHORIZED_RETRY_AFTER,
            ) from err
        except InvalidRequestException as err:
            self._consecutive_unauthorized = 0
            raise UpdateFailed(f"Webasto API request failed: {err}") from err
        except Exception as err:
            self._consecutive_unauthorized = 0
            raise UpdateFailed(
                f"Unexpected update failure: {err}",
                retry_after=300,
            ) from err
