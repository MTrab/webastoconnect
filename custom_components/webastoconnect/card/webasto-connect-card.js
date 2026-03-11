globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0b21";
var L={card:{ui:{geo_fence:"Geo-fence",mode:"Modus",timers:"Timere",map:"Kort",heating:"Opvarmning",ventilation:"Ventilation",mode_unavailable:"Utilg\xE6ngelig",active:"Aktiv",inactive:"Ikke aktiv",offline_title:"Offline",offline_label:`ThermoConnect er ikke tilg\xE6ngelig
(intet netv\xE6rk)`,ending_now:"Slutter nu",left:"tilbage",main_output_missing:"V\xE6lg en Webasto-enhed eller main output entity i kortindstillinger",output:"Output",toggle_output:"Skift output",save:"Gem",close:"Luk",map_unavailable:"Lokation er ikke tilg\xE6ngelig"}}};var q={card:{ui:{geo_fence:"Geo-fence",mode:"Mode",timers:"Timers",map:"Map",heating:"Heating",ventilation:"Ventilation",mode_unavailable:"Unavailable",active:"Active",inactive:"Inactive",offline_title:"Offline",offline_label:`ThermoConnect is unavailable
(no network)`,ending_now:"Ending now",left:"left",main_output_missing:"Select a Webasto device or main output entity in card settings",output:"Output",toggle_output:"Toggle output",save:"Save",close:"Close",map_unavailable:"Location is unavailable"}}};var _={da:L,en:q};function A(r,t){if(!r)return;let e=t.split("."),i=r;for(let o of e){if(i==null||typeof i!="object")return;i=i[o]}return typeof i=="string"?i:void 0}function ot(r){let t=String(r||"en").toLowerCase();if(_[t])return t;let e=t.split("-")[0];return _[e]?e:"en"}function n(r,t,e={}){let i=ot(r?.language),o=A(_[i],t)??A(_.en,t)??t;return Object.entries(e).forEach(([c,a])=>{o=o.replace(`{${c}}`,String(a))}),o}function l(r){return String(r??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function k(r){return r?.device_class||r?.original_device_class||null}var $=class extends HTMLElement{static getConfigElement(){return document.createElement("webasto-connect-card-editor")}static getStubConfig(){return{device_id:""}}setConfig(t){this._config={connected_entity:t?.connected_entity,ventilation_mode_entity:t?.ventilation_mode_entity,end_time_entity:t?.end_time_entity,...t}}set hass(t){this._hass=t,this._loadRegistryData(),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_getState(t){return t?this._hass?.states?.[t]:void 0}async _loadRegistryData(){if(!(!this._hass||this._registryDataLoaded||this._registryDataLoading)){this._registryDataLoading=!0;try{let[t,e]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]);this._entityRegistry=Array.isArray(t)?t:[],this._deviceRegistry=Array.isArray(e)?e:[],this._registryDataLoaded=!0}catch{this._entityRegistry=[],this._deviceRegistry=[]}finally{this._registryDataLoading=!1,this._render()}}}_entriesForSelectedDevice(){let t=this._config?.device_id;return!t||!Array.isArray(this._entityRegistry)?[]:this._entityRegistry.filter(e=>e?.platform==="webastoconnect"&&e?.device_id===t&&!e?.hidden_by)}_pickEntry(t,e){return t.find(i=>e(i))?.entity_id}_resolveEntities(){let t=this._entriesForSelectedDevice(),e=this._config||{};return{main_output_entity:e.main_output_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("switch.")&&i.entity_category==null&&i.original_name!=="AUX1"&&i.original_name!=="AUX2"),ventilation_mode_entity:e.ventilation_mode_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("switch.")&&i.original_name==="Ventilation Mode"),end_time_entity:e.end_time_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&k(i)==="timestamp"&&i.original_name!=="Next start"),temperature_entity:e.temperature_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&(k(i)==="temperature"||i.original_name==="Temperature")),battery_entity:e.battery_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&(k(i)==="voltage"||i.original_name==="Battery")),connected_entity:e.connected_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("binary_sensor.")&&i.original_name==="Connected"),location_entity:e.location_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("device_tracker."))}}_isConnected(t){return t?t.state!=="off":!0}_parseEndDate(t){if(t==null||t==="")return null;let e=Number(t);if(Number.isFinite(e)){let o=e<1e12?e*1e3:e,c=new Date(o);return Number.isNaN(c.getTime())?null:c}let i=new Date(String(t));return Number.isNaN(i.getTime())?null:i}_computeLabel(t,e){if(!t||t.state!=="on")return n(this._hass,"card.ui.inactive");if(!e||!e.state||e.state==="unknown"||e.state==="unavailable")return n(this._hass,"card.ui.active");let i=this._parseEndDate(e.state);if(!i)return n(this._hass,"card.ui.active");let o=Math.ceil((i.getTime()-Date.now())/6e4);if(o<=0)return n(this._hass,"card.ui.ending_now");let c=Math.floor(o/60),a=o%60;return`${c}:${String(a).padStart(2,"0")} ${n(this._hass,"card.ui.left")}`}_computeOutputName(t){let e=t?.attributes?.friendly_name;return typeof e=="string"&&e.trim()!==""?e:n(this._hass,"card.ui.output")}_toggleMainOutput(){let t=this._resolveEntities().main_output_entity;if(!this._hass||!t||!this._hass.states?.[t]){console.warn("[webasto-connect-card] Missing or unavailable main_output_entity:",t);return}this._hass.callService("homeassistant","toggle",{entity_id:t})}_stateWithUnit(t){if(!t)return"--";let e=t.state;if(e==="unknown"||e==="unavailable")return"--";let i=t.attributes?.unit_of_measurement;return i?`${e} ${i}`:String(e)}_locationText(t){if(!t)return"--";let e=String(t.state??"");if(e!==""&&e!=="unknown"&&e!=="unavailable"&&e!=="not_home")return e;let i=t.attributes?.latitude,o=t.attributes?.longitude;return typeof i=="number"&&typeof o=="number"?`${i.toFixed(5)}, ${o.toFixed(5)}`:"--"}_isMapEnabled(t,e){return!t||!t.startsWith("device_tracker.")||!e?!1:e.state!=="unknown"&&e.state!=="unavailable"}_openMapPopup(){let t=this._resolveEntities().location_entity,e=this._getState(t);this._isMapEnabled(t,e)&&(this._mapPopupOpen=!0,this._render())}_closeMapPopup(){this._mapPopupOpen=!1,this._render()}_resolveMode(t){return!t||t.state==="unknown"||t.state==="unavailable"?null:t.state==="on"?"ventilation":"heating"}_modeLabel(t){return t==="ventilation"?n(this._hass,"card.ui.ventilation"):t==="heating"?n(this._hass,"card.ui.heating"):n(this._hass,"card.ui.mode_unavailable")}_isModeSelectable(t){return!!(t&&this._getState(t))}_openModePopup(){let t=this._resolveEntities().ventilation_mode_entity,e=this._getState(t);this._isModeSelectable(t)&&(this._modeDraft=this._resolveMode(e)||"heating",this._modePopupOpen=!0,this._render())}_closeModePopup(){this._modePopupOpen=!1,this._modeDraft=void 0,this._render()}_selectModeDraft(t){this._modeDraft=t,this._render()}_saveModeSelection(){let t=this._resolveEntities().ventilation_mode_entity;if(!this._hass||!t||!this._modeDraft)return;let e=this._modeDraft==="ventilation"?"turn_on":"turn_off";this._hass.callService("homeassistant",e,{entity_id:t}),this._closeModePopup()}async _renderMapPopup(t){let e=this.shadowRoot?.getElementById("map-card-host");if(!(!e||!this._hass||!t)){e.innerHTML="";try{let o=await(await window.loadCardHelpers?.())?.createCardElement?.({type:"map",entities:[t]});if(!o){e.innerHTML=`<div class="map-unavailable">${l(n(this._hass,"card.ui.map_unavailable"))}</div>`;return}o.hass=this._hass,o.style.display="block",o.style.height="360px",e.appendChild(o)}catch{e.innerHTML=`<div class="map-unavailable">${l(n(this._hass,"card.ui.map_unavailable"))}</div>`}}}_render(){if(!this.shadowRoot||!this._config||!this._hass)return;let t=this._resolveEntities(),e=this._getState(t.main_output_entity),i=this._getState(t.end_time_entity),o=this._getState(t.temperature_entity),c=this._getState(t.battery_entity),a=this._getState(t.location_entity),f=this._getState(t.ventilation_mode_entity),I=this._getState(t.connected_entity),d=this._isConnected(I),S=!!e,W=S&&e.state==="on",B=d&&W?"#d33131":"#c5cfdf",E=d?this._computeOutputName(e):n(this._hass,"card.ui.offline_title"),D=d?S?this._computeLabel(e,i):n(this._hass,"card.ui.main_output_missing"):n(this._hass,"card.ui.offline_label"),j=d?this._stateWithUnit(o):"--",N=d?this._stateWithUnit(c):"--",H=this._locationText(a),R=d?this._config.center_icon||e?.attributes?.icon||"mdi:car-defrost-rear":"mdi:signal-off",U="",g=n(this._hass,"card.ui.mode"),F=n(this._hass,"card.ui.timers"),b=n(this._hass,"card.ui.map"),V=n(this._hass,"card.ui.toggle_output"),h=d&&this._isModeSelectable(t.ventilation_mode_entity),G=h?"mode-enabled":"mode-disabled",X=h?"0":"-1",K=h?"false":"true",C=this._modePopupOpen&&h,T=this._modeDraft||this._resolveMode(f)||"heating",Y=n(this._hass,"card.ui.save"),u=d&&this._isMapEnabled(t.location_entity,a),J=u?"map-enabled":"map-disabled",Q=u?"0":"-1",Z=u?"false":"true",O=this._mapPopupOpen&&u,z=n(this._hass,"card.ui.close");this.shadowRoot.innerHTML=`
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
        .q.mode-enabled {
          cursor: pointer;
        }
        .q.mode-enabled:hover {
          background: #aebbd3;
        }
        .q.map-enabled:hover {
          background: #aebbd3;
        }
        .q.map-disabled, .q.mode-disabled {
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
          border: 10px solid ${B};
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
          <div class="q tl">${U}</div>
          <div class="q tr ${G}" id="mode-action" role="button" tabindex="${X}" aria-disabled="${K}">
            <span class="q-label">${g}</span>
          </div>
          <div class="q bl">${F}</div>
          <div class="q br ${J}" id="map-action" role="button" tabindex="${Q}" aria-disabled="${Z}">${b}</div>
          <div class="divider-v"></div>
          <div class="divider-h"></div>
          <div class="center-wrap ${d?"":"offline"}" id="center-toggle" role="button" tabindex="0" aria-label="${V}">
            ${d?`
            <ha-icon class="icon" icon="${R}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${E}</div>
            <div class="label">${D}</div>
            `:`
            <div class="offline-copy">${D}</div>
            <ha-icon class="icon" icon="${R}" style="--mdc-icon-size: 72px;"></ha-icon>
            <div class="name">${E}</div>
            `}
          </div>
        </ha-card>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-item"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size: 24px;"></ha-icon>${j}</span>
            <span class="meta-item"><ha-icon icon="mdi:car-battery" style="--mdc-icon-size: 24px;"></ha-icon>${N}</span>
          </div>
          <div class="meta-location"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 24px;"></ha-icon>${H}</div>
        </div>
      </div>
      ${C?`
      <div class="modal-backdrop" id="mode-modal-backdrop">
        <div class="mode-modal" role="dialog" aria-modal="true" aria-label="${g}">
          <div class="mode-modal-header">
            <span>${g}</span>
            <button class="modal-close" id="mode-modal-close">${z}</button>
          </div>
          <div class="mode-modal-body">
            <div class="mode-options">
              <button class="mode-option ${T==="ventilation"?"selected":""}" id="mode-option-ventilation">
                <span class="mode-option-title">${n(this._hass,"card.ui.ventilation")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:fan" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
              <button class="mode-option ${T==="heating"?"selected":""}" id="mode-option-heating">
                <span class="mode-option-title">${n(this._hass,"card.ui.heating")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:car-defrost-rear" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
            </div>
            <div class="mode-modal-actions">
              <button class="mode-save" id="mode-save">${Y}</button>
            </div>
          </div>
        </div>
      </div>
      `:""}
      ${O?`
      <div class="modal-backdrop" id="map-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${b}">
          <div class="modal-header">
            <span>${b}</span>
            <button class="modal-close" id="map-modal-close">${z}</button>
          </div>
          <div class="map-card-host" id="map-card-host"></div>
        </div>
      </div>
      `:""}
    `;let v=this.shadowRoot.getElementById("center-toggle");v&&d&&(v.onclick=()=>this._toggleMainOutput(),v.onkeydown=s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this._toggleMainOutput())});let y=this.shadowRoot.getElementById("mode-action");y&&h&&(y.onclick=()=>this._openModePopup(),y.onkeydown=s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this._openModePopup())});let x=this.shadowRoot.getElementById("map-action");if(x&&u&&(x.onclick=()=>this._openMapPopup(),x.onkeydown=s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this._openMapPopup())}),O){this._renderMapPopup(t.location_entity);let s=this.shadowRoot.getElementById("map-modal-close");s&&(s.onclick=()=>this._closeMapPopup());let p=this.shadowRoot.getElementById("map-modal-backdrop");p&&(p.onclick=m=>{m.target===p&&this._closeMapPopup()})}if(C){let s=this.shadowRoot.getElementById("mode-modal-close");s&&(s.onclick=()=>this._closeModePopup());let p=this.shadowRoot.getElementById("mode-option-ventilation");p&&(p.onclick=()=>this._selectModeDraft("ventilation"));let m=this.shadowRoot.getElementById("mode-option-heating");m&&(m.onclick=()=>this._selectModeDraft("heating"));let P=this.shadowRoot.getElementById("mode-save");P&&(P.onclick=()=>this._saveModeSelection());let w=this.shadowRoot.getElementById("mode-modal-backdrop");w&&(w.onclick=tt=>{tt.target===w&&this._closeModePopup()})}}getCardSize(){return 4}},M=class extends HTMLElement{setConfig(t){this._config={...t},this._render()}set hass(t){this._hass=t,this._suggestionsLoaded||(this._suggestionsLoaded=!0,this._loadSuggestions()),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}async _loadSuggestions(){if(this._hass){try{let[t,e]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]),i=t.filter(a=>a.platform==="webastoconnect"&&!a.hidden_by),o=i.map(a=>a.entity_id),c=new Set(i.map(a=>a.device_id).filter(Boolean));this._deviceSuggestions=e.filter(a=>c.has(a.id)).map(a=>({id:a.id,name:a.name_by_user||a.name||a.id})).sort((a,f)=>a.name.localeCompare(f.name)),this._entitySuggestions=[...new Set(o)].sort()}catch{let e=Object.keys(this._hass.states||{}).filter(i=>i.includes("webasto"));this._entitySuggestions=[...new Set(e)].sort(),this._deviceSuggestions=[]}this._render()}}_datalistOptions(t){return(this._entitySuggestions||[]).filter(i=>t.includes(i.split(".")[0])).map(i=>`<option value="${l(i)}"></option>`).join("")}_handleInput(t){let e=t.target?.dataset?.field;if(!e)return;let i=String(t.target.value||"").trim(),o={...this._config||{}};i===""?delete o[e]:o[e]=i,this._config=o,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:o},bubbles:!0,composed:!0}))}_render(){if(!this.shadowRoot)return;let t=this._config||{},e=['<option value="">Select device automatically</option>',...(this._deviceSuggestions||[]).map(i=>`<option value="${l(i.id)}"${t.device_id===i.id?" selected":""}>${l(i.name)}</option>`)].join("");this.shadowRoot.innerHTML=`
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
          <input data-field="main_output_entity" list="webasto-options-switch" value="${l(t.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" list="webasto-options-switch" value="${l(t.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>Connected entity
          <input data-field="connected_entity" list="webasto-options-binary-sensor" value="${l(t.connected_entity)}" placeholder="binary_sensor.webasto_connected" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" list="webasto-options-sensor" value="${l(t.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" list="webasto-options-sensor" value="${l(t.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" list="webasto-options-sensor" value="${l(t.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" list="webasto-options-location" value="${l(t.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${l(t.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <div class="hint">Pick a device to auto-resolve entities. Manual entity fields override auto-detection.</div>
      </div>
      <datalist id="webasto-options-switch">${this._datalistOptions(["switch"])}</datalist>
      <datalist id="webasto-options-binary-sensor">${this._datalistOptions(["binary_sensor"])}</datalist>
      <datalist id="webasto-options-sensor">${this._datalistOptions(["sensor"])}</datalist>
      <datalist id="webasto-options-location">${this._datalistOptions(["sensor","device_tracker"])}</datalist>
    `,this.shadowRoot.querySelectorAll("input, select").forEach(i=>{i.addEventListener("change",o=>this._handleInput(o))})}};customElements.get("webasto-connect-card")||customElements.define("webasto-connect-card",$);customElements.get("webasto-connect-card-editor")||customElements.define("webasto-connect-card-editor",M);window.customCards=window.customCards||[];window.customCards.push({type:"webasto-connect-card",name:"Webasto Connect Card",description:"Webasto Connect card with center toggle for main output",preview:!0});
