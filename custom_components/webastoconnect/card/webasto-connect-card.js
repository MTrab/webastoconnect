globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0b21";
var H={card:{ui:{geo_fence:"Geo-fence",mode:"Modus",timers:"Timere",map:"Kort",heating:"Opvarmning",ventilation:"Ventilation",mode_unavailable:"Utilg\xE6ngelig",active:"Aktiv",inactive:"Ikke aktiv",offline_title:"Offline",offline_label:`ThermoConnect er ikke tilg\xE6ngelig
(intet netv\xE6rk)`,ending_now:"Slutter nu",left:"tilbage",main_output_missing:"V\xE6lg en Webasto-enhed eller main output entity i kortindstillinger",output:"Output",toggle_output:"Skift output",delete:"Slet",save:"Gem",close:"Luk",map_unavailable:"Lokation er ikke tilg\xE6ngelig",timers_empty:"Ingen timere konfigureret",timer_enabled:"Aktiv",timer_disabled:"Deaktiveret",timer_once:"Kun \xE9n gang",timer_repeating:"Gentages",timers_manage_note:"Timere vist her tilh\xF8rer kun det aktive output.",timers_readonly_note:"Timerstyring kr\xE6ver en connected enhed og en valgt Webasto-enhed."}}};var U={card:{ui:{geo_fence:"Geo-fence",mode:"Mode",timers:"Timers",map:"Map",heating:"Heating",ventilation:"Ventilation",mode_unavailable:"Unavailable",active:"Active",inactive:"Inactive",offline_title:"Offline",offline_label:`ThermoConnect is unavailable
(no network)`,ending_now:"Ending now",left:"left",main_output_missing:"Select a Webasto device or main output entity in card settings",output:"Output",toggle_output:"Toggle output",delete:"Delete",save:"Save",close:"Close",map_unavailable:"Location is unavailable",timers_empty:"No timers configured",timer_enabled:"Enabled",timer_disabled:"Disabled",timer_once:"One time",timer_repeating:"Repeating",timers_manage_note:"Timers shown here belong to the active output only.",timers_readonly_note:"Timer management requires a connected device and a selected Webasto device."}}};var x={da:H,en:U};function F(d,e){if(!d)return;let t=e.split("."),i=d;for(let o of t){if(i==null||typeof i!="object")return;i=i[o]}return typeof i=="string"?i:void 0}function ue(d){let e=String(d||"en").toLowerCase();if(x[e])return e;let t=e.split("-")[0];return x[t]?t:"en"}function n(d,e,t={}){let i=ue(d?.language),o=F(x[i],e)??F(x.en,e)??e;return Object.entries(t).forEach(([c,s])=>{o=o.replace(`{${c}}`,String(s))}),o}function r(d){return String(d??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function O(d){return d?.device_class||d?.original_device_class||null}var q=class extends HTMLElement{static getConfigElement(){return document.createElement("webasto-connect-card-editor")}static getStubConfig(){return{device_id:""}}setConfig(e){this._config={connected_entity:e?.connected_entity,ventilation_mode_entity:e?.ventilation_mode_entity,next_timer_entity:e?.next_timer_entity,end_time_entity:e?.end_time_entity,...e}}set hass(e){this._hass=e,this._loadRegistryData(),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_getState(e){return e?this._hass?.states?.[e]:void 0}async _loadRegistryData(){if(!(!this._hass||this._registryDataLoaded||this._registryDataLoading)){this._registryDataLoading=!0;try{let[e,t]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]);this._entityRegistry=Array.isArray(e)?e:[],this._deviceRegistry=Array.isArray(t)?t:[],this._registryDataLoaded=!0}catch{this._entityRegistry=[],this._deviceRegistry=[]}finally{this._registryDataLoading=!1,this._render()}}}_entriesForSelectedDevice(){let e=this._config?.device_id;return!e||!Array.isArray(this._entityRegistry)?[]:this._entityRegistry.filter(t=>t?.platform==="webastoconnect"&&t?.device_id===e&&!t?.hidden_by)}_pickEntry(e,t){return e.find(i=>t(i))?.entity_id}_resolveEntities(){let e=this._entriesForSelectedDevice(),t=this._config||{};return{main_output_entity:t.main_output_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("switch.")&&i.entity_category==null&&i.original_name!=="AUX1"&&i.original_name!=="AUX2"),ventilation_mode_entity:t.ventilation_mode_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("switch.")&&i.original_name==="Ventilation Mode"),end_time_entity:t.end_time_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&O(i)==="timestamp"&&i.original_name!=="Next start"),temperature_entity:t.temperature_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&(O(i)==="temperature"||i.original_name==="Temperature")),battery_entity:t.battery_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&(O(i)==="voltage"||i.original_name==="Battery")),connected_entity:t.connected_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("binary_sensor.")&&i.original_name==="Connected"),next_timer_entity:t.next_timer_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&i.original_name==="Next start"),location_entity:t.location_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("device_tracker."))}}_isConnected(e){return e?e.state!=="off":!0}_parseEndDate(e){if(e==null||e==="")return null;let t=Number(e);if(Number.isFinite(t)){let o=t<1e12?t*1e3:t,c=new Date(o);return Number.isNaN(c.getTime())?null:c}let i=new Date(String(e));return Number.isNaN(i.getTime())?null:i}_computeLabel(e,t){if(!e||e.state!=="on")return n(this._hass,"card.ui.inactive");if(!t||!t.state||t.state==="unknown"||t.state==="unavailable")return n(this._hass,"card.ui.active");let i=this._parseEndDate(t.state);if(!i)return n(this._hass,"card.ui.active");let o=Math.ceil((i.getTime()-Date.now())/6e4);if(o<=0)return n(this._hass,"card.ui.ending_now");let c=Math.floor(o/60),s=o%60;return`${c}:${String(s).padStart(2,"0")} ${n(this._hass,"card.ui.left")}`}_computeOutputName(e){let t=e?.attributes?.friendly_name;return typeof t=="string"&&t.trim()!==""?t:n(this._hass,"card.ui.output")}_toggleMainOutput(){let e=this._resolveEntities().main_output_entity;if(!this._hass||!e||!this._hass.states?.[e]){console.warn("[webasto-connect-card] Missing or unavailable main_output_entity:",e);return}this._hass.callService("homeassistant","toggle",{entity_id:e})}_stateWithUnit(e){if(!e)return"--";let t=e.state;if(t==="unknown"||t==="unavailable")return"--";let i=e.attributes?.unit_of_measurement;return i?`${t} ${i}`:String(t)}_locationText(e){if(!e)return"--";let t=String(e.state??"");if(t!==""&&t!=="unknown"&&t!=="unavailable"&&t!=="not_home")return t;let i=e.attributes?.latitude,o=e.attributes?.longitude;return typeof i=="number"&&typeof o=="number"?`${i.toFixed(5)}, ${o.toFixed(5)}`:"--"}_isMapEnabled(e,t){return!e||!e.startsWith("device_tracker.")||!t?!1:t.state!=="unknown"&&t.state!=="unavailable"}_openMapPopup(){let e=this._resolveEntities().location_entity,t=this._getState(e);this._isMapEnabled(e,t)&&(this._mapPopupOpen=!0,this._render())}_closeMapPopup(){this._mapPopupOpen=!1,this._render()}_openTimersPopup(){this._timersPopupOpen=!0,this._render()}_closeTimersPopup(){this._timersPopupOpen=!1,this._render()}_resolveMode(e){return!e||e.state==="unknown"||e.state==="unavailable"?null:e.state==="on"?"ventilation":"heating"}_modeLabel(e){return e==="ventilation"?n(this._hass,"card.ui.ventilation"):e==="heating"?n(this._hass,"card.ui.heating"):n(this._hass,"card.ui.mode_unavailable")}_isModeSelectable(e){return!!(e&&this._getState(e))}_openModePopup(){let e=this._resolveEntities().ventilation_mode_entity,t=this._getState(e);this._isModeSelectable(e)&&(this._modeDraft=this._resolveMode(t)||"heating",this._modePopupOpen=!0,this._render())}_closeModePopup(){this._modePopupOpen=!1,this._modeDraft=void 0,this._render()}_selectModeDraft(e){this._modeDraft=e,this._render()}_saveModeSelection(){let e=this._resolveEntities().ventilation_mode_entity;if(!this._hass||!e||!this._modeDraft)return;let t=this._modeDraft==="ventilation"?"turn_on":"turn_off";this._hass.callService("homeassistant",t,{entity_id:e}),this._closeModePopup()}_timerItems(e){let t=e?.attributes?.timers;return Array.isArray(t)?t.filter(i=>i&&typeof i=="object").map((i,o)=>({...i,index:o,line_code:i.line_code||i.line||"OUTH"})):[]}_activeLine(e){return this._resolveMode(e)==="ventilation"?"OUTV":"OUTH"}_formatTimerRepeat(e){return e.repeat?n(this._hass,"card.ui.timer_repeating"):n(this._hass,"card.ui.timer_once")}_canManageTimers(e,t){return!!e&&t}_toggleTimerEnabled(e){let t=this._config?.device_id;!this._hass||!t||this._hass.callService("webastoconnect","update_timer",{device_id:t,timer_index:e.index,enabled:!e.enabled})}_deleteTimer(e){let t=this._config?.device_id;!this._hass||!t||this._hass.callService("webastoconnect","delete_timer",{device_id:t,timer_index:e.index})}async _renderMapPopup(e){let t=this.shadowRoot?.getElementById("map-card-host");if(!(!t||!this._hass||!e)){t.innerHTML="";try{let o=await(await window.loadCardHelpers?.())?.createCardElement?.({type:"map",entities:[e]});if(!o){t.innerHTML=`<div class="map-unavailable">${r(n(this._hass,"card.ui.map_unavailable"))}</div>`;return}o.hass=this._hass,o.style.display="block",o.style.height="360px",t.appendChild(o)}catch{t.innerHTML=`<div class="map-unavailable">${r(n(this._hass,"card.ui.map_unavailable"))}</div>`}}}_render(){if(!this.shadowRoot||!this._config||!this._hass)return;let e=this._resolveEntities(),t=this._getState(e.main_output_entity),i=this._getState(e.end_time_entity),o=this._getState(e.temperature_entity),c=this._getState(e.battery_entity),s=this._getState(e.location_entity),v=this._getState(e.ventilation_mode_entity),V=this._getState(e.connected_entity),G=this._getState(e.next_timer_entity),l=this._isConnected(V),K=this._activeLine(v),y=this._timerItems(G).filter(a=>a.line_code===K),C=!!t,X=C&&t.state==="on",Y=l&&X?"#d33131":"#c5cfdf",I=l?this._computeOutputName(t):n(this._hass,"card.ui.offline_title"),L=l?C?this._computeLabel(t,i):n(this._hass,"card.ui.main_output_missing"):n(this._hass,"card.ui.offline_label"),J=l?this._stateWithUnit(o):"--",Q=l?this._stateWithUnit(c):"--",Z=this._locationText(s),A=l?this._config.center_icon||t?.attributes?.icon||"mdi:car-defrost-rear":"mdi:signal-off",ee="",w=n(this._hass,"card.ui.mode"),k=n(this._hass,"card.ui.timers"),$=n(this._hass,"card.ui.map"),te=n(this._hass,"card.ui.toggle_output"),g=l&&this._isModeSelectable(e.ventilation_mode_entity),ie=g?"mode-enabled":"mode-disabled",oe=g?"0":"-1",ae=g?"false":"true",B=this._modePopupOpen&&g,W=this._modeDraft||this._resolveMode(v)||"heating",ne=n(this._hass,"card.ui.save"),f=this._isMapEnabled(e.location_entity,s),se=f?"map-enabled":"map-disabled",re=f?"0":"-1",de=f?"false":"true",N=this._mapPopupOpen&&f,b=!!e.next_timer_entity,le=b?"timers-enabled":"timers-disabled",ce=b?"0":"-1",pe=b?"false":"true",j=this._timersPopupOpen&&b,S=this._canManageTimers(this._config?.device_id,l),M=n(this._hass,"card.ui.close");this.shadowRoot.innerHTML=`
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
          border: 10px solid ${Y};
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
          <div class="q tl">${ee}</div>
          <div class="q tr ${ie}" id="mode-action" role="button" tabindex="${oe}" aria-disabled="${ae}">
            <span class="q-label">${w}</span>
          </div>
          <div class="q bl ${le}" id="timers-action" role="button" tabindex="${ce}" aria-disabled="${pe}">${k}</div>
          <div class="q br ${se}" id="map-action" role="button" tabindex="${re}" aria-disabled="${de}">${$}</div>
          <div class="divider-v"></div>
          <div class="divider-h"></div>
          <div class="center-wrap ${l?"":"offline"}" id="center-toggle" role="button" tabindex="0" aria-label="${te}">
            ${l?`
            <ha-icon class="icon" icon="${A}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${I}</div>
            <div class="label">${L}</div>
            `:`
            <div class="offline-copy">${L}</div>
            <ha-icon class="icon" icon="${A}" style="--mdc-icon-size: 72px;"></ha-icon>
            <div class="name">${I}</div>
            `}
          </div>
        </ha-card>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-item"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size: 24px;"></ha-icon>${J}</span>
            <span class="meta-item"><ha-icon icon="mdi:car-battery" style="--mdc-icon-size: 24px;"></ha-icon>${Q}</span>
          </div>
          <div class="meta-location"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 24px;"></ha-icon>${Z}</div>
        </div>
      </div>
      ${B?`
      <div class="modal-backdrop" id="mode-modal-backdrop">
        <div class="mode-modal" role="dialog" aria-modal="true" aria-label="${w}">
          <div class="mode-modal-header">
            <span>${w}</span>
            <button class="modal-close" id="mode-modal-close">${M}</button>
          </div>
          <div class="mode-modal-body">
            <div class="mode-options">
              <button class="mode-option ${W==="ventilation"?"selected":""}" id="mode-option-ventilation">
                <span class="mode-option-title">${n(this._hass,"card.ui.ventilation")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:fan" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
              <button class="mode-option ${W==="heating"?"selected":""}" id="mode-option-heating">
                <span class="mode-option-title">${n(this._hass,"card.ui.heating")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:car-defrost-rear" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
            </div>
            <div class="mode-modal-actions">
              <button class="mode-save" id="mode-save">${ne}</button>
            </div>
          </div>
        </div>
      </div>
      `:""}
      ${j?`
      <div class="modal-backdrop" id="timers-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${k}">
          <div class="modal-header">
            <span>${k}</span>
            <button class="modal-close" id="timers-modal-close">${M}</button>
          </div>
          <div class="timers-modal-body">
            ${y.length?`
            <div class="timers-list">
              ${y.map(a=>`
              <div class="timer-row">
                <div class="timer-main">
                  <div class="timer-title">${r(a.start_hhmm_utc||"--:--")}</div>
                  <div class="timer-meta">${r(this._formatTimerRepeat(a))} \xB7 ${a.enabled?r(n(this._hass,"card.ui.timer_enabled")):r(n(this._hass,"card.ui.timer_disabled"))}</div>
                </div>
                <div class="timer-actions">
                  <ha-switch class="timer-toggle" data-timer-index="${a.index}" ${a.enabled?"checked":""} ${S?"":"disabled"}></ha-switch>
                  <button class="timer-delete" data-delete-index="${a.index}" ${S?"":"disabled"}>${r(n(this._hass,"card.ui.delete"))}</button>
                </div>
              </div>
              `).join("")}
            </div>
            `:`<div class="timers-empty">${r(n(this._hass,"card.ui.timers_empty"))}</div>`}
            <div class="timers-note">${r(S?n(this._hass,"card.ui.timers_manage_note"):n(this._hass,"card.ui.timers_readonly_note"))}</div>
          </div>
        </div>
      </div>
      `:""}
      ${N?`
      <div class="modal-backdrop" id="map-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${$}">
          <div class="modal-header">
            <span>${$}</span>
            <button class="modal-close" id="map-modal-close">${M}</button>
          </div>
          <div class="map-card-host" id="map-card-host"></div>
        </div>
      </div>
      `:""}
    `;let E=this.shadowRoot.getElementById("center-toggle");E&&l&&(E.onclick=()=>this._toggleMainOutput(),E.onkeydown=a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),this._toggleMainOutput())});let T=this.shadowRoot.getElementById("mode-action");T&&g&&(T.onclick=()=>this._openModePopup(),T.onkeydown=a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),this._openModePopup())});let R=this.shadowRoot.getElementById("timers-action");R&&b&&(R.onclick=()=>this._openTimersPopup(),R.onkeydown=a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),this._openTimersPopup())});let D=this.shadowRoot.getElementById("map-action");if(D&&f&&(D.onclick=()=>this._openMapPopup(),D.onkeydown=a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),this._openMapPopup())}),N){this._renderMapPopup(e.location_entity);let a=this.shadowRoot.getElementById("map-modal-close");a&&(a.onclick=()=>this._closeMapPopup());let p=this.shadowRoot.getElementById("map-modal-backdrop");p&&(p.onclick=m=>{m.target===p&&this._closeMapPopup()})}if(B){let a=this.shadowRoot.getElementById("mode-modal-close");a&&(a.onclick=()=>this._closeModePopup());let p=this.shadowRoot.getElementById("mode-option-ventilation");p&&(p.onclick=()=>this._selectModeDraft("ventilation"));let m=this.shadowRoot.getElementById("mode-option-heating");m&&(m.onclick=()=>this._selectModeDraft("heating"));let _=this.shadowRoot.getElementById("mode-save");_&&(_.onclick=()=>this._saveModeSelection());let h=this.shadowRoot.getElementById("mode-modal-backdrop");h&&(h.onclick=u=>{u.target===h&&this._closeModePopup()})}if(j){let a=this.shadowRoot.getElementById("timers-modal-close");a&&(a.onclick=()=>this._closeTimersPopup());let p=this.shadowRoot.getElementById("timers-modal-backdrop");p&&(p.onclick=m=>{m.target===p&&this._closeTimersPopup()}),this.shadowRoot.querySelectorAll(".timer-toggle").forEach(m=>{m.addEventListener("change",_=>{let h=Number(_.currentTarget?.dataset?.timerIndex),u=y.find(P=>P.index===h);u&&this._toggleTimerEnabled(u)})}),this.shadowRoot.querySelectorAll(".timer-delete").forEach(m=>{m.addEventListener("click",_=>{let h=Number(_.currentTarget?.dataset?.deleteIndex),u=y.find(P=>P.index===h);u&&this._deleteTimer(u)})})}}getCardSize(){return 4}},z=class extends HTMLElement{setConfig(e){this._config={...e},this._render()}set hass(e){this._hass=e,this._suggestionsLoaded||(this._suggestionsLoaded=!0,this._loadSuggestions()),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}async _loadSuggestions(){if(this._hass){try{let[e,t]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]),i=e.filter(s=>s.platform==="webastoconnect"&&!s.hidden_by),o=i.map(s=>s.entity_id),c=new Set(i.map(s=>s.device_id).filter(Boolean));this._deviceSuggestions=t.filter(s=>c.has(s.id)).map(s=>({id:s.id,name:s.name_by_user||s.name||s.id})).sort((s,v)=>s.name.localeCompare(v.name)),this._entitySuggestions=[...new Set(o)].sort()}catch{let t=Object.keys(this._hass.states||{}).filter(i=>i.includes("webasto"));this._entitySuggestions=[...new Set(t)].sort(),this._deviceSuggestions=[]}this._render()}}_datalistOptions(e){return(this._entitySuggestions||[]).filter(i=>e.includes(i.split(".")[0])).map(i=>`<option value="${r(i)}"></option>`).join("")}_handleInput(e){let t=e.target?.dataset?.field;if(!t)return;let i=String(e.target.value||"").trim(),o={...this._config||{}};i===""?delete o[t]:o[t]=i,this._config=o,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:o},bubbles:!0,composed:!0}))}_render(){if(!this.shadowRoot)return;let e=this._config||{},t=['<option value="">Select device automatically</option>',...(this._deviceSuggestions||[]).map(i=>`<option value="${r(i.id)}"${e.device_id===i.id?" selected":""}>${r(i.name)}</option>`)].join("");this.shadowRoot.innerHTML=`
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
            ${t}
          </select>
        </label>
        <label>Main output entity
          <input data-field="main_output_entity" list="webasto-options-switch" value="${r(e.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" list="webasto-options-switch" value="${r(e.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>Connected entity
          <input data-field="connected_entity" list="webasto-options-binary-sensor" value="${r(e.connected_entity)}" placeholder="binary_sensor.webasto_connected" />
        </label>
        <label>Timer sensor entity
          <input data-field="next_timer_entity" list="webasto-options-sensor" value="${r(e.next_timer_entity)}" placeholder="sensor.webasto_next_start" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" list="webasto-options-sensor" value="${r(e.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" list="webasto-options-sensor" value="${r(e.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" list="webasto-options-sensor" value="${r(e.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" list="webasto-options-location" value="${r(e.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${r(e.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <div class="hint">Pick a device to auto-resolve entities. Manual entity fields override auto-detection.</div>
      </div>
      <datalist id="webasto-options-switch">${this._datalistOptions(["switch"])}</datalist>
      <datalist id="webasto-options-binary-sensor">${this._datalistOptions(["binary_sensor"])}</datalist>
      <datalist id="webasto-options-sensor">${this._datalistOptions(["sensor"])}</datalist>
      <datalist id="webasto-options-location">${this._datalistOptions(["sensor","device_tracker"])}</datalist>
    `,this.shadowRoot.querySelectorAll("input, select").forEach(i=>{i.addEventListener("change",o=>this._handleInput(o))})}};customElements.get("webasto-connect-card")||customElements.define("webasto-connect-card",q);customElements.get("webasto-connect-card-editor")||customElements.define("webasto-connect-card-editor",z);window.customCards=window.customCards||[];window.customCards.push({type:"webasto-connect-card",name:"Webasto Connect Card",description:"Webasto Connect card with center toggle for main output",preview:!0});
