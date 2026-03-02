import { localize } from "./localize/localize.js";

class WebastoConnectCard extends HTMLElement {

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
    if (!endEntity || !endEntity.state || endEntity.state === "unknown" || endEntity.state === "unavailable") {
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

  _computeOutputName(ventModeState) {
    return ventModeState?.state === "on"
      ? localize(this._hass, "card.ui.ventilation")
      : localize(this._hass, "card.ui.heater");
  }

  _toggleMainOutput() {
    if (!this._hass || !this._config?.main_output_entity) {
      return;
    }
    this._hass.callService("switch", "toggle", {
      entity_id: this._config.main_output_entity,
    });
  }

  _render() {
    if (!this.shadowRoot || !this._config || !this._hass) {
      return;
    }

    const main = this._getState(this._config.main_output_entity);
    const vent = this._getState(this._config.ventilation_mode_entity);
    const end = this._getState(this._config.end_time_entity);

    const isOn = main?.state === "on";
    const ringColor = isOn ? "#d33131" : "#2ea44f";
    const outputName = this._computeOutputName(vent);
    const label = this._computeLabel(end);
    const icon = this._config.center_icon || "mdi:car-defrost-rear";
    const titleGeoFence =
      this._config.title_geo_fence || localize(this._hass, "card.ui.geo_fence");
    const titleMode =
      this._config.title_mode || localize(this._hass, "card.ui.mode");
    const titleTimers =
      this._config.title_timers || localize(this._hass, "card.ui.timers");
    const titleMap =
      this._config.title_map || localize(this._hass, "card.ui.map");
    const toggleLabel = localize(this._hass, "card.ui.toggle_output");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
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
        .q.tr, .q.br {
          justify-content: flex-end;
          text-align: right;
        }
        .q.bl, .q.br {
          align-items: flex-end;
        }
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
      </style>
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

customElements.define("webasto-connect-card", WebastoConnectCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "webasto-connect-card",
  name: "Webasto Connect Card",
  description: "Webasto Connect card with center toggle for main output",
});
