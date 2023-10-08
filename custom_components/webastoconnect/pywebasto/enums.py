"""Enum classes."""
from enum import Enum


class Request(Enum):
    """Requests options."""

    LOGIN = "/login"
    COMMAND = "/command"
    GET_DATA = "/get_service_data?poll=true"
    GET_DATA_NOPOLL = "/get_service_data?poll=false"
    POST_SETTING = "/post_settings"
    GET_SETTINGS = "/get_settings"


class Outputs(Enum):
    """Valid Webasto outputs."""

    HEATER = "OUTH"
    VENTILATION = "OUTV"
    AUX = "OUTA"
