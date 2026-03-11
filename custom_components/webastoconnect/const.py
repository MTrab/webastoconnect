"""Constants for use with the Webasto Connect integration."""

# Startup banner
STARTUP = """
-------------------------------------------------------------------
Webasto Connect (ThermoConnect)

Version: %s
This is a custom integration
If you have any issues with this you need to open an issue here:
https://github.com/mtrab/webastoconnect/issues
-------------------------------------------------------------------
"""

DOMAIN = "webastoconnect"

PLATFORMS = ["sensor", "switch", "device_tracker", "binary_sensor", "number"]
NEW_DATA = "webasto_signal"

SERVICE_CREATE_TIMER = "create_timer"
SERVICE_UPDATE_TIMER = "update_timer"
SERVICE_DELETE_TIMER = "delete_timer"
