import { localize } from "./localize/localize.js";

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function entityDeviceClass(entry) {
  return entry?.device_class || entry?.original_device_class || null;
}

class WebastoConnectCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("webasto-connect-card-editor");
  }

  static getStubConfig() {
    return {
      device_id: "",
    };
  }

  setConfig(config) {
    this._config = {
      connected_entity: config?.connected_entity,
      ventilation_mode_entity: config?.ventilation_mode_entity,
      next_timer_entity: config?.next_timer_entity,
      end_time_entity: config?.end_time_entity,
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    void this._loadRegistryData();
    this._render();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this._render();
  }

  _getState(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  async _loadRegistryData() {
    if (!this._hass || this._registryDataLoaded || this._registryDataLoading) {
      return;
    }

    this._registryDataLoading = true;
    try {
      const [entityRegistry, deviceRegistry] = await Promise.all([
        this._hass.callWS({ type: "config/entity_registry/list" }),
        this._hass.callWS({ type: "config/device_registry/list" }),
      ]);
      this._entityRegistry = Array.isArray(entityRegistry) ? entityRegistry : [];
      this._deviceRegistry = Array.isArray(deviceRegistry) ? deviceRegistry : [];
      this._registryDataLoaded = true;
    } catch (_err) {
      this._entityRegistry = [];
      this._deviceRegistry = [];
    } finally {
      this._registryDataLoading = false;
      this._render();
    }
  }

  _entriesForSelectedDevice() {
    const deviceId = this._config?.device_id;
    if (!deviceId || !Array.isArray(this._entityRegistry)) {
      return [];
    }

    return this._entityRegistry.filter(
      (entry) =>
        entry?.platform === "webastoconnect" &&
        entry?.device_id === deviceId &&
        !entry?.hidden_by
    );
  }

  _pickEntry(entries, predicate) {
    return entries.find((entry) => predicate(entry))?.entity_id;
  }

  _resolveEntities() {
    const entries = this._entriesForSelectedDevice();
    const overrides = this._config || {};

    return {
      main_output_entity:
        overrides.main_output_entity ||
        this._pickEntry(
          entries,
          (entry) =>
            entry.entity_id?.startsWith("switch.") &&
            entry.entity_category == null &&
            entry.original_name !== "AUX1" &&
            entry.original_name !== "AUX2"
        ),
      ventilation_mode_entity:
        overrides.ventilation_mode_entity ||
        this._pickEntry(
          entries,
          (entry) =>
            entry.entity_id?.startsWith("switch.") &&
            entry.original_name === "Ventilation Mode"
        ),
      end_time_entity:
        overrides.end_time_entity ||
        this._pickEntry(
          entries,
          (entry) =>
            entry.entity_id?.startsWith("sensor.") &&
            entityDeviceClass(entry) === "timestamp" &&
            entry.original_name !== "Next start"
        ),
      temperature_entity:
        overrides.temperature_entity ||
        this._pickEntry(
          entries,
          (entry) =>
            entry.entity_id?.startsWith("sensor.") && (
              entityDeviceClass(entry) === "temperature" ||
              entry.original_name === "Temperature"
            )
        ),
      battery_entity:
        overrides.battery_entity ||
        this._pickEntry(
          entries,
          (entry) =>
            entry.entity_id?.startsWith("sensor.") && (
              entityDeviceClass(entry) === "voltage" ||
              entry.original_name === "Battery"
            )
        ),
      connected_entity:
        overrides.connected_entity ||
        this._pickEntry(
          entries,
          (entry) =>
            entry.entity_id?.startsWith("binary_sensor.") &&
            entry.original_name === "Connected"
        ),
      next_timer_entity:
        overrides.next_timer_entity ||
        this._pickEntry(
          entries,
          (entry) =>
            entry.entity_id?.startsWith("sensor.") &&
            entry.original_name === "Next start"
        ),
      location_entity:
        overrides.location_entity ||
        this._pickEntry(
          entries,
          (entry) => entry.entity_id?.startsWith("device_tracker.")
        ),
    };
  }

  _isConnected(entity) {
    if (!entity) {
      return true;
    }
    if (entity.state === "off") {
      return false;
    }
    return true;
  }

  _parseEndDate(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    // Accept both ISO datetime and Unix timestamp (seconds or milliseconds).
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      const millis = numeric < 1e12 ? numeric * 1000 : numeric;
      const tsDate = new Date(millis);
      return Number.isNaN(tsDate.getTime()) ? null : tsDate;
    }

    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  _computeLabel(mainEntity, endEntity) {
    if (!mainEntity || mainEntity.state !== "on") {
      return localize(this._hass, "card.ui.inactive");
    }

    if (!endEntity || !endEntity.state || endEntity.state === "unknown" || endEntity.state === "unavailable") {
      return localize(this._hass, "card.ui.active");
    }

    const end = this._parseEndDate(endEntity.state);
    if (!end) {
      return localize(this._hass, "card.ui.active");
    }

    const leftMinutes = Math.ceil((end.getTime() - Date.now()) / 60000);
    if (leftMinutes <= 0) {
      return localize(this._hass, "card.ui.ending_now");
    }
    const hours = Math.floor(leftMinutes / 60);
    const minutes = leftMinutes % 60;
    return `${hours}:${String(minutes).padStart(2, "0")} ${localize(this._hass, "card.ui.left")}`;
  }

  _computeOutputName(mainOutputState) {
    const friendlyName = mainOutputState?.attributes?.friendly_name;
    if (typeof friendlyName === "string" && friendlyName.trim() !== "") {
      return friendlyName;
    }
    return localize(this._hass, "card.ui.output");
  }

  _toggleMainOutput() {
    const entityId = this._resolveEntities().main_output_entity;
    if (!this._hass || !entityId || !this._hass.states?.[entityId]) {
      console.warn(
        "[webasto-connect-card] Missing or unavailable main_output_entity:",
        entityId
      );
      return;
    }
    this._hass.callService("homeassistant", "toggle", {
      entity_id: entityId,
    });
  }

  _stateWithUnit(entity) {
    if (!entity) {
      return "--";
    }
    const state = entity.state;
    if (state === "unknown" || state === "unavailable") {
      return "--";
    }
    const unit = entity.attributes?.unit_of_measurement;
    return unit ? `${state} ${unit}` : String(state);
  }

  _locationText(entity) {
    if (!entity) {
      return "--";
    }
    const state = String(entity.state ?? "");
    if (state !== "" && state !== "unknown" && state !== "unavailable" && state !== "not_home") {
      return state;
    }

    const lat = entity.attributes?.latitude;
    const lon = entity.attributes?.longitude;
    if (typeof lat === "number" && typeof lon === "number") {
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }

    return "--";
  }

  _isMapEnabled(locationEntityId, locationEntity) {
    if (!locationEntityId || !locationEntityId.startsWith("device_tracker.")) {
      return false;
    }
    if (!locationEntity) {
      return false;
    }
    return locationEntity.state !== "unknown" && locationEntity.state !== "unavailable";
  }

  _openMapPopup() {
    const entityId = this._resolveEntities().location_entity;
    const location = this._getState(entityId);
    if (!this._isMapEnabled(entityId, location)) {
      return;
    }
    this._mapPopupOpen = true;
    this._render();
  }

  _closeMapPopup() {
    this._mapPopupOpen = false;
    this._render();
  }

  _openTimersPopup() {
    this._timersPopupOpen = true;
    this._render();
  }

  _closeTimersPopup() {
    this._timersPopupOpen = false;
    this._render();
  }

  _resolveMode(ventilationEntity) {
    if (!ventilationEntity) {
      return null;
    }
    if (
      ventilationEntity.state === "unknown" ||
      ventilationEntity.state === "unavailable"
    ) {
      return null;
    }
    return ventilationEntity.state === "on" ? "ventilation" : "heating";
  }

  _modeLabel(mode) {
    if (mode === "ventilation") {
      return localize(this._hass, "card.ui.ventilation");
    }
    if (mode === "heating") {
      return localize(this._hass, "card.ui.heating");
    }
    return localize(this._hass, "card.ui.mode_unavailable");
  }

  _isModeSelectable(entityId) {
    return Boolean(entityId && this._getState(entityId));
  }

  _openModePopup() {
    const entityId = this._resolveEntities().ventilation_mode_entity;
    const ventilationMode = this._getState(entityId);
    if (!this._isModeSelectable(entityId)) {
      return;
    }

    this._modeDraft = this._resolveMode(ventilationMode) || "heating";
    this._modePopupOpen = true;
    this._render();
  }

  _closeModePopup() {
    this._modePopupOpen = false;
    this._modeDraft = undefined;
    this._render();
  }

  _selectModeDraft(mode) {
    this._modeDraft = mode;
    this._render();
  }

  _saveModeSelection() {
    const entityId = this._resolveEntities().ventilation_mode_entity;
    if (!this._hass || !entityId || !this._modeDraft) {
      return;
    }

    const service = this._modeDraft === "ventilation" ? "turn_on" : "turn_off";
    this._hass.callService("homeassistant", service, {
      entity_id: entityId,
    });
    this._closeModePopup();
  }

  _timerItems(entity) {
    const timers = entity?.attributes?.timers;
    if (!Array.isArray(timers)) {
      return [];
    }

    return timers
      .filter((timer) => timer && typeof timer === "object")
      .map((timer, index) => ({
        ...timer,
        index,
        line_code: timer.line_code || timer.line || "OUTH",
      }));
  }

  _activeLine(ventilationMode) {
    return this._resolveMode(ventilationMode) === "ventilation" ? "OUTV" : "OUTH";
  }

  _formatTimerRepeat(timer) {
    if (!timer.repeat) {
      return localize(this._hass, "card.ui.timer_once");
    }
    return localize(this._hass, "card.ui.timer_repeating");
  }

  _canManageTimers(deviceId, isConnected) {
    return Boolean(deviceId) && isConnected;
  }

  _toggleTimerEnabled(timer) {
    const deviceId = this._config?.device_id;
    if (!this._hass || !deviceId) {
      return;
    }

    this._hass.callService("webastoconnect", "update_timer", {
      device_id: deviceId,
      timer_index: timer.index,
      enabled: !timer.enabled,
    });
  }

  _deleteTimer(timer) {
    const deviceId = this._config?.device_id;
    if (!this._hass || !deviceId) {
      return;
    }

    this._hass.callService("webastoconnect", "delete_timer", {
      device_id: deviceId,
      timer_index: timer.index,
    });
  }

  async _renderMapPopup(entityId) {
    const host = this.shadowRoot?.getElementById("map-card-host");
    if (!host || !this._hass || !entityId) {
      return;
    }

    host.innerHTML = "";
    try {
      const helpers = await window.loadCardHelpers?.();
      const mapCard = await helpers?.createCardElement?.({
        type: "map",
        entities: [entityId],
      });

      if (!mapCard) {
        host.innerHTML = `<div class="map-unavailable">${escapeAttr(localize(this._hass, "card.ui.map_unavailable"))}</div>`;
        return;
      }

      mapCard.hass = this._hass;
      mapCard.style.display = "block";
      mapCard.style.height = "360px";
      host.appendChild(mapCard);
    } catch (_err) {
      host.innerHTML = `<div class="map-unavailable">${escapeAttr(localize(this._hass, "card.ui.map_unavailable"))}</div>`;
    }
  }

  _render() {
    if (!this.shadowRoot || !this._config || !this._hass) {
      return;
    }

    const entities = this._resolveEntities();
    const main = this._getState(entities.main_output_entity);
    const end = this._getState(entities.end_time_entity);
    const temp = this._getState(entities.temperature_entity);
    const battery = this._getState(entities.battery_entity);
    const location = this._getState(entities.location_entity);
    const ventilationMode = this._getState(entities.ventilation_mode_entity);
    const connected = this._getState(entities.connected_entity);
    const nextTimer = this._getState(entities.next_timer_entity);
    const isConnected = this._isConnected(connected);
    const activeLine = this._activeLine(ventilationMode);
    const timers = this._timerItems(nextTimer).filter(
      (timer) => timer.line_code === activeLine
    );

    const isMainAvailable = Boolean(main);
    const isOn = isMainAvailable && main.state === "on";
    const ringColor = isConnected && isOn ? "#d33131" : "#c5cfdf";
    const outputName = isConnected
      ? this._computeOutputName(main)
      : localize(this._hass, "card.ui.offline_title");
    const label = isConnected
      ? (
        isMainAvailable
          ? this._computeLabel(main, end)
          : localize(this._hass, "card.ui.main_output_missing")
      )
      : localize(this._hass, "card.ui.offline_label");
    const tempText = isConnected ? this._stateWithUnit(temp) : "--";
    const batteryText = isConnected ? this._stateWithUnit(battery) : "--";
    const locationText = this._locationText(location);
    const icon =
      isConnected
        ? (
          this._config.center_icon ||
          main?.attributes?.icon ||
          "mdi:car-defrost-rear"
        )
        : "mdi:signal-off";
    const titleGeoFence = "";
    const titleMode = localize(this._hass, "card.ui.mode");
    const titleTimers = localize(this._hass, "card.ui.timers");
    const titleMap = localize(this._hass, "card.ui.map");
    const toggleLabel = localize(this._hass, "card.ui.toggle_output");
    const modeEnabled = isConnected && this._isModeSelectable(entities.ventilation_mode_entity);
    const modeClass = modeEnabled ? "mode-enabled" : "mode-disabled";
    const modeTabIndex = modeEnabled ? "0" : "-1";
    const modeAriaDisabled = modeEnabled ? "false" : "true";
    const modePopup = this._modePopupOpen && modeEnabled;
    const selectedMode = this._modeDraft || this._resolveMode(ventilationMode) || "heating";
    const saveText = localize(this._hass, "card.ui.save");
    const mapEnabled = isConnected && this._isMapEnabled(entities.location_entity, location);
    const mapClass = mapEnabled ? "map-enabled" : "map-disabled";
    const mapTabIndex = mapEnabled ? "0" : "-1";
    const mapAriaDisabled = mapEnabled ? "false" : "true";
    const mapPopup = this._mapPopupOpen && mapEnabled;
    const timersEnabled = Boolean(entities.next_timer_entity);
    const timersClass = timersEnabled ? "timers-enabled" : "timers-disabled";
    const timersTabIndex = timersEnabled ? "0" : "-1";
    const timersAriaDisabled = timersEnabled ? "false" : "true";
    const timersPopup = this._timersPopupOpen && timersEnabled;
    const canManageTimers = this._canManageTimers(this._config?.device_id, isConnected);
    const closeText = localize(this._hass, "card.ui.close");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        ha-card {
          position: relative;
          height: 440px;
          border-radius: 28px;
          background: #d3dbea;
          overflow: hidden;
          box-shadow: none;
        }
        .q {
          position: absolute;
          background: #c5cfdf;
          color: #2d4468;
          font-size: 18px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 16px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .q.tr, .q.br {
          align-items: flex-end;
          text-align: right;
        }
        .q.tr {
          justify-content: flex-start;
        }
        .q.br {
          justify-content: flex-end;
        }
        .q.bl {
          align-items: flex-start;
          justify-content: flex-end;
          text-align: left;
        }
        .q.map-enabled {
          cursor: pointer;
        }
        .q.timers-enabled {
          cursor: pointer;
        }
        .q.mode-enabled {
          cursor: pointer;
        }
        .q.timers-enabled:hover {
          background: #aebbd3;
        }
        .q.mode-enabled:hover {
          background: #aebbd3;
        }
        .q.map-enabled:hover {
          background: #aebbd3;
        }
        .q.map-disabled, .q.mode-disabled, .q.timers-disabled {
          opacity: 0.6;
        }
        .q-label {
          display: block;
        }
        .q.tl { left: 0; top: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.tr { right: 0; top: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.bl { left: 0; bottom: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.br { right: 0; bottom: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .divider-v, .divider-h {
          position: absolute;
          background: #ffffff;
          pointer-events: none;
        }
        .divider-v {
          left: calc(50% - 8px);
          top: 0;
          width: 16px;
          height: 100%;
        }
        .divider-h {
          left: 0;
          top: calc(50% - 8px);
          width: 100%;
          height: 16px;
        }
        .center-wrap {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 312px;
          height: 312px;
          border-radius: 50%;
          background: #efefef;
          box-shadow: 0 0 0 10px #ffffff;
          border: 10px solid ${ringColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          transition: border-color 150ms ease;
        }
        .center-wrap.offline {
          background: #d0d0d0;
          cursor: default;
        }
        .icon {
          color: #2a4677;
          margin-bottom: 10px;
        }
        .name {
          color: #20334d;
          font-size: 36px;
          line-height: 1.1;
          font-weight: 500;
        }
        .label {
          color: #20334d;
          font-size: 24px;
          line-height: 1.2;
          margin-top: 8px;
          text-align: center;
          max-width: 240px;
        }
        .offline-copy {
          max-width: 220px;
          text-align: center;
          color: #2d4468;
          font-size: 24px;
          line-height: 1.25;
          font-weight: 500;
          margin-bottom: 18px;
          white-space: pre-line;
        }
        .meta {
          background: #ffffff;
          border-radius: 14px;
          padding: 10px 14px;
          box-shadow: none;
        }
        .meta-row {
          display: flex;
          align-items: center;
          gap: 18px;
          color: #20334d;
          font-size: 24px;
          line-height: 1.3;
          flex-wrap: wrap;
        }
        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .meta-location {
          margin-top: 8px;
          color: #20334d;
          font-size: 22px;
          line-height: 1.3;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          word-break: break-word;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
        }
        .modal-shell {
          width: min(640px, 100%);
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid var(--divider-color, #ddd);
          color: var(--primary-text-color, #111);
          font-size: 15px;
        }
        .modal-close {
          border: 0;
          border-radius: 8px;
          padding: 6px 10px;
          background: var(--secondary-background-color, #eee);
          color: var(--primary-text-color, #111);
          cursor: pointer;
          font: inherit;
        }
        .mode-modal {
          width: min(420px, 100%);
          background: var(--card-background-color, #fff);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
        }
        .mode-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px 0;
          color: var(--primary-text-color, #111);
          font-size: 16px;
        }
        .mode-modal-body {
          padding: 12px 18px 18px;
        }
        .mode-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 8px;
        }
        .mode-option {
          border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
          border-radius: 24px;
          background: var(--secondary-background-color, #eee);
          color: var(--primary-text-color, #111);
          padding: 18px 14px;
          min-height: 148px;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          font: inherit;
          transition: transform 120ms ease, background 120ms ease, color 120ms ease;
        }
        .mode-option:hover {
          transform: translateY(-1px);
        }
        .mode-option.selected {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          border-color: var(--primary-color, #03a9f4);
        }
        .mode-option-title {
          font-size: 18px;
          font-weight: 500;
        }
        .mode-option-icon {
          align-self: flex-end;
        }
        .mode-modal-actions {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
        .mode-save {
          border: 0;
          border-radius: 14px;
          min-width: 88px;
          padding: 12px 20px;
          background: var(--secondary-background-color, #eee);
          color: var(--primary-text-color, #111);
          cursor: pointer;
          font: inherit;
          font-weight: 500;
        }
        .timers-modal-body {
          padding: 12px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timers-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .timer-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
          border-radius: 18px;
          background: var(--secondary-background-color, #eee);
          padding: 12px 14px;
        }
        .timer-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .timer-title {
          color: var(--primary-text-color, #111);
          font-size: 18px;
          font-weight: 500;
        }
        .timer-meta {
          color: var(--secondary-text-color, #666);
          font-size: 14px;
        }
        .timer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .timer-delete {
          border: 0;
          border-radius: 10px;
          padding: 8px 10px;
          background: var(--secondary-background-color, #eee);
          color: var(--primary-text-color, #111);
          cursor: pointer;
          font: inherit;
        }
        .timer-delete[disabled] {
          opacity: 0.45;
          cursor: default;
        }
        .timers-empty {
          color: var(--secondary-text-color, #666);
          font-size: 14px;
          text-align: center;
          padding: 18px 8px 8px;
        }
        .timers-note {
          color: var(--secondary-text-color, #666);
          font-size: 13px;
          text-align: center;
        }
        .map-card-host {
          height: 360px;
          background: var(--card-background-color, #fff);
        }
        .map-card-host > * {
          display: block;
        }
        .map-unavailable {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--secondary-text-color, #666);
          font-size: 14px;
          padding: 16px;
          box-sizing: border-box;
          text-align: center;
        }
      </style>
      <div class="wrapper">
        <ha-card>
          <div class="q tl">${titleGeoFence}</div>
          <div class="q tr ${modeClass}" id="mode-action" role="button" tabindex="${modeTabIndex}" aria-disabled="${modeAriaDisabled}">
            <span class="q-label">${titleMode}</span>
          </div>
          <div class="q bl ${timersClass}" id="timers-action" role="button" tabindex="${timersTabIndex}" aria-disabled="${timersAriaDisabled}">${titleTimers}</div>
          <div class="q br ${mapClass}" id="map-action" role="button" tabindex="${mapTabIndex}" aria-disabled="${mapAriaDisabled}">${titleMap}</div>
          <div class="divider-v"></div>
          <div class="divider-h"></div>
          <div class="center-wrap ${isConnected ? "" : "offline"}" id="center-toggle" role="button" tabindex="0" aria-label="${toggleLabel}">
            ${isConnected ? `
            <ha-icon class="icon" icon="${icon}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${outputName}</div>
            <div class="label">${label}</div>
            ` : `
            <div class="offline-copy">${label}</div>
            <ha-icon class="icon" icon="${icon}" style="--mdc-icon-size: 72px;"></ha-icon>
            <div class="name">${outputName}</div>
            `}
          </div>
        </ha-card>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-item"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size: 24px;"></ha-icon>${tempText}</span>
            <span class="meta-item"><ha-icon icon="mdi:car-battery" style="--mdc-icon-size: 24px;"></ha-icon>${batteryText}</span>
          </div>
          <div class="meta-location"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 24px;"></ha-icon>${locationText}</div>
        </div>
      </div>
      ${modePopup ? `
      <div class="modal-backdrop" id="mode-modal-backdrop">
        <div class="mode-modal" role="dialog" aria-modal="true" aria-label="${titleMode}">
          <div class="mode-modal-header">
            <span>${titleMode}</span>
            <button class="modal-close" id="mode-modal-close">${closeText}</button>
          </div>
          <div class="mode-modal-body">
            <div class="mode-options">
              <button class="mode-option ${selectedMode === "ventilation" ? "selected" : ""}" id="mode-option-ventilation">
                <span class="mode-option-title">${localize(this._hass, "card.ui.ventilation")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:fan" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
              <button class="mode-option ${selectedMode === "heating" ? "selected" : ""}" id="mode-option-heating">
                <span class="mode-option-title">${localize(this._hass, "card.ui.heating")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:car-defrost-rear" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
            </div>
            <div class="mode-modal-actions">
              <button class="mode-save" id="mode-save">${saveText}</button>
            </div>
          </div>
        </div>
      </div>
      ` : ""}
      ${timersPopup ? `
      <div class="modal-backdrop" id="timers-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${titleTimers}">
          <div class="modal-header">
            <span>${titleTimers}</span>
            <button class="modal-close" id="timers-modal-close">${closeText}</button>
          </div>
          <div class="timers-modal-body">
            ${timers.length ? `
            <div class="timers-list">
              ${timers.map((timer) => `
              <div class="timer-row">
                <div class="timer-main">
                  <div class="timer-title">${escapeAttr(timer.start_hhmm_utc || "--:--")}</div>
                  <div class="timer-meta">${escapeAttr(this._formatTimerRepeat(timer))} · ${timer.enabled ? escapeAttr(localize(this._hass, "card.ui.timer_enabled")) : escapeAttr(localize(this._hass, "card.ui.timer_disabled"))}</div>
                </div>
                <div class="timer-actions">
                  <ha-switch class="timer-toggle" data-timer-index="${timer.index}" ${timer.enabled ? "checked" : ""} ${canManageTimers ? "" : "disabled"}></ha-switch>
                  <button class="timer-delete" data-delete-index="${timer.index}" ${canManageTimers ? "" : "disabled"}>${escapeAttr(localize(this._hass, "card.ui.delete"))}</button>
                </div>
              </div>
              `).join("")}
            </div>
            ` : `<div class="timers-empty">${escapeAttr(localize(this._hass, "card.ui.timers_empty"))}</div>`}
            <div class="timers-note">${escapeAttr(canManageTimers ? localize(this._hass, "card.ui.timers_manage_note") : localize(this._hass, "card.ui.timers_readonly_note"))}</div>
          </div>
        </div>
      </div>
      ` : ""}
      ${mapPopup ? `
      <div class="modal-backdrop" id="map-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${titleMap}">
          <div class="modal-header">
            <span>${titleMap}</span>
            <button class="modal-close" id="map-modal-close">${closeText}</button>
          </div>
          <div class="map-card-host" id="map-card-host"></div>
        </div>
      </div>
      ` : ""}
    `;

    const center = this.shadowRoot.getElementById("center-toggle");
    if (center && isConnected) {
      center.onclick = () => this._toggleMainOutput();
      center.onkeydown = (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          this._toggleMainOutput();
        }
      };
    }

    const modeAction = this.shadowRoot.getElementById("mode-action");
    if (modeAction && modeEnabled) {
      modeAction.onclick = () => this._openModePopup();
      modeAction.onkeydown = (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          this._openModePopup();
        }
      };
    }

    const timersAction = this.shadowRoot.getElementById("timers-action");
    if (timersAction && timersEnabled) {
      timersAction.onclick = () => this._openTimersPopup();
      timersAction.onkeydown = (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          this._openTimersPopup();
        }
      };
    }

    const mapAction = this.shadowRoot.getElementById("map-action");
    if (mapAction && mapEnabled) {
      mapAction.onclick = () => this._openMapPopup();
      mapAction.onkeydown = (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          this._openMapPopup();
        }
      };
    }

    if (mapPopup) {
      void this._renderMapPopup(entities.location_entity);

      const close = this.shadowRoot.getElementById("map-modal-close");
      if (close) {
        close.onclick = () => this._closeMapPopup();
      }

      const backdrop = this.shadowRoot.getElementById("map-modal-backdrop");
      if (backdrop) {
        backdrop.onclick = (ev) => {
          if (ev.target === backdrop) {
            this._closeMapPopup();
          }
        };
      }
    }

    if (modePopup) {
      const close = this.shadowRoot.getElementById("mode-modal-close");
      if (close) {
        close.onclick = () => this._closeModePopup();
      }

      const ventilationOption = this.shadowRoot.getElementById("mode-option-ventilation");
      if (ventilationOption) {
        ventilationOption.onclick = () => this._selectModeDraft("ventilation");
      }

      const heatingOption = this.shadowRoot.getElementById("mode-option-heating");
      if (heatingOption) {
        heatingOption.onclick = () => this._selectModeDraft("heating");
      }

      const save = this.shadowRoot.getElementById("mode-save");
      if (save) {
        save.onclick = () => this._saveModeSelection();
      }

      const backdrop = this.shadowRoot.getElementById("mode-modal-backdrop");
      if (backdrop) {
        backdrop.onclick = (ev) => {
          if (ev.target === backdrop) {
            this._closeModePopup();
          }
        };
      }
    }

    if (timersPopup) {
      const close = this.shadowRoot.getElementById("timers-modal-close");
      if (close) {
        close.onclick = () => this._closeTimersPopup();
      }

      const backdrop = this.shadowRoot.getElementById("timers-modal-backdrop");
      if (backdrop) {
        backdrop.onclick = (ev) => {
          if (ev.target === backdrop) {
            this._closeTimersPopup();
          }
        };
      }

      this.shadowRoot.querySelectorAll(".timer-toggle").forEach((toggle) => {
        toggle.addEventListener("change", (ev) => {
          const index = Number(ev.currentTarget?.dataset?.timerIndex);
          const timer = timers.find((item) => item.index === index);
          if (timer) {
            this._toggleTimerEnabled(timer);
          }
        });
      });

      this.shadowRoot.querySelectorAll(".timer-delete").forEach((button) => {
        button.addEventListener("click", (ev) => {
          const index = Number(ev.currentTarget?.dataset?.deleteIndex);
          const timer = timers.find((item) => item.index === index);
          if (timer) {
            this._deleteTimer(timer);
          }
        });
      });
    }
  }

  getCardSize() {
    return 4;
  }
}

class WebastoConnectCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._suggestionsLoaded) {
      this._suggestionsLoaded = true;
      this._loadSuggestions();
    }
    this._render();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this._render();
  }

  async _loadSuggestions() {
    if (!this._hass) {
      return;
    }

    try {
      const [entityRegistry, deviceRegistry] = await Promise.all([
        this._hass.callWS({
          type: "config/entity_registry/list",
        }),
        this._hass.callWS({
          type: "config/device_registry/list",
        }),
      ]);
      const webastoEntityEntries = entityRegistry
        .filter((entry) => entry.platform === "webastoconnect" && !entry.hidden_by)
      const webastoEntities = webastoEntityEntries.map((entry) => entry.entity_id);
      const webastoDeviceIds = new Set(
        webastoEntityEntries.map((entry) => entry.device_id).filter(Boolean)
      );

      this._deviceSuggestions = deviceRegistry
        .filter((device) => webastoDeviceIds.has(device.id))
        .map((device) => ({
          id: device.id,
          name: device.name_by_user || device.name || device.id,
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
      this._entitySuggestions = [...new Set(webastoEntities)].sort();
    } catch (_err) {
      const fallback = Object.keys(this._hass.states || {}).filter((entityId) =>
        entityId.includes("webasto")
      );
      this._entitySuggestions = [...new Set(fallback)].sort();
      this._deviceSuggestions = [];
    }

    this._render();
  }

  _datalistOptions(domains) {
    const suggestions = this._entitySuggestions || [];
    return suggestions
      .filter((entityId) => domains.includes(entityId.split(".")[0]))
      .map((entityId) => `<option value="${escapeAttr(entityId)}"></option>`)
      .join("");
  }

  _handleInput(ev) {
    const field = ev.target?.dataset?.field;
    if (!field) {
      return;
    }

    const value = String(ev.target.value || "").trim();
    const next = { ...(this._config || {}) };
    if (value === "") {
      delete next[field];
    } else {
      next[field] = value;
    }

    this._config = next;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: next },
        bubbles: true,
        composed: true,
      })
    );
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    const cfg = this._config || {};
    const deviceOptions = [
      '<option value="">Select device automatically</option>',
      ...((this._deviceSuggestions || []).map(
        (device) =>
          `<option value="${escapeAttr(device.id)}"${
            cfg.device_id === device.id ? " selected" : ""
          }>${escapeAttr(device.name)}</option>`
      )),
    ].join("");
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 8px 0;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        label {
          font-size: 13px;
          color: var(--secondary-text-color);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        input, select {
          font: inherit;
          color: var(--primary-text-color);
          background: var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .hint {
          margin-top: 2px;
          font-size: 12px;
          color: var(--secondary-text-color);
        }
      </style>
      <div class="grid">
        <label>Webasto device
          <select data-field="device_id">
            ${deviceOptions}
          </select>
        </label>
        <label>Main output entity
          <input data-field="main_output_entity" list="webasto-options-switch" value="${escapeAttr(cfg.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" list="webasto-options-switch" value="${escapeAttr(cfg.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>Connected entity
          <input data-field="connected_entity" list="webasto-options-binary-sensor" value="${escapeAttr(cfg.connected_entity)}" placeholder="binary_sensor.webasto_connected" />
        </label>
        <label>Timer sensor entity
          <input data-field="next_timer_entity" list="webasto-options-sensor" value="${escapeAttr(cfg.next_timer_entity)}" placeholder="sensor.webasto_next_start" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" list="webasto-options-sensor" value="${escapeAttr(cfg.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" list="webasto-options-sensor" value="${escapeAttr(cfg.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" list="webasto-options-sensor" value="${escapeAttr(cfg.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" list="webasto-options-location" value="${escapeAttr(cfg.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${escapeAttr(cfg.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <div class="hint">Pick a device to auto-resolve entities. Manual entity fields override auto-detection.</div>
      </div>
      <datalist id="webasto-options-switch">${this._datalistOptions(["switch"])}</datalist>
      <datalist id="webasto-options-binary-sensor">${this._datalistOptions(["binary_sensor"])}</datalist>
      <datalist id="webasto-options-sensor">${this._datalistOptions(["sensor"])}</datalist>
      <datalist id="webasto-options-location">${this._datalistOptions(["sensor", "device_tracker"])}</datalist>
    `;

    this.shadowRoot.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", (ev) => this._handleInput(ev));
    });
  }
}

if (!customElements.get("webasto-connect-card")) {
  customElements.define("webasto-connect-card", WebastoConnectCard);
}
if (!customElements.get("webasto-connect-card-editor")) {
  customElements.define("webasto-connect-card-editor", WebastoConnectCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "webasto-connect-card",
  name: "Webasto Connect Card",
  description: "Webasto Connect card with center toggle for main output",
  preview: true,
});
