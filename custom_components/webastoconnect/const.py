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

PLATFORMS = ["binary_sensor", "switch", "sensor", "device_tracker", "number"]

NEW_DATA = "webasto_signal"

ATTR_COORDINATOR = "updatecoordinator"
ATTR_SPEED = "speed"
ATTR_DIRECTION = "direction"