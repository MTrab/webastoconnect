globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0b19";
var x={card:{ui:{geo_fence:"Geo-fence",mode:"Modus",timers:"Timere",map:"Kort",active:"Aktiv",inactive:"Ikke aktiv",ending_now:"Slutter nu",left:"tilbage",main_output_missing:"V\xE6lg Main output entity i kortindstillinger",output:"Output",toggle_output:"Skift output",close:"Luk",map_unavailable:"Lokation er ikke tilg\xE6ngelig"}}};var v={card:{ui:{geo_fence:"Geo-fence",mode:"Mode",timers:"Timers",map:"Map",active:"Active",inactive:"Inactive",ending_now:"Ending now",left:"left",main_output_missing:"Select Main output entity in card settings",output:"Output",toggle_output:"Toggle output",close:"Close",map_unavailable:"Location is unavailable"}}};var p={da:x,en:v};function w(o,t){if(!o)return;let e=t.split("."),i=o;for(let a of e){if(i==null||typeof i!="object")return;i=i[a]}return typeof i=="string"?i:void 0}function I(o){let t=String(o||"en").toLowerCase();if(p[t])return t;let e=t.split("-")[0];return p[e]?e:"en"}function n(o,t,e={}){let i=I(o?.language),a=w(p[i],t)??w(p.en,t)??t;return Object.entries(e).forEach(([l,c])=>{a=a.replace(`{${l}}`,String(c))}),a}function r(o){return String(o??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}var g=class extends HTMLElement{static getConfigElement(){return document.createElement("webasto-connect-card-editor")}static getStubConfig(){return{main_output_entity:"switch.webasto_main_output",ventilation_mode_entity:"switch.webasto_ventilation_mode",end_time_entity:"sensor.webasto_main_output_end_time",temperature_entity:"sensor.webasto_temperature",battery_entity:"sensor.webasto_battery_voltage",location_entity:"device_tracker.webasto_location"}}setConfig(t){if(!t.main_output_entity)throw new Error("Missing required config: main_output_entity");this._config={ventilation_mode_entity:t.ventilation_mode_entity,end_time_entity:t.end_time_entity,...t}}set hass(t){this._hass=t,this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_getState(t){return t?this._hass?.states?.[t]:void 0}_parseEndDate(t){if(t==null||t==="")return null;let e=Number(t);if(Number.isFinite(e)){let a=e<1e12?e*1e3:e,l=new Date(a);return Number.isNaN(l.getTime())?null:l}let i=new Date(String(t));return Number.isNaN(i.getTime())?null:i}_computeLabel(t,e){if(!t||t.state!=="on")return n(this._hass,"card.ui.inactive");if(!e||!e.state||e.state==="unknown"||e.state==="unavailable")return n(this._hass,"card.ui.active");let i=this._parseEndDate(e.state);if(!i)return n(this._hass,"card.ui.active");let a=Math.ceil((i.getTime()-Date.now())/6e4);if(a<=0)return n(this._hass,"card.ui.ending_now");let l=Math.floor(a/60),c=a%60;return`${l}:${String(c).padStart(2,"0")} ${n(this._hass,"card.ui.left")}`}_computeOutputName(t){let e=t?.attributes?.friendly_name;return typeof e=="string"&&e.trim()!==""?e:n(this._hass,"card.ui.output")}_toggleMainOutput(){let t=this._config?.main_output_entity;if(!this._hass||!t||!this._hass.states?.[t]){console.warn("[webasto-connect-card] Missing or unavailable main_output_entity:",t);return}this._hass.callService("homeassistant","toggle",{entity_id:t})}_stateWithUnit(t){if(!t)return"--";let e=t.state;if(e==="unknown"||e==="unavailable")return"--";let i=t.attributes?.unit_of_measurement;return i?`${e} ${i}`:String(e)}_locationText(t){if(!t)return"--";let e=String(t.state??"");if(e!==""&&e!=="unknown"&&e!=="unavailable"&&e!=="not_home")return e;let i=t.attributes?.latitude,a=t.attributes?.longitude;return typeof i=="number"&&typeof a=="number"?`${i.toFixed(5)}, ${a.toFixed(5)}`:"--"}_isMapEnabled(t,e){return!t||!t.startsWith("device_tracker.")||!e?!1:e.state!=="unknown"&&e.state!=="unavailable"}_openMapPopup(){let t=this._config?.location_entity,e=this._getState(t);this._isMapEnabled(t,e)&&(this._mapPopupOpen=!0,this._render())}_closeMapPopup(){this._mapPopupOpen=!1,this._render()}async _renderMapPopup(t){let e=this.shadowRoot?.getElementById("map-card-host");if(!(!e||!this._hass||!t)){e.innerHTML="";try{let a=await(await window.loadCardHelpers?.())?.createCardElement?.({type:"map",entities:[t]});if(!a){e.innerHTML=`<div class="map-unavailable">${r(n(this._hass,"card.ui.map_unavailable"))}</div>`;return}a.hass=this._hass,a.style.display="block",a.style.height="360px",e.appendChild(a)}catch{e.innerHTML=`<div class="map-unavailable">${r(n(this._hass,"card.ui.map_unavailable"))}</div>`}}}_render(){if(!this.shadowRoot||!this._config||!this._hass)return;let t=this._getState(this._config.main_output_entity),e=this._getState(this._config.end_time_entity),i=this._getState(this._config.temperature_entity),a=this._getState(this._config.battery_entity),l=this._getState(this._config.location_entity),c=!!t,y=c&&t.state==="on"?"#d33131":"#c5cfdf",k=this._computeOutputName(t),$=c?this._computeLabel(t,e):n(this._hass,"card.ui.main_output_missing"),M=this._stateWithUnit(i),S=this._stateWithUnit(a),T=this._locationText(l),E=this._config.center_icon||t?.attributes?.icon||"mdi:car-defrost-rear",z="",C=n(this._hass,"card.ui.mode"),q=n(this._hass,"card.ui.timers"),u=n(this._hass,"card.ui.map"),L=n(this._hass,"card.ui.toggle_output"),d=this._isMapEnabled(this._config.location_entity,l),O=d?"map-enabled":"map-disabled",N=d?"0":"-1",P=d?"false":"true",b=this._mapPopupOpen&&d,R=n(this._hass,"card.ui.close");this.shadowRoot.innerHTML=`
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
        .q.tr, .q.br {
          justify-content: flex-end;
          text-align: right;
        }
        .q.bl, .q.br {
          align-items: flex-end;
        }
        .q.map-enabled {
          cursor: pointer;
        }
        .q.map-enabled:hover {
          filter: brightness(1.03);
        }
        .q.map-disabled {
          opacity: 0.6;
        }
        .q.tl { left: 0; top: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.tr { right: 0; top: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.bl { left: 0; bottom: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .q.br { right: 0; bottom: 0; width: calc(50% - 8px); height: calc(50% - 8px); }
        .divider-v, .divider-h {
          position: absolute;
          background: #e7edf8;
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
          border: 10px solid ${y};
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
        .map-modal-backdrop {
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
        .map-modal {
          width: min(640px, 100%);
          background: var(--card-background-color, #fff);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        }
        .map-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid var(--divider-color, #ddd);
          color: var(--primary-text-color, #111);
          font-size: 15px;
        }
        .map-modal-close {
          border: 0;
          border-radius: 8px;
          padding: 6px 10px;
          background: var(--secondary-background-color, #eee);
          color: var(--primary-text-color, #111);
          cursor: pointer;
          font: inherit;
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
          <div class="q tl">${z}</div>
          <div class="q tr">${C}</div>
          <div class="q bl">${q}</div>
          <div class="q br ${O}" id="map-action" role="button" tabindex="${N}" aria-disabled="${P}">${u}</div>
          <div class="divider-v"></div>
          <div class="divider-h"></div>
          <div class="center-wrap" id="center-toggle" role="button" tabindex="0" aria-label="${L}">
            <ha-icon class="icon" icon="${E}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${k}</div>
            <div class="label">${$}</div>
          </div>
        </ha-card>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-item"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size: 24px;"></ha-icon>${M}</span>
            <span class="meta-item"><ha-icon icon="mdi:car-battery" style="--mdc-icon-size: 24px;"></ha-icon>${S}</span>
          </div>
          <div class="meta-location"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 24px;"></ha-icon>${T}</div>
        </div>
      </div>
      ${b?`
      <div class="map-modal-backdrop" id="map-modal-backdrop">
        <div class="map-modal" role="dialog" aria-modal="true" aria-label="${u}">
          <div class="map-modal-header">
            <span>${u}</span>
            <button class="map-modal-close" id="map-modal-close">${R}</button>
          </div>
          <div class="map-card-host" id="map-card-host"></div>
        </div>
      </div>
      `:""}
    `;let h=this.shadowRoot.getElementById("center-toggle");h&&(h.onclick=()=>this._toggleMainOutput(),h.onkeydown=s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this._toggleMainOutput())});let m=this.shadowRoot.getElementById("map-action");if(m&&d&&(m.onclick=()=>this._openMapPopup(),m.onkeydown=s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this._openMapPopup())}),b){this._renderMapPopup(this._config.location_entity);let s=this.shadowRoot.getElementById("map-modal-close");s&&(s.onclick=()=>this._closeMapPopup());let _=this.shadowRoot.getElementById("map-modal-backdrop");_&&(_.onclick=A=>{A.target===_&&this._closeMapPopup()})}}getCardSize(){return 4}},f=class extends HTMLElement{setConfig(t){this._config={...t},this._render()}set hass(t){this._hass=t,this._suggestionsLoaded||(this._suggestionsLoaded=!0,this._loadSuggestions()),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}async _loadSuggestions(){if(this._hass){try{let e=(await this._hass.callWS({type:"config/entity_registry/list"})).filter(i=>i.platform==="webastoconnect"&&!i.hidden_by).map(i=>i.entity_id);this._entitySuggestions=[...new Set(e)].sort()}catch{let e=Object.keys(this._hass.states||{}).filter(i=>i.includes("webasto"));this._entitySuggestions=[...new Set(e)].sort()}this._render()}}_datalistOptions(t){return(this._entitySuggestions||[]).filter(i=>t.includes(i.split(".")[0])).map(i=>`<option value="${r(i)}"></option>`).join("")}_handleInput(t){let e=t.target?.dataset?.field;if(!e)return;let i=String(t.target.value||"").trim(),a={...this._config||{}};i===""?delete a[e]:a[e]=i,this._config=a,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:a},bubbles:!0,composed:!0}))}_render(){if(!this.shadowRoot)return;let t=this._config||{};this.shadowRoot.innerHTML=`
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
        .hint {
          margin-top: 2px;
          font-size: 12px;
          color: var(--secondary-text-color);
        }
      </style>
      <div class="grid">
        <label>Main output entity
          <input data-field="main_output_entity" list="webasto-options-switch" value="${r(t.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" list="webasto-options-switch" value="${r(t.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" list="webasto-options-sensor" value="${r(t.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" list="webasto-options-sensor" value="${r(t.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" list="webasto-options-sensor" value="${r(t.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" list="webasto-options-location" value="${r(t.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${r(t.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <div class="hint">Suggestions are limited to entities from the Webasto Connect integration.</div>
      </div>
      <datalist id="webasto-options-switch">${this._datalistOptions(["switch"])}</datalist>
      <datalist id="webasto-options-sensor">${this._datalistOptions(["sensor"])}</datalist>
      <datalist id="webasto-options-location">${this._datalistOptions(["sensor","device_tracker"])}</datalist>
    `,this.shadowRoot.querySelectorAll("input").forEach(e=>{e.addEventListener("change",i=>this._handleInput(i))})}};customElements.get("webasto-connect-card")||customElements.define("webasto-connect-card",g);customElements.get("webasto-connect-card-editor")||customElements.define("webasto-connect-card-editor",f);window.customCards=window.customCards||[];window.customCards.push({type:"webasto-connect-card",name:"Webasto Connect Card",description:"Webasto Connect card with center toggle for main output",preview:!0});
