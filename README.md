[![Current Release](https://img.shields.io/github/release/mtrab/webastoconnect/all.svg?style=plastic)](https://github.com/mtrab/webastoconnect/releases) [![Github All Releases](https://img.shields.io/github/downloads/mtrab/webastoconnect/total.svg?style=plastic)](https://github.com/mtrab/webastoconnect/releases) [![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=plastic)](https://github.com/hacs/integration) [![Lokalize translation](https://img.shields.io/static/v1?label=Help%20translate&message=using%20Lokalize&color=green&style=plastic)](https://app.lokalise.com/public/25546617659fd91f4f8358.30009801/)

<a href="https://www.buymeacoffee.com/mtrab" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

This module provides a way of integrating with Webasto ThermoConnect devices.

# Please note
Webasto <b>DOES NOT</b> provide any public API or documentation of such, so I cannot provide any guarantees that this will continue to work for all eternity.

# Table of Content

**[Installation](#installation)**<br/>
**[Setup](#setup)**<br/>

# Installation:

### Option 1 (easy) - HACS:

- Ensure that HACS is installed.
- Search for and install the "Webasto Connect" integration.
- Restart Home Assistant.

### Option 2 - Manual installation:

- Download the latest release.
- Unpack the release and copy the `custom_components/webastoconnect` directory into the `custom_components` directory of your Home Assistant installation.
- Restart Home Assistant.

# Setup

My Home Assistant shortcut:<br/>
[![](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=webastoconnect)

Or go to Home Assistant > Settings > Integrations

Add "Webasto Connect (ThermoConnect)" integration *(If it doesn't show, try CTRL+F5 to force a refresh of the page)*

Enter your Webasto account email and password
