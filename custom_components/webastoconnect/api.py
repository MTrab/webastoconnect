"""API connector class."""

import logging
from datetime import datetime, timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from pywebasto import WebastoConnect

from .const import DOMAIN

SCAN_INTERVAL = timedelta(seconds=30)
LOGGER = logging.getLogger(__name__)


class WebastoConnector:
    """Webasto Connector."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialization of the connector."""
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

    async def _async_update_data(self) -> datetime | None:
        """Handle data update request from the coordinator."""
        LOGGER.debug("Data update called")
        try:
            await self.hass.async_add_executor_job(self.cloud.update)
        except Exception as ex:
            raise Exception(  # pylint: disable=broad-exception-raised
                f"Failed communicating with the API: {ex}"
            ) from ex
