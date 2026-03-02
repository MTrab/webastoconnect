globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0";

const WEBASTO_CONNECT_CARD_TRANSLATIONS = {
  da: {
    card: {
      ui: {
        geo_fence: "Geo-fence",
        mode: "Modus",
        timers: "Timere",
        map: "Kort",
        inactive: "Ikke aktiv",
        ending_now: "Slutter nu",
        minutes_left: "{minutes} minutter tilbage",
        main_output_missing: "Vælg Main output entity i kortindstillinger",
        output: "Output",
        toggle_output: "Skift output",
      },
    },
  },
  en: {
    card: {
      ui: {
        geo_fence: "Geo-fence",
        mode: "Mode",
        timers: "Timers",
        map: "Map",
        inactive: "Inactive",
        ending_now: "Ending now",
        minutes_left: "{minutes} minutes left",
        main_output_missing: "Select Main output entity in card settings",
        output: "Output",
        toggle_output: "Toggle output",
      },
    },
  },
};

function getNestedTranslation(obj, path) {
  if (!obj) return undefined;

  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result === undefined || result === null || typeof result !== "object") {
      return undefined;
    }
    result = result[key];
  }

  return typeof result === "string" ? result : undefined;
}

function resolveLanguage(language) {
  const raw = String(language || "en").toLowerCase();
  if (WEBASTO_CONNECT_CARD_TRANSLATIONS[raw]) return raw;

  const short = raw.split("-")[0];
  if (WEBASTO_CONNECT_CARD_TRANSLATIONS[short]) return short;

  return "en";
}

function localize(hass, key, vars = {}) {
  const lang = resolveLanguage(hass?.language);

  let translated =
    getNestedTranslation(WEBASTO_CONNECT_CARD_TRANSLATIONS[lang], key) ??
    getNestedTranslation(WEBASTO_CONNECT_CARD_TRANSLATIONS.en, key) ??
    key;

  Object.entries(vars).forEach(([name, value]) => {
    translated = translated.replace(`{${name}}`, String(value));
  });

  return translated;
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

class WebastoConnectCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("webasto-connect-card-editor");
  }

  static getStubConfig() {
    return {
      main_output_entity: "switch.webasto_main_output",
      ventilation_mode_entity: "switch.webasto_ventilation_mode",
      end_time_entity: "sensor.webasto_main_output_end_time",
      temperature_entity: "sensor.webasto_temperature",
      battery_entity: "sensor.webasto_battery_voltage",
      location_entity: "device_tracker.webasto_location",
    };
  }

  setConfig(config) {
    if (!config.main_output_entity) {
      throw new Error("Missing required config: main_output_entity");
    }
    this._config = {
      ventilation_mode_entity: config.ventilation_mode_entity,
      end_time_entity: config.end_time_entity,
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
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

  _computeLabel(endEntity) {
    if (
      !endEntity ||
      !endEntity.state ||
      endEntity.state === "unknown" ||
      endEntity.state === "unavailable"
    ) {
      return localize(this._hass, "card.ui.inactive");
    }

    const end = new Date(endEntity.state);
    if (Number.isNaN(end.getTime())) {
      return localize(this._hass, "card.ui.inactive");
    }

    const leftMinutes = Math.round((end.getTime() - Date.now()) / 60000);
    if (leftMinutes <= 0) {
      return localize(this._hass, "card.ui.ending_now");
    }
    return localize(this._hass, "card.ui.minutes_left", {
      minutes: leftMinutes,
    });
  }

  _computeOutputName(mainOutputState) {
    const friendlyName = mainOutputState?.attributes?.friendly_name;
    if (typeof friendlyName === "string" && friendlyName.trim() !== "") {
      return friendlyName;
    }
    return localize(this._hass, "card.ui.output");
  }

  _toggleMainOutput() {
    const entityId = this._config?.main_output_entity;
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
    if (
      state !== "" &&
      state !== "unknown" &&
      state !== "unavailable" &&
      state !== "not_home"
    ) {
      return state;
    }

    const lat = entity.attributes?.latitude;
    const lon = entity.attributes?.longitude;
    if (typeof lat === "number" && typeof lon === "number") {
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }

    return "--";
  }

  _render() {
    if (!this.shadowRoot || !this._config || !this._hass) {
      return;
    }

    const main = this._getState(this._config.main_output_entity);
    const end = this._getState(this._config.end_time_entity);
    const temp = this._getState(this._config.temperature_entity);
    const battery = this._getState(this._config.battery_entity);
    const location = this._getState(this._config.location_entity);

    const isMainAvailable = Boolean(main);
    const isOn = isMainAvailable && main.state === "on";
    const ringColor = isOn ? "#d33131" : "#c5cfdf";
    const outputName = this._computeOutputName(main);
    const label = isMainAvailable
      ? this._computeLabel(end)
      : localize(this._hass, "card.ui.main_output_missing");
    const tempText = this._stateWithUnit(temp);
    const batteryText = this._stateWithUnit(battery);
    const locationText = this._locationText(location);
    const icon = this._config.center_icon || "mdi:car-defrost-rear";
    const titleGeoFence =
      this._config.title_geo_fence || localize(this._hass, "card.ui.geo_fence");
    const titleMode = this._config.title_mode || localize(this._hass, "card.ui.mode");
    const titleTimers =
      this._config.title_timers || localize(this._hass, "card.ui.timers");
    const titleMap = this._config.title_map || localize(this._hass, "card.ui.map");
    const toggleLabel = localize(this._hass, "card.ui.toggle_output");

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
          align-items: flex-start;
          justify-content: flex-start;
          padding: 16px;
          box-sizing: border-box;
        }
        .q.tr, .q.br { justify-content: flex-end; text-align: right; }
        .q.bl, .q.br { align-items: flex-end; }
        .q.tl { left: 0; top: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.tr { right: 0; top: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.bl { left: 0; bottom: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.br { right: 0; bottom: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
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
        .icon { color: #2a4677; margin-bottom: 10px; }
        .name { color: #20334d; font-size: 36px; line-height: 1.1; font-weight: 500; }
        .label {
          color: #20334d;
          font-size: 24px;
          line-height: 1.2;
          margin-top: 8px;
          text-align: center;
          max-width: 240px;
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
      </style>
      <div class="wrapper">
        <ha-card>
          <div class="q tl">${titleGeoFence}</div>
          <div class="q tr">${titleMode}</div>
          <div class="q bl">${titleTimers}</div>
          <div class="q br">${titleMap}</div>
          <div class="center-wrap" id="center-toggle" role="button" tabindex="0" aria-label="${toggleLabel}">
            <ha-icon class="icon" icon="${icon}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${outputName}</div>
            <div class="label">${label}</div>
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
    `;

    const center = this.shadowRoot.getElementById("center-toggle");
    if (center) {
      center.onclick = () => this._toggleMainOutput();
      center.onkeydown = (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          this._toggleMainOutput();
        }
      };
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
    this._render();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this._render();
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
        input {
          font: inherit;
          color: var(--primary-text-color);
          background: var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 8px 10px;
        }
      </style>
      <div class="grid">
        <label>Main output entity
          <input data-field="main_output_entity" value="${escapeAttr(cfg.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" value="${escapeAttr(cfg.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" value="${escapeAttr(cfg.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" value="${escapeAttr(cfg.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" value="${escapeAttr(cfg.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" value="${escapeAttr(cfg.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${escapeAttr(cfg.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <label>Geo-fence title (optional)
          <input data-field="title_geo_fence" value="${escapeAttr(cfg.title_geo_fence)}" />
        </label>
        <label>Mode title (optional)
          <input data-field="title_mode" value="${escapeAttr(cfg.title_mode)}" />
        </label>
        <label>Timers title (optional)
          <input data-field="title_timers" value="${escapeAttr(cfg.title_timers)}" />
        </label>
        <label>Map title (optional)
          <input data-field="title_map" value="${escapeAttr(cfg.title_map)}" />
        </label>
      </div>
    `;

    this.shadowRoot.querySelectorAll("input").forEach((input) => {
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
