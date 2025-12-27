"""Config flow for setting up the integration."""

import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from pywebasto import WebastoConnect
from pywebasto.exceptions import UnauthorizedException

from .const import DOMAIN

LOGGER = logging.getLogger(__name__)

CONF_SCHEME = vol.Schema(
    {
        vol.Required(CONF_EMAIL): str,
        vol.Required(CONF_PASSWORD): str,
    }
)


class WebastoConnectConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Webasto Connect."""

    VERSION = 1
    CONNECTION_CLASS = config_entries.CONN_CLASS_CLOUD_POLL

    async def async_step_user(self, user_input: Any | None = None):
        """Handle the initial config flow step."""
        errors = {}

        if user_input is not None:
            try:
                webasto = WebastoConnect(
                    user_input[CONF_EMAIL], user_input[CONF_PASSWORD]
                )
                await self.hass.async_add_executor_job(webasto.connect)
                LOGGER.debug("Authorization OK")
            except UnauthorizedException:
                LOGGER.debug("Authorization ERROR")
                errors["base"] = "invalid_auth"

            if "base" not in errors:
                await self.async_set_unique_id(f"{user_input[CONF_EMAIL]}")

                return self.async_create_entry(
                    title=user_input[CONF_EMAIL],
                    data=user_input,
                    description=f"Webasto ThermoConnect - {user_input[CONF_EMAIL]}",
                )

        LOGGER.debug("Showing configuration form")
        return self.async_show_form(
            step_id="user", data_schema=CONF_SCHEME, errors=errors
        )
