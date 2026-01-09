"""Config flow for setting up the integration."""

import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_EMAIL, CONF_PASSWORD
from homeassistant.core import callback
from homeassistant.helpers.event import async_call_later
from pywebasto import WebastoConnect
from pywebasto.exceptions import UnauthorizedException

from . import async_setup_entry, async_unload_entry
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

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ):
        """Get the options flow for this handler."""
        return WebastoConnectOptionsFlow()

    async def async_step_user(self, user_input: Any | None = None):
        """Handle the initial config flow step."""
        errors = {}

        if user_input is not None:
            if any(
                entry.data[CONF_EMAIL] == user_input[CONF_EMAIL]
                for entry in self._async_current_entries()
            ):
                return self.async_abort(reason="already_configured")

            try:
                webasto = WebastoConnect(
                    user_input[CONF_EMAIL], user_input[CONF_PASSWORD]
                )
                await webasto.connect()
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

    async def async_step_reauth(
        self, entry_data: dict[str, Any]
    ) -> config_entries.ConfigFlowResult:
        """Handle reauthorization if credentials are no longer valid."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Dialog that informs the user that reauthorization is required."""
        reauth_entry = self._get_reauth_entry()
        errors = {}

        if user_input is not None:
            try:
                webasto = WebastoConnect(
                    user_input[CONF_EMAIL], user_input[CONF_PASSWORD]
                )
                await webasto.connect()
                LOGGER.debug("Re-authorization OK")
            except UnauthorizedException:
                LOGGER.debug("Re-authorization ERROR")
                errors["base"] = "invalid_auth"

            if "base" not in errors:
                self._async_abort_entries_match({CONF_EMAIL: user_input[CONF_EMAIL]})
                return self.async_update_reload_and_abort(
                    reauth_entry,
                    data_updates={},
                    options=user_input,
                )

        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_EMAIL,
                        default=reauth_entry.options.get(
                            CONF_EMAIL, reauth_entry.data.get(CONF_EMAIL)
                        ),
                    ): str,
                    vol.Required(CONF_PASSWORD): str,
                }
            ),
            errors=errors,
        )


class WebastoConnectOptionsFlow(config_entries.OptionsFlow):
    """Handle Webasto Connect options."""

    async def _do_update(
        self, *args, **kwargs  # pylint: disable=unused-argument
    ) -> None:
        """Update after settings change."""
        await async_unload_entry(self.hass, self.config_entry)
        await async_setup_entry(self.hass, self.config_entry)

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Manage the Webasto Connect options."""
        errors = {}

        if user_input is not None:
            try:
                webasto = WebastoConnect(
                    user_input[CONF_EMAIL], user_input[CONF_PASSWORD]
                )
                await webasto.connect()
                LOGGER.debug("Authorization OK")
            except UnauthorizedException:
                LOGGER.debug("Authorization ERROR")
                errors["base"] = "invalid_auth"

            if "base" not in errors:
                async_call_later(self.hass, 2, self._do_update)
                return self.async_create_entry(
                    title=user_input[CONF_EMAIL], data=user_input
                )

        data_schema = vol.Schema(
            {
                vol.Required(
                    CONF_EMAIL,
                    default=self.config_entry.options.get(
                        CONF_EMAIL, self.config_entry.data.get(CONF_EMAIL)
                    ),
                ): str,
                vol.Required(
                    CONF_PASSWORD,
                    default=self.config_entry.options.get(
                        CONF_PASSWORD, self.config_entry.data.get(CONF_PASSWORD)
                    ),
                ): str,
            }
        )
        return self.async_show_form(
            step_id="init",
            data_schema=data_schema,
            errors=errors,
        )
