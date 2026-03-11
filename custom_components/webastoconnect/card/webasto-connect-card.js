globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0b19";
var v={card:{ui:{geo_fence:"Geo-fence",mode:"Modus",timers:"Timere",map:"Kort",active:"Aktiv",inactive:"Ikke aktiv",ending_now:"Slutter nu",left:"tilbage",main_output_missing:"V\xE6lg en Webasto-enhed eller main output entity i kortindstillinger",output:"Output",toggle_output:"Skift output",close:"Luk",map_unavailable:"Lokation er ikke tilg\xE6ngelig"}}};var x={card:{ui:{geo_fence:"Geo-fence",mode:"Mode",timers:"Timers",map:"Map",active:"Active",inactive:"Inactive",ending_now:"Ending now",left:"left",main_output_missing:"Select a Webasto device or main output entity in card settings",output:"Output",toggle_output:"Toggle output",close:"Close",map_unavailable:"Location is unavailable"}}};var u={da:v,en:x};function w(r,t){if(!r)return;let e=t.split("."),i=r;for(let a of e){if(i==null||typeof i!="object")return;i=i[a]}return typeof i=="string"?i:void 0}function j(r){let t=String(r||"en").toLowerCase();if(u[t])return t;let e=t.split("-")[0];return u[e]?e:"en"}function n(r,t,e={}){let i=j(r?.language),a=w(u[i],t)??w(u.en,t)??t;return Object.entries(e).forEach(([l,s])=>{a=a.replace(`{${l}}`,String(s))}),a}function o(r){return String(r??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}var f=class extends HTMLElement{static getConfigElement(){return document.createElement("webasto-connect-card-editor")}static getStubConfig(){return{device_id:""}}setConfig(t){this._config={ventilation_mode_entity:t?.ventilation_mode_entity,end_time_entity:t?.end_time_entity,...t}}set hass(t){this._hass=t,this._loadRegistryData(),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_getState(t){return t?this._hass?.states?.[t]:void 0}async _loadRegistryData(){if(!(!this._hass||this._registryDataLoaded||this._registryDataLoading)){this._registryDataLoading=!0;try{let[t,e]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]);this._entityRegistry=Array.isArray(t)?t:[],this._deviceRegistry=Array.isArray(e)?e:[],this._registryDataLoaded=!0}catch{this._entityRegistry=[],this._deviceRegistry=[]}finally{this._registryDataLoading=!1,this._render()}}}_entriesForSelectedDevice(){let t=this._config?.device_id;return!t||!Array.isArray(this._entityRegistry)?[]:this._entityRegistry.filter(e=>e?.platform==="webastoconnect"&&e?.device_id===t&&!e?.hidden_by)}_pickEntry(t,e){return t.find(i=>e(i))?.entity_id}_resolveEntities(){let t=this._entriesForSelectedDevice(),e=this._config||{};return{main_output_entity:e.main_output_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("switch.")&&i.entity_category==null&&i.original_name!=="AUX1"&&i.original_name!=="AUX2"),ventilation_mode_entity:e.ventilation_mode_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("switch.")&&i.original_name==="Ventilation Mode"),end_time_entity:e.end_time_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&i.device_class==="timestamp"&&i.original_name!=="Next start"),temperature_entity:e.temperature_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&i.device_class==="temperature"),battery_entity:e.battery_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&i.device_class==="voltage"),location_entity:e.location_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("device_tracker."))}}_parseEndDate(t){if(t==null||t==="")return null;let e=Number(t);if(Number.isFinite(e)){let a=e<1e12?e*1e3:e,l=new Date(a);return Number.isNaN(l.getTime())?null:l}let i=new Date(String(t));return Number.isNaN(i.getTime())?null:i}_computeLabel(t,e){if(!t||t.state!=="on")return n(this._hass,"card.ui.inactive");if(!e||!e.state||e.state==="unknown"||e.state==="unavailable")return n(this._hass,"card.ui.active");let i=this._parseEndDate(e.state);if(!i)return n(this._hass,"card.ui.active");let a=Math.ceil((i.getTime()-Date.now())/6e4);if(a<=0)return n(this._hass,"card.ui.ending_now");let l=Math.floor(a/60),s=a%60;return`${l}:${String(s).padStart(2,"0")} ${n(this._hass,"card.ui.left")}`}_computeOutputName(t){let e=t?.attributes?.friendly_name;return typeof e=="string"&&e.trim()!==""?e:n(this._hass,"card.ui.output")}_toggleMainOutput(){let t=this._resolveEntities().main_output_entity;if(!this._hass||!t||!this._hass.states?.[t]){console.warn("[webasto-connect-card] Missing or unavailable main_output_entity:",t);return}this._hass.callService("homeassistant","toggle",{entity_id:t})}_stateWithUnit(t){if(!t)return"--";let e=t.state;if(e==="unknown"||e==="unavailable")return"--";let i=t.attributes?.unit_of_measurement;return i?`${e} ${i}`:String(e)}_locationText(t){if(!t)return"--";let e=String(t.state??"");if(e!==""&&e!=="unknown"&&e!=="unavailable"&&e!=="not_home")return e;let i=t.attributes?.latitude,a=t.attributes?.longitude;return typeof i=="number"&&typeof a=="number"?`${i.toFixed(5)}, ${a.toFixed(5)}`:"--"}_isMapEnabled(t,e){return!t||!t.startsWith("device_tracker.")||!e?!1:e.state!=="unknown"&&e.state!=="unavailable"}_openMapPopup(){let t=this._resolveEntities().location_entity,e=this._getState(t);this._isMapEnabled(t,e)&&(this._mapPopupOpen=!0,this._render())}_closeMapPopup(){this._mapPopupOpen=!1,this._render()}async _renderMapPopup(t){let e=this.shadowRoot?.getElementById("map-card-host");if(!(!e||!this._hass||!t)){e.innerHTML="";try{let a=await(await window.loadCardHelpers?.())?.createCardElement?.({type:"map",entities:[t]});if(!a){e.innerHTML=`<div class="map-unavailable">${o(n(this._hass,"card.ui.map_unavailable"))}</div>`;return}a.hass=this._hass,a.style.display="block",a.style.height="360px",e.appendChild(a)}catch{e.innerHTML=`<div class="map-unavailable">${o(n(this._hass,"card.ui.map_unavailable"))}</div>`}}}_render(){if(!this.shadowRoot||!this._config||!this._hass)return;let t=this._resolveEntities(),e=this._getState(t.main_output_entity),i=this._getState(t.end_time_entity),a=this._getState(t.temperature_entity),l=this._getState(t.battery_entity),s=this._getState(t.location_entity),p=!!e,k=p&&e.state==="on"?"#d33131":"#c5cfdf",$=this._computeOutputName(e),S=p?this._computeLabel(e,i):n(this._hass,"card.ui.main_output_missing"),E=this._stateWithUnit(a),M=this._stateWithUnit(l),L=this._locationText(s),R=this._config.center_icon||e?.attributes?.icon||"mdi:car-defrost-rear",T="",z=n(this._hass,"card.ui.mode"),C=n(this._hass,"card.ui.timers"),h=n(this._hass,"card.ui.map"),A=n(this._hass,"card.ui.toggle_output"),d=this._isMapEnabled(t.location_entity,s),D=d?"map-enabled":"map-disabled",O=d?"0":"-1",q=d?"false":"true",y=this._mapPopupOpen&&d,W=n(this._hass,"card.ui.close");this.shadowRoot.innerHTML=`
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
          border: 10px solid ${k};
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
          <div class="q tl">${T}</div>
          <div class="q tr">${z}</div>
          <div class="q bl">${C}</div>
          <div class="q br ${D}" id="map-action" role="button" tabindex="${O}" aria-disabled="${q}">${h}</div>
          <div class="divider-v"></div>
          <div class="divider-h"></div>
          <div class="center-wrap" id="center-toggle" role="button" tabindex="0" aria-label="${A}">
            <ha-icon class="icon" icon="${R}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${$}</div>
            <div class="label">${S}</div>
          </div>
        </ha-card>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-item"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size: 24px;"></ha-icon>${E}</span>
            <span class="meta-item"><ha-icon icon="mdi:car-battery" style="--mdc-icon-size: 24px;"></ha-icon>${M}</span>
          </div>
          <div class="meta-location"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 24px;"></ha-icon>${L}</div>
        </div>
      </div>
      ${y?`
      <div class="map-modal-backdrop" id="map-modal-backdrop">
        <div class="map-modal" role="dialog" aria-modal="true" aria-label="${h}">
          <div class="map-modal-header">
            <span>${h}</span>
            <button class="map-modal-close" id="map-modal-close">${W}</button>
          </div>
          <div class="map-card-host" id="map-card-host"></div>
        </div>
      </div>
      `:""}
    `;let _=this.shadowRoot.getElementById("center-toggle");_&&(_.onclick=()=>this._toggleMainOutput(),_.onkeydown=c=>{(c.key==="Enter"||c.key===" ")&&(c.preventDefault(),this._toggleMainOutput())});let m=this.shadowRoot.getElementById("map-action");if(m&&d&&(m.onclick=()=>this._openMapPopup(),m.onkeydown=c=>{(c.key==="Enter"||c.key===" ")&&(c.preventDefault(),this._openMapPopup())}),y){this._renderMapPopup(t.location_entity);let c=this.shadowRoot.getElementById("map-modal-close");c&&(c.onclick=()=>this._closeMapPopup());let g=this.shadowRoot.getElementById("map-modal-backdrop");g&&(g.onclick=P=>{P.target===g&&this._closeMapPopup()})}}getCardSize(){return 4}},b=class extends HTMLElement{setConfig(t){this._config={...t},this._render()}set hass(t){this._hass=t,this._suggestionsLoaded||(this._suggestionsLoaded=!0,this._loadSuggestions()),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}async _loadSuggestions(){if(this._hass){try{let[t,e]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]),i=t.filter(s=>s.platform==="webastoconnect"&&!s.hidden_by),a=i.map(s=>s.entity_id),l=new Set(i.map(s=>s.device_id).filter(Boolean));this._deviceSuggestions=e.filter(s=>l.has(s.id)).map(s=>({id:s.id,name:s.name_by_user||s.name||s.id})).sort((s,p)=>s.name.localeCompare(p.name)),this._entitySuggestions=[...new Set(a)].sort()}catch{let e=Object.keys(this._hass.states||{}).filter(i=>i.includes("webasto"));this._entitySuggestions=[...new Set(e)].sort(),this._deviceSuggestions=[]}this._render()}}_datalistOptions(t){return(this._entitySuggestions||[]).filter(i=>t.includes(i.split(".")[0])).map(i=>`<option value="${o(i)}"></option>`).join("")}_handleInput(t){let e=t.target?.dataset?.field;if(!e)return;let i=String(t.target.value||"").trim(),a={...this._config||{}};i===""?delete a[e]:a[e]=i,this._config=a,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:a},bubbles:!0,composed:!0}))}_render(){if(!this.shadowRoot)return;let t=this._config||{},e=['<option value="">Select device automatically</option>',...(this._deviceSuggestions||[]).map(i=>`<option value="${o(i.id)}"${t.device_id===i.id?" selected":""}>${o(i.name)}</option>`)].join("");this.shadowRoot.innerHTML=`
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
            ${e}
          </select>
        </label>
        <label>Main output entity
          <input data-field="main_output_entity" list="webasto-options-switch" value="${o(t.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" list="webasto-options-switch" value="${o(t.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" list="webasto-options-sensor" value="${o(t.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" list="webasto-options-sensor" value="${o(t.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" list="webasto-options-sensor" value="${o(t.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" list="webasto-options-location" value="${o(t.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${o(t.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <div class="hint">Pick a device to auto-resolve entities. Manual entity fields override auto-detection.</div>
      </div>
      <datalist id="webasto-options-switch">${this._datalistOptions(["switch"])}</datalist>
      <datalist id="webasto-options-sensor">${this._datalistOptions(["sensor"])}</datalist>
      <datalist id="webasto-options-location">${this._datalistOptions(["sensor","device_tracker"])}</datalist>
    `,this.shadowRoot.querySelectorAll("input, select").forEach(i=>{i.addEventListener("change",a=>this._handleInput(a))})}};customElements.get("webasto-connect-card")||customElements.define("webasto-connect-card",f);customElements.get("webasto-connect-card-editor")||customElements.define("webasto-connect-card-editor",b);window.customCards=window.customCards||[];window.customCards.push({type:"webasto-connect-card",name:"Webasto Connect Card",description:"Webasto Connect card with center toggle for main output",preview:!0});
