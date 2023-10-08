"""Exceptions used in this module."""


class UnauthorizedException(Exception):
    """User is unauthorized."""


class InvalidRequestException(Exception):
    """Something went wrong with the request."""
