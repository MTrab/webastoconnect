globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0b21";
var Q={card:{ui:{geo_fence:"Geo-fence",mode:"Modus",timers:"Timere",map:"Kort",heating:"Opvarmning",ventilation:"Ventilation",mode_unavailable:"Utilg\xE6ngelig",active:"Aktiv",inactive:"Ikke aktiv",offline_title:"Offline",offline_label:`ThermoConnect er ikke tilg\xE6ngelig
(intet netv\xE6rk)`,ending_now:"Slutter nu",left:"tilbage",main_output_missing:"V\xE6lg en Webasto-enhed eller main output entity i kortindstillinger",output:"Output",toggle_output:"Skift output",delete:"Slet",deleting:"Sletter...",save:"Gem",close:"Luk",map_unavailable:"Lokation er ikke tilg\xE6ngelig",timers_empty:"Ingen timere konfigureret",add_timer:"Tilf\xF8j timer",location:"Lokation",timer_use_location:"Angiv lokation",timer_location_optional:"Valgfrit. Sl\xE5 til for at knytte en kortlokation til timeren.",start_time:"Starttid",duration_minutes:"Varighed (min)",timer_enabled:"Aktiv",timer_disabled:"Deaktiveret",timer_once:"Kun \xE9n gang",timer_repeating:"Gentages",timers_manage_note:"Timere vist her tilh\xF8rer kun det aktive output.",timers_readonly_note:"Timerstyring kr\xE6ver en connected enhed og en valgt Webasto-enhed.",day_monday:"Man",day_tuesday:"Tir",day_wednesday:"Ons",day_thursday:"Tor",day_friday:"Fre",day_saturday:"L\xF8r",day_sunday:"S\xF8n"}}};var Z={card:{ui:{geo_fence:"Geo-fence",mode:"Mode",timers:"Timers",map:"Map",heating:"Heating",ventilation:"Ventilation",mode_unavailable:"Unavailable",active:"Active",inactive:"Inactive",offline_title:"Offline",offline_label:`ThermoConnect is unavailable
(no network)`,ending_now:"Ending now",left:"left",main_output_missing:"Select a Webasto device or main output entity in card settings",output:"Output",toggle_output:"Toggle output",delete:"Delete",deleting:"Deleting...",save:"Save",close:"Close",map_unavailable:"Location is unavailable",timers_empty:"No timers configured",add_timer:"Add timer",location:"Location",timer_use_location:"Set location",timer_location_optional:"Optional. Enable to attach a map location to the timer.",start_time:"Start time",duration_minutes:"Duration (min)",timer_enabled:"Enabled",timer_disabled:"Disabled",timer_once:"One time",timer_repeating:"Repeating",timers_manage_note:"Timers shown here belong to the active output only.",timers_readonly_note:"Timer management requires a connected device and a selected Webasto device.",day_monday:"Mon",day_tuesday:"Tue",day_wednesday:"Wed",day_thursday:"Thu",day_friday:"Fri",day_saturday:"Sat",day_sunday:"Sun"}}};var E={da:Q,en:Z};function ee(l,e){if(!l)return;let t=e.split("."),i=l;for(let n of t){if(i==null||typeof i!="object")return;i=i[n]}return typeof i=="string"?i:void 0}function ke(l){let e=String(l||"en").toLowerCase();if(E[e])return e;let t=e.split("-")[0];return E[t]?t:"en"}function a(l,e,t={}){let i=ke(l?.language),n=ee(E[i],e)??ee(E.en,e)??e;return Object.entries(t).forEach(([d,r])=>{n=n.replace(`{${d}}`,String(r))}),n}function s(l){return String(l??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function q(l){return l?.device_class||l?.original_device_class||null}var A=class extends HTMLElement{static getConfigElement(){return document.createElement("webasto-connect-card-editor")}static getStubConfig(){return{device_id:""}}setConfig(e){this._config={connected_entity:e?.connected_entity,ventilation_mode_entity:e?.ventilation_mode_entity,next_timer_entity:e?.next_timer_entity,end_time_entity:e?.end_time_entity,...e}}set hass(e){this._hass=e,this._loadRegistryData(),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_getState(e){return e?this._hass?.states?.[e]:void 0}async _loadRegistryData(){if(!(!this._hass||this._registryDataLoaded||this._registryDataLoading)){this._registryDataLoading=!0;try{let[e,t]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]);this._entityRegistry=Array.isArray(e)?e:[],this._deviceRegistry=Array.isArray(t)?t:[],this._registryDataLoaded=!0}catch{this._entityRegistry=[],this._deviceRegistry=[]}finally{this._registryDataLoading=!1,this._render()}}}_entriesForSelectedDevice(){let e=this._config?.device_id;return!e||!Array.isArray(this._entityRegistry)?[]:this._entityRegistry.filter(t=>t?.platform==="webastoconnect"&&t?.device_id===e&&!t?.hidden_by)}_pickEntry(e,t){return e.find(i=>t(i))?.entity_id}_resolveEntities(){let e=this._entriesForSelectedDevice(),t=this._config||{};return{main_output_entity:t.main_output_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("switch.")&&i.entity_category==null&&i.original_name!=="AUX1"&&i.original_name!=="AUX2"),ventilation_mode_entity:t.ventilation_mode_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("switch.")&&i.original_name==="Ventilation Mode"),end_time_entity:t.end_time_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&q(i)==="timestamp"&&i.original_name!=="Next start"),temperature_entity:t.temperature_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&(q(i)==="temperature"||i.original_name==="Temperature")),battery_entity:t.battery_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&(q(i)==="voltage"||i.original_name==="Battery")),connected_entity:t.connected_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("binary_sensor.")&&i.original_name==="Connected"),next_timer_entity:t.next_timer_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("sensor.")&&i.original_name==="Next start"),location_entity:t.location_entity||this._pickEntry(e,i=>i.entity_id?.startsWith("device_tracker."))}}_isConnected(e){return e?e.state!=="off":!0}_parseEndDate(e){if(e==null||e==="")return null;let t=Number(e);if(Number.isFinite(t)){let n=t<1e12?t*1e3:t,d=new Date(n);return Number.isNaN(d.getTime())?null:d}let i=new Date(String(e));return Number.isNaN(i.getTime())?null:i}_computeLabel(e,t){if(!e||e.state!=="on")return a(this._hass,"card.ui.inactive");if(!t||!t.state||t.state==="unknown"||t.state==="unavailable")return a(this._hass,"card.ui.active");let i=this._parseEndDate(t.state);if(!i)return a(this._hass,"card.ui.active");let n=Math.ceil((i.getTime()-Date.now())/6e4);if(n<=0)return a(this._hass,"card.ui.ending_now");let d=Math.floor(n/60),r=n%60;return`${d}:${String(r).padStart(2,"0")} ${a(this._hass,"card.ui.left")}`}_computeOutputName(e){let t=e?.attributes?.friendly_name;return typeof t=="string"&&t.trim()!==""?t:a(this._hass,"card.ui.output")}_toggleMainOutput(){let e=this._resolveEntities().main_output_entity;if(!this._hass||!e||!this._hass.states?.[e]){console.warn("[webasto-connect-card] Missing or unavailable main_output_entity:",e);return}this._hass.callService("homeassistant","toggle",{entity_id:e})}_stateWithUnit(e){if(!e)return"--";let t=e.state;if(t==="unknown"||t==="unavailable")return"--";let i=e.attributes?.unit_of_measurement;return i?`${t} ${i}`:String(t)}_locationText(e){if(!e)return"--";let t=String(e.state??"");if(t!==""&&t!=="unknown"&&t!=="unavailable"&&t!=="not_home")return t;let i=e.attributes?.latitude,n=e.attributes?.longitude;return typeof i=="number"&&typeof n=="number"?`${i.toFixed(5)}, ${n.toFixed(5)}`:"--"}_isMapEnabled(e,t){return!e||!e.startsWith("device_tracker.")||!t?!1:t.state!=="unknown"&&t.state!=="unavailable"}_openMapPopup(){let e=this._resolveEntities().location_entity,t=this._getState(e);this._isMapEnabled(e,t)&&(this._mapPopupOpen=!0,this._render())}_closeMapPopup(){this._mapPopupOpen=!1,this._render()}_openTimersPopup(){this._timersPopupOpen=!0,this._render()}_closeTimersPopup(){this._timersPopupOpen=!1,this._timerDraftOpen=!1,this._timerDraft=void 0,this._render()}_defaultTimerDraft(){return{start_time:"07:00",duration_minutes:"30",enabled:!0,repeat_days:[],use_location:!1,location:null}}_openTimerDraft(){this._timerDraftOpen=!0,this._timerDraft=this._defaultTimerDraft(),this._render()}_closeTimerDraft(){this._timerDraftOpen=!1,this._timerDraft=void 0,this._render()}_setTimerDraftField(e,t){let i=this._timerDraft||this._defaultTimerDraft();this._timerDraft={...i,[e]:t},this._render()}_toggleTimerDraftDay(e){let t=this._timerDraft||this._defaultTimerDraft(),i=new Set(t.repeat_days||[]);i.has(e)?i.delete(e):i.add(e),this._timerDraft={...t,repeat_days:[...i]},this._render()}_toggleTimerDraftLocation(){let e=this._timerDraft||this._defaultTimerDraft(),t=!e.use_location;this._timerDraft={...e,use_location:t,location:t?e.location:null},this._render()}_saveNewTimer(){let e=this._config?.device_id,t=this._timerDraft;if(!this._hass||!e||!t?.start_time||!t?.duration_minutes)return;let i={device_id:e,start_time:t.start_time,duration_minutes:Number(t.duration_minutes),enabled:!!t.enabled,repeat_days:t.repeat_days||[]};t.use_location&&t.location&&typeof t.location=="object"&&Number.isFinite(Number(t.location.latitude))&&Number.isFinite(Number(t.location.longitude))&&(i.location={latitude:Number(t.location.latitude),longitude:Number(t.location.longitude)}),this._hass.callService("webastoconnect","create_timer",i),this._closeTimerDraft()}_setupTimerLocationSelector(){if(!this._hass||!this._timerDraftOpen)return;let e=this.shadowRoot?.getElementById("timer-location");e&&(e.hass=this._hass,e.selector={location:{}},e.value=this._timerDraft?.location??null,e.addEventListener("value-changed",t=>{this._setTimerDraftField("location",t.detail?.value??null)}))}_resolveMode(e){return!e||e.state==="unknown"||e.state==="unavailable"?null:e.state==="on"?"ventilation":"heating"}_modeLabel(e){return e==="ventilation"?a(this._hass,"card.ui.ventilation"):e==="heating"?a(this._hass,"card.ui.heating"):a(this._hass,"card.ui.mode_unavailable")}_isModeSelectable(e){return!!(e&&this._getState(e))}_openModePopup(){let e=this._resolveEntities().ventilation_mode_entity,t=this._getState(e);this._isModeSelectable(e)&&(this._modeDraft=this._resolveMode(t)||"heating",this._modePopupOpen=!0,this._render())}_closeModePopup(){this._modePopupOpen=!1,this._modeDraft=void 0,this._render()}_selectModeDraft(e){this._modeDraft=e,this._render()}_saveModeSelection(){let e=this._resolveEntities().ventilation_mode_entity;if(!this._hass||!e||!this._modeDraft)return;let t=this._modeDraft==="ventilation"?"turn_on":"turn_off";this._hass.callService("homeassistant",t,{entity_id:e}),this._closeModePopup()}_timerItems(e){let t=e?.attributes?.timers;return Array.isArray(t)?t.filter(i=>i&&typeof i=="object").map((i,n)=>({...i,index:n,line_code:i.line_code||i.line||"OUTH"})):[]}_activeLine(e){return this._resolveMode(e)==="ventilation"?"OUTV":"OUTH"}_formatTimerRepeat(e){return e.repeat?a(this._hass,"card.ui.timer_repeating"):a(this._hass,"card.ui.timer_once")}_formatTimerStart(e){let t=Number(e?.start);if(!Number.isFinite(t)||t<0)return"--:--";let i=Math.floor(t/60)%24,n=t%60,d=new Date,r=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),i,n,0,0));return`${String(r.getHours()).padStart(2,"0")}:${String(r.getMinutes()).padStart(2,"0")}`}_canManageTimers(e,t){return!!e&&t}_weekdayOptions(){return[["monday",a(this._hass,"card.ui.day_monday")],["tuesday",a(this._hass,"card.ui.day_tuesday")],["wednesday",a(this._hass,"card.ui.day_wednesday")],["thursday",a(this._hass,"card.ui.day_thursday")],["friday",a(this._hass,"card.ui.day_friday")],["saturday",a(this._hass,"card.ui.day_saturday")],["sunday",a(this._hass,"card.ui.day_sunday")]]}_toggleTimerEnabled(e){let t=this._config?.device_id;!this._hass||!t||this._hass.callService("webastoconnect","update_timer",{device_id:t,timer_index:e.index,enabled:!e.enabled})}_deleteTimer(e,t){let i=this._config?.device_id;!this._hass||!i||(t&&(t.disabled=!0,t.textContent=a(this._hass,"card.ui.deleting")),Promise.resolve(this._hass.callService("webastoconnect","delete_timer",{device_id:i,timer_index:e.index})).finally(()=>{t?.isConnected&&(t.disabled=!1,t.textContent=a(this._hass,"card.ui.delete"))}))}async _renderMapPopup(e){let t=this.shadowRoot?.getElementById("map-card-host");if(!(!t||!this._hass||!e)){t.innerHTML="";try{let n=await(await window.loadCardHelpers?.())?.createCardElement?.({type:"map",entities:[e]});if(!n){t.innerHTML=`<div class="map-unavailable">${s(a(this._hass,"card.ui.map_unavailable"))}</div>`;return}n.hass=this._hass,n.style.display="block",n.style.height="360px",t.appendChild(n)}catch{t.innerHTML=`<div class="map-unavailable">${s(a(this._hass,"card.ui.map_unavailable"))}</div>`}}}_render(){if(!this.shadowRoot||!this._config||!this._hass)return;let e=this._resolveEntities(),t=this._getState(e.main_output_entity),i=this._getState(e.end_time_entity),n=this._getState(e.temperature_entity),d=this._getState(e.battery_entity),r=this._getState(e.location_entity),$=this._getState(e.ventilation_mode_entity),te=this._getState(e.connected_entity),ie=this._getState(e.next_timer_entity),p=this._isConnected(te),ae=this._activeLine($),T=this._timerItems(ie).filter(o=>o.line_code===ae),N=!!t,oe=N&&t.state==="on",ne=p&&oe?"#d33131":"#c5cfdf",j=p?this._computeOutputName(t):a(this._hass,"card.ui.offline_title"),W=p?N?this._computeLabel(t,i):a(this._hass,"card.ui.main_output_missing"):a(this._hass,"card.ui.offline_label"),se=p?this._stateWithUnit(n):"--",re=p?this._stateWithUnit(d):"--",de=this._locationText(r),F=p?this._config.center_icon||t?.attributes?.icon||"mdi:car-defrost-rear":"mdi:signal-off",le="",M=a(this._hass,"card.ui.mode"),R=a(this._hass,"card.ui.timers"),L=a(this._hass,"card.ui.map"),ce=a(this._hass,"card.ui.toggle_output"),b=p&&this._isModeSelectable(e.ventilation_mode_entity),me=b?"mode-enabled":"mode-disabled",pe=b?"0":"-1",ue=b?"false":"true",U=this._modePopupOpen&&b,H=this._modeDraft||this._resolveMode($)||"heating",he=a(this._hass,"card.ui.save"),y=this._isMapEnabled(e.location_entity,r),_e=y?"map-enabled":"map-disabled",fe=y?"0":"-1",ge=y?"false":"true",V=this._mapPopupOpen&&y,v=!!e.next_timer_entity,be=v?"timers-enabled":"timers-disabled",ye=v?"0":"-1",ve=v?"false":"true",G=this._timersPopupOpen&&v,x=this._canManageTimers(this._config?.device_id,p),h=this._timerDraft||this._defaultTimerDraft(),K=this._timerDraftOpen&&x,D=a(this._hass,"card.ui.close");this.shadowRoot.innerHTML=`
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
          border: 10px solid ${ne};
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
        .timer-add-wrap {
          display: flex;
          justify-content: center;
        }
        .timer-add {
          border: 0;
          border-radius: 14px;
          min-width: 120px;
          padding: 12px 20px;
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          cursor: pointer;
          font: inherit;
          font-weight: 500;
        }
        .timer-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 18px;
          background: var(--secondary-background-color, #eee);
          padding: 14px;
        }
        .timer-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .timer-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: var(--primary-text-color, #111);
          font-size: 14px;
        }
        .timer-form input {
          font: inherit;
          color: var(--primary-text-color, #111);
          background: var(--card-background-color, #fff);
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 10px;
          padding: 10px 12px;
        }
        .timer-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-text-color, #111);
          font-size: 14px;
        }
        .timer-location-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: var(--primary-text-color, #111);
          font-size: 14px;
        }
        .timer-location-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-text-color, #111);
          font-size: 14px;
        }
        .timer-location-help {
          color: var(--secondary-text-color, #666);
          font-size: 12px;
          margin-top: -4px;
        }
        .timer-location-field ha-selector {
          display: block;
        }
        .timer-days {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .timer-day {
          border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 999px;
          padding: 8px 12px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #111);
          cursor: pointer;
          font: inherit;
        }
        .timer-day.selected {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
          border-color: var(--primary-color, #03a9f4);
        }
        .timer-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .timer-form-secondary,
        .timer-form-primary {
          border: 0;
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          font: inherit;
          font-weight: 500;
        }
        .timer-form-secondary {
          background: var(--secondary-background-color, #eee);
          color: var(--primary-text-color, #111);
        }
        .timer-form-primary {
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, #fff);
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
          <div class="q tl">${le}</div>
          <div class="q tr ${me}" id="mode-action" role="button" tabindex="${pe}" aria-disabled="${ue}">
            <span class="q-label">${M}</span>
          </div>
          <div class="q bl ${be}" id="timers-action" role="button" tabindex="${ye}" aria-disabled="${ve}">${R}</div>
          <div class="q br ${_e}" id="map-action" role="button" tabindex="${fe}" aria-disabled="${ge}">${L}</div>
          <div class="divider-v"></div>
          <div class="divider-h"></div>
          <div class="center-wrap ${p?"":"offline"}" id="center-toggle" role="button" tabindex="0" aria-label="${ce}">
            ${p?`
            <ha-icon class="icon" icon="${F}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${j}</div>
            <div class="label">${W}</div>
            `:`
            <div class="offline-copy">${W}</div>
            <ha-icon class="icon" icon="${F}" style="--mdc-icon-size: 72px;"></ha-icon>
            <div class="name">${j}</div>
            `}
          </div>
        </ha-card>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-item"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size: 24px;"></ha-icon>${se}</span>
            <span class="meta-item"><ha-icon icon="mdi:car-battery" style="--mdc-icon-size: 24px;"></ha-icon>${re}</span>
          </div>
          <div class="meta-location"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 24px;"></ha-icon>${de}</div>
        </div>
      </div>
      ${U?`
      <div class="modal-backdrop" id="mode-modal-backdrop">
        <div class="mode-modal" role="dialog" aria-modal="true" aria-label="${M}">
          <div class="mode-modal-header">
            <span>${M}</span>
            <button class="modal-close" id="mode-modal-close">${D}</button>
          </div>
          <div class="mode-modal-body">
            <div class="mode-options">
              <button class="mode-option ${H==="ventilation"?"selected":""}" id="mode-option-ventilation">
                <span class="mode-option-title">${a(this._hass,"card.ui.ventilation")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:fan" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
              <button class="mode-option ${H==="heating"?"selected":""}" id="mode-option-heating">
                <span class="mode-option-title">${a(this._hass,"card.ui.heating")}</span>
                <ha-icon class="mode-option-icon" icon="mdi:car-defrost-rear" style="--mdc-icon-size: 46px;"></ha-icon>
              </button>
            </div>
            <div class="mode-modal-actions">
              <button class="mode-save" id="mode-save">${he}</button>
            </div>
          </div>
        </div>
      </div>
      `:""}
      ${G?`
      <div class="modal-backdrop" id="timers-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${R}">
          <div class="modal-header">
            <span>${R}</span>
            <button class="modal-close" id="timers-modal-close">${D}</button>
          </div>
          <div class="timers-modal-body">
            ${K?`
            <div class="timer-form">
              <div class="timer-form-grid">
                <label>${s(a(this._hass,"card.ui.start_time"))}
                  <input id="timer-start-time" type="time" value="${s(h.start_time)}">
                </label>
                <label>${s(a(this._hass,"card.ui.duration_minutes"))}
                  <input id="timer-duration" type="number" min="1" max="1440" value="${s(h.duration_minutes)}">
                </label>
              </div>
              <label class="timer-location-toggle">
                <input id="timer-use-location" type="checkbox" ${h.use_location?"checked":""}>
                <span>${s(a(this._hass,"card.ui.timer_use_location"))}</span>
              </label>
              <div class="timer-location-help">${s(a(this._hass,"card.ui.timer_location_optional"))}</div>
              ${h.use_location?`
              <label class="timer-location-field">${s(a(this._hass,"card.ui.location"))}
                <ha-selector id="timer-location"></ha-selector>
              </label>
              `:""}
              <label class="timer-checkbox">
                <input id="timer-enabled" type="checkbox" ${h.enabled?"checked":""}>
                <span>${s(a(this._hass,"card.ui.timer_enabled"))}</span>
              </label>
              <div class="timer-days">
                ${this._weekdayOptions().map(([o,m])=>`
                <button class="timer-day ${(h.repeat_days||[]).includes(o)?"selected":""}" data-day="${o}" type="button">${s(m)}</button>
                `).join("")}
              </div>
              <div class="timer-form-actions">
                <button class="timer-form-secondary" id="timer-cancel" type="button">${s(D)}</button>
                <button class="timer-form-primary" id="timer-save-new" type="button">${s(a(this._hass,"card.ui.add_timer"))}</button>
              </div>
            </div>
            `:""}
            ${T.length?`
            <div class="timers-list">
              ${T.map(o=>`
              <div class="timer-row">
                <div class="timer-main">
                  <div class="timer-title">${s(this._formatTimerStart(o))}</div>
                  <div class="timer-meta">${s(this._formatTimerRepeat(o))} \xB7 ${o.enabled?s(a(this._hass,"card.ui.timer_enabled")):s(a(this._hass,"card.ui.timer_disabled"))}</div>
                </div>
                <div class="timer-actions">
                  <ha-switch class="timer-toggle" data-timer-index="${o.index}" ${o.enabled?"checked":""} ${x?"":"disabled"}></ha-switch>
                  <button class="timer-delete" data-delete-index="${o.index}" ${x?"":"disabled"}>${s(a(this._hass,"card.ui.delete"))}</button>
                </div>
              </div>
              `).join("")}
            </div>
            `:`<div class="timers-empty">${s(a(this._hass,"card.ui.timers_empty"))}</div>`}
            ${x&&!K?`
            <div class="timer-add-wrap">
              <button class="timer-add" id="timer-add" type="button">${s(a(this._hass,"card.ui.add_timer"))}</button>
            </div>
            `:""}
            <div class="timers-note">${s(x?a(this._hass,"card.ui.timers_manage_note"):a(this._hass,"card.ui.timers_readonly_note"))}</div>
          </div>
        </div>
      </div>
      `:""}
      ${V?`
      <div class="modal-backdrop" id="map-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${L}">
          <div class="modal-header">
            <span>${L}</span>
            <button class="modal-close" id="map-modal-close">${D}</button>
          </div>
          <div class="map-card-host" id="map-card-host"></div>
        </div>
      </div>
      `:""}
    `;let O=this.shadowRoot.getElementById("center-toggle");O&&p&&(O.onclick=()=>this._toggleMainOutput(),O.onkeydown=o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),this._toggleMainOutput())});let I=this.shadowRoot.getElementById("mode-action");I&&b&&(I.onclick=()=>this._openModePopup(),I.onkeydown=o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),this._openModePopup())});let C=this.shadowRoot.getElementById("timers-action");C&&v&&(C.onclick=()=>this._openTimersPopup(),C.onkeydown=o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),this._openTimersPopup())});let P=this.shadowRoot.getElementById("map-action");if(P&&y&&(P.onclick=()=>this._openMapPopup(),P.onkeydown=o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),this._openMapPopup())}),V){this._renderMapPopup(e.location_entity);let o=this.shadowRoot.getElementById("map-modal-close");o&&(o.onclick=()=>this._closeMapPopup());let m=this.shadowRoot.getElementById("map-modal-backdrop");m&&(m.onclick=u=>{u.target===m&&this._closeMapPopup()})}if(U){let o=this.shadowRoot.getElementById("mode-modal-close");o&&(o.onclick=()=>this._closeModePopup());let m=this.shadowRoot.getElementById("mode-option-ventilation");m&&(m.onclick=()=>this._selectModeDraft("ventilation"));let u=this.shadowRoot.getElementById("mode-option-heating");u&&(u.onclick=()=>this._selectModeDraft("heating"));let w=this.shadowRoot.getElementById("mode-save");w&&(w.onclick=()=>this._saveModeSelection());let _=this.shadowRoot.getElementById("mode-modal-backdrop");_&&(_.onclick=S=>{S.target===_&&this._closeModePopup()})}if(G){let o=this.shadowRoot.getElementById("timers-modal-close");o&&(o.onclick=()=>this._closeTimersPopup());let m=this.shadowRoot.getElementById("timers-modal-backdrop");m&&(m.onclick=c=>{c.target===m&&this._closeTimersPopup()}),this.shadowRoot.querySelectorAll(".timer-toggle").forEach(c=>{c.addEventListener("change",f=>{let g=Number(f.currentTarget?.dataset?.timerIndex),k=T.find(z=>z.index===g);k&&this._toggleTimerEnabled(k)})}),this.shadowRoot.querySelectorAll(".timer-delete").forEach(c=>{c.addEventListener("click",f=>{let g=Number(f.currentTarget?.dataset?.deleteIndex),k=T.find(z=>z.index===g);k&&this._deleteTimer(k,f.currentTarget)})});let u=this.shadowRoot.getElementById("timer-add");u&&(u.onclick=()=>this._openTimerDraft());let w=this.shadowRoot.getElementById("timer-start-time");w&&w.addEventListener("change",c=>{this._setTimerDraftField("start_time",c.currentTarget.value)});let _=this.shadowRoot.getElementById("timer-duration");_&&_.addEventListener("change",c=>{this._setTimerDraftField("duration_minutes",c.currentTarget.value)});let S=this.shadowRoot.getElementById("timer-enabled");S&&S.addEventListener("change",c=>{this._setTimerDraftField("enabled",c.currentTarget.checked)});let X=this.shadowRoot.getElementById("timer-use-location");X&&X.addEventListener("change",()=>{this._toggleTimerDraftLocation()}),this._setupTimerLocationSelector(),this.shadowRoot.querySelectorAll(".timer-day").forEach(c=>{c.addEventListener("click",f=>{let g=f.currentTarget?.dataset?.day;g&&this._toggleTimerDraftDay(g)})});let Y=this.shadowRoot.getElementById("timer-cancel");Y&&(Y.onclick=()=>this._closeTimerDraft());let J=this.shadowRoot.getElementById("timer-save-new");J&&(J.onclick=()=>this._saveNewTimer())}}getCardSize(){return 4}},B=class extends HTMLElement{setConfig(e){this._config={...e},this._render()}set hass(e){this._hass=e,this._suggestionsLoaded||(this._suggestionsLoaded=!0,this._loadSuggestions()),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}async _loadSuggestions(){if(this._hass){try{let[e,t]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]),i=e.filter(r=>r.platform==="webastoconnect"&&!r.hidden_by),n=i.map(r=>r.entity_id),d=new Set(i.map(r=>r.device_id).filter(Boolean));this._deviceSuggestions=t.filter(r=>d.has(r.id)).map(r=>({id:r.id,name:r.name_by_user||r.name||r.id})).sort((r,$)=>r.name.localeCompare($.name)),this._entitySuggestions=[...new Set(n)].sort()}catch{let t=Object.keys(this._hass.states||{}).filter(i=>i.includes("webasto"));this._entitySuggestions=[...new Set(t)].sort(),this._deviceSuggestions=[]}this._render()}}_datalistOptions(e){return(this._entitySuggestions||[]).filter(i=>e.includes(i.split(".")[0])).map(i=>`<option value="${s(i)}"></option>`).join("")}_handleInput(e){let t=e.target?.dataset?.field;if(!t)return;let i=String(e.target.value||"").trim(),n={...this._config||{}};i===""?delete n[t]:n[t]=i,this._config=n,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:n},bubbles:!0,composed:!0}))}_render(){if(!this.shadowRoot)return;let e=this._config||{},t=['<option value="">Select device automatically</option>',...(this._deviceSuggestions||[]).map(i=>`<option value="${s(i.id)}"${e.device_id===i.id?" selected":""}>${s(i.name)}</option>`)].join("");this.shadowRoot.innerHTML=`
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
          <input data-field="main_output_entity" list="webasto-options-switch" value="${s(e.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" list="webasto-options-switch" value="${s(e.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>Connected entity
          <input data-field="connected_entity" list="webasto-options-binary-sensor" value="${s(e.connected_entity)}" placeholder="binary_sensor.webasto_connected" />
        </label>
        <label>Timer sensor entity
          <input data-field="next_timer_entity" list="webasto-options-sensor" value="${s(e.next_timer_entity)}" placeholder="sensor.webasto_next_start" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" list="webasto-options-sensor" value="${s(e.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" list="webasto-options-sensor" value="${s(e.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" list="webasto-options-sensor" value="${s(e.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" list="webasto-options-location" value="${s(e.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${s(e.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <div class="hint">Pick a device to auto-resolve entities. Manual entity fields override auto-detection.</div>
      </div>
      <datalist id="webasto-options-switch">${this._datalistOptions(["switch"])}</datalist>
      <datalist id="webasto-options-binary-sensor">${this._datalistOptions(["binary_sensor"])}</datalist>
      <datalist id="webasto-options-sensor">${this._datalistOptions(["sensor"])}</datalist>
      <datalist id="webasto-options-location">${this._datalistOptions(["sensor","device_tracker"])}</datalist>
    `,this.shadowRoot.querySelectorAll("input, select").forEach(i=>{i.addEventListener("change",n=>this._handleInput(n))})}};customElements.get("webasto-connect-card")||customElements.define("webasto-connect-card",A);customElements.get("webasto-connect-card-editor")||customElements.define("webasto-connect-card-editor",B);window.customCards=window.customCards||[];window.customCards.push({type:"webasto-connect-card",name:"Webasto Connect Card",description:"Webasto Connect card with center toggle for main output",preview:!0});
