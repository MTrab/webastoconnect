globalThis.__WEBASTO_CONNECT_CARD_VERSION__ = "0.1.0b21";
var Q={card:{ui:{geo_fence:"Geo-fence",mode:"Modus",timers:"Timere",map:"Kort",heating:"Opvarmning",ventilation:"Ventilation",mode_unavailable:"Utilg\xE6ngelig",active:"Aktiv",inactive:"Ikke aktiv",offline_title:"Offline",offline_label:`ThermoConnect er ikke tilg\xE6ngelig
(intet netv\xE6rk)`,ending_now:"Slutter nu",left:"tilbage",main_output_missing:"V\xE6lg en Webasto-enhed eller main output entity i kortindstillinger",output:"Output",toggle_output:"Skift output",delete:"Slet",edit:"Rediger",deleting:"Sletter...",save:"Gem",close:"Luk",map_unavailable:"Lokation er ikke tilg\xE6ngelig",timers_empty:"Ingen timere konfigureret",add_timer:"Tilf\xF8j timer",update_timer:"Opdater timer",location:"Lokation",timer_use_location:"Angiv lokation",timer_location_optional:"Valgfrit. Sl\xE5 til for at knytte en kortlokation til timeren.",start_time:"Starttid",duration_minutes:"Varighed (min)",timer_enabled:"Aktiv",timer_disabled:"Deaktiveret",timer_once:"Kun \xE9n gang",timer_repeating:"Gentages",timers_manage_note:"Timere vist her tilh\xF8rer kun det aktive output.",timers_readonly_note:"Timerstyring kr\xE6ver en connected enhed og en valgt Webasto-enhed.",day_monday:"Man",day_tuesday:"Tir",day_wednesday:"Ons",day_thursday:"Tor",day_friday:"Fre",day_saturday:"L\xF8r",day_sunday:"S\xF8n"}}};var Z={card:{ui:{geo_fence:"Geo-fence",mode:"Mode",timers:"Timers",map:"Map",heating:"Heating",ventilation:"Ventilation",mode_unavailable:"Unavailable",active:"Active",inactive:"Inactive",offline_title:"Offline",offline_label:`ThermoConnect is unavailable
(no network)`,ending_now:"Ending now",left:"left",main_output_missing:"Select a Webasto device or main output entity in card settings",output:"Output",toggle_output:"Toggle output",delete:"Delete",edit:"Edit",deleting:"Deleting...",save:"Save",close:"Close",map_unavailable:"Location is unavailable",timers_empty:"No timers configured",add_timer:"Add timer",update_timer:"Update timer",location:"Location",timer_use_location:"Set location",timer_location_optional:"Optional. Enable to attach a map location to the timer.",start_time:"Start time",duration_minutes:"Duration (min)",timer_enabled:"Enabled",timer_disabled:"Disabled",timer_once:"One time",timer_repeating:"Repeating",timers_manage_note:"Timers shown here belong to the active output only.",timers_readonly_note:"Timer management requires a connected device and a selected Webasto device.",day_monday:"Mon",day_tuesday:"Tue",day_wednesday:"Wed",day_thursday:"Thu",day_friday:"Fri",day_saturday:"Sat",day_sunday:"Sun"}}};var tt={card:{ui:{geo_fence:"Geoaita",mode:"Tila",timers:"Ajastimet",map:"Kartta",heating:"L\xE4mmitys",ventilation:"Tuuletus",mode_unavailable:"Ei k\xE4ytett\xE4viss\xE4",active:"Aktiivinen",inactive:"Ei aktiivinen",offline_title:"Offline",offline_label:`ThermoConnect ei ole k\xE4ytett\xE4viss\xE4
(ei verkkoyhteytt\xE4)`,ending_now:"P\xE4\xE4ttyy nyt",left:"j\xE4ljell\xE4",main_output_missing:"Valitse kortin asetuksista Webasto-laite tai p\xE4\xE4ulostulon entiteetti",output:"L\xE4ht\xF6",toggle_output:"Vaihda l\xE4ht\xF6",delete:"Poista",edit:"Muokkaa",deleting:"Poistetaan...",save:"Tallenna",close:"Sulje",map_unavailable:"Sijainti ei ole k\xE4ytett\xE4viss\xE4",timers_empty:"Ajastimia ei ole m\xE4\xE4ritetty",add_timer:"Lis\xE4\xE4 ajastin",update_timer:"P\xE4ivit\xE4 ajastin",location:"Sijainti",timer_use_location:"Aseta sijainti",timer_location_optional:"Valinnainen. Ota k\xE4ytt\xF6\xF6n liitt\xE4\xE4ksesi karttasijainnin ajastimeen.",start_time:"Aloitusaika",duration_minutes:"Kesto (min)",timer_enabled:"K\xE4yt\xF6ss\xE4",timer_disabled:"Pois k\xE4yt\xF6st\xE4",timer_once:"Kerran",timer_repeating:"Toistuva",timers_manage_note:"T\xE4ss\xE4 n\xE4kyv\xE4t ajastimet kuuluvat vain aktiiviseen l\xE4ht\xF6\xF6n.",timers_readonly_note:"Ajastimien hallinta edellytt\xE4\xE4 yhdistetty\xE4 laitetta ja valittua Webasto-laitetta.",day_monday:"Ma",day_tuesday:"Ti",day_wednesday:"Ke",day_thursday:"To",day_friday:"Pe",day_saturday:"La",day_sunday:"Su"}}};var M={da:Q,en:Z,fi:tt};function et(c,t){if(!c)return;let e=t.split("."),i=c;for(let o of e){if(i==null||typeof i!="object")return;i=i[o]}return typeof i=="string"?i:void 0}function Tt(c){let t=String(c||"en").toLowerCase();if(M[t])return t;let e=t.split("-")[0];return M[e]?e:"en"}function a(c,t,e={}){let i=Tt(c?.language),o=et(M[i],t)??et(M.en,t)??t;return Object.entries(e).forEach(([l,r])=>{o=o.replace(`{${l}}`,String(r))}),o}function s(c){return String(c??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function C(c){return c?.device_class||c?.original_device_class||null}var j=class extends HTMLElement{static getConfigElement(){return document.createElement("webasto-connect-card-editor")}static getStubConfig(){return{device_id:""}}setConfig(t){this._config={connected_entity:t?.connected_entity,ventilation_mode_entity:t?.ventilation_mode_entity,next_timer_entity:t?.next_timer_entity,end_time_entity:t?.end_time_entity,...t}}set hass(t){this._hass=t,this._loadRegistryData(),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_getState(t){return t?this._hass?.states?.[t]:void 0}async _loadRegistryData(){if(!(!this._hass||this._registryDataLoaded||this._registryDataLoading)){this._registryDataLoading=!0;try{let[t,e]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]);this._entityRegistry=Array.isArray(t)?t:[],this._deviceRegistry=Array.isArray(e)?e:[],this._registryDataLoaded=!0}catch{this._entityRegistry=[],this._deviceRegistry=[]}finally{this._registryDataLoading=!1,this._render()}}}_entriesForSelectedDevice(){let t=this._config?.device_id;return!t||!Array.isArray(this._entityRegistry)?[]:this._entityRegistry.filter(e=>e?.platform==="webastoconnect"&&e?.device_id===t&&!e?.hidden_by)}_pickEntry(t,e){return t.find(i=>e(i))?.entity_id}_resolveEntities(){let t=this._entriesForSelectedDevice(),e=this._config||{};return{main_output_entity:e.main_output_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("switch.")&&i.entity_category==null&&i.original_name!=="AUX1"&&i.original_name!=="AUX2"),ventilation_mode_entity:e.ventilation_mode_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("switch.")&&i.original_name==="Ventilation Mode"),end_time_entity:e.end_time_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&C(i)==="timestamp"&&i.original_name!=="Next start"),temperature_entity:e.temperature_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&(C(i)==="temperature"||i.original_name==="Temperature")),battery_entity:e.battery_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&(C(i)==="voltage"||i.original_name==="Battery")),connected_entity:e.connected_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("binary_sensor.")&&i.original_name==="Connected"),next_timer_entity:e.next_timer_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("sensor.")&&i.original_name==="Next start"),location_entity:e.location_entity||this._pickEntry(t,i=>i.entity_id?.startsWith("device_tracker."))}}_isConnected(t){return t?t.state!=="off":!0}_parseEndDate(t){if(t==null||t==="")return null;let e=Number(t);if(Number.isFinite(e)){let o=e<1e12?e*1e3:e,l=new Date(o);return Number.isNaN(l.getTime())?null:l}let i=new Date(String(t));return Number.isNaN(i.getTime())?null:i}_computeLabel(t,e){if(!t||t.state!=="on")return a(this._hass,"card.ui.inactive");if(!e||!e.state||e.state==="unknown"||e.state==="unavailable")return a(this._hass,"card.ui.active");let i=this._parseEndDate(e.state);if(!i)return a(this._hass,"card.ui.active");let o=Math.ceil((i.getTime()-Date.now())/6e4);if(o<=0)return a(this._hass,"card.ui.ending_now");let l=Math.floor(o/60),r=o%60;return`${l}:${String(r).padStart(2,"0")} ${a(this._hass,"card.ui.left")}`}_computeOutputName(t){let e=t?.attributes?.friendly_name;return typeof e=="string"&&e.trim()!==""?e:a(this._hass,"card.ui.output")}_toggleMainOutput(){let t=this._resolveEntities().main_output_entity;if(!this._hass||!t||!this._hass.states?.[t]){console.warn("[webasto-connect-card] Missing or unavailable main_output_entity:",t);return}this._hass.callService("homeassistant","toggle",{entity_id:t})}_stateWithUnit(t){if(!t)return"--";let e=t.state;if(e==="unknown"||e==="unavailable")return"--";let i=t.attributes?.unit_of_measurement;return i?`${e} ${i}`:String(e)}_locationText(t){if(!t)return"--";let e=String(t.state??"");if(e!==""&&e!=="unknown"&&e!=="unavailable"&&e!=="not_home")return e;let i=t.attributes?.latitude,o=t.attributes?.longitude;return typeof i=="number"&&typeof o=="number"?`${i.toFixed(5)}, ${o.toFixed(5)}`:"--"}_isMapEnabled(t,e){return!t||!t.startsWith("device_tracker.")||!e?!1:e.state!=="unknown"&&e.state!=="unavailable"}_openMapPopup(){let t=this._resolveEntities().location_entity,e=this._getState(t);this._isMapEnabled(t,e)&&(this._mapPopupOpen=!0,this._render())}_closeMapPopup(){this._mapPopupOpen=!1,this._render()}_openTimersPopup(){this._timersPopupOpen=!0,this._render()}_closeTimersPopup(){this._timersPopupOpen=!1,this._timerDraftOpen=!1,this._timerDraft=void 0,this._render()}_defaultTimerDraft(){return{timer_index:null,start_time:"07:00",duration_minutes:"30",enabled:!0,repeat_days:[],use_location:!1,location:null,had_location:!1}}_repeatDaysFromMask(t){let e=Number(t);return!Number.isFinite(e)||e<=0?[]:this._weekdayOptions().filter(([i])=>{let o={monday:1,tuesday:2,wednesday:4,thursday:8,friday:16,saturday:32,sunday:64}[i];return(e&o)!==0}).map(([i])=>i)}_draftFromTimer(t){let e=t.latitude!=null&&t.longitude!=null;return{timer_index:t.index,start_time:this._formatTimerStart(t),duration_minutes:String(Math.max(1,Math.round(Number(t.duration||0)/60))),enabled:!!t.enabled,repeat_days:this._repeatDaysFromMask(t.repeat),use_location:e,location:e?{latitude:Number(t.latitude),longitude:Number(t.longitude)}:null,had_location:e}}_openTimerDraft(t=null){this._timerDraftOpen=!0,this._timerDraft=t?this._draftFromTimer(t):this._defaultTimerDraft(),this._render()}_closeTimerDraft(){this._timerDraftOpen=!1,this._timerDraft=void 0,this._render()}_setTimerDraftField(t,e){let i=this._timerDraft||this._defaultTimerDraft();this._timerDraft={...i,[t]:e},this._render()}_toggleTimerDraftDay(t){let e=this._timerDraft||this._defaultTimerDraft(),i=new Set(e.repeat_days||[]);i.has(t)?i.delete(t):i.add(t),this._timerDraft={...e,repeat_days:[...i]},this._render()}_toggleTimerDraftLocation(){let t=this._timerDraft||this._defaultTimerDraft(),e=!t.use_location,i=this._getState(this._resolveEntities().location_entity),o=i&&Number.isFinite(Number(i.attributes?.latitude))&&Number.isFinite(Number(i.attributes?.longitude))?{latitude:Number(i.attributes.latitude),longitude:Number(i.attributes.longitude)}:null;this._timerDraft={...t,use_location:e,location:e?t.location??o:null},this._render()}_saveTimerDraft(){let t=this._config?.device_id,e=this._timerDraft;if(!this._hass||!t||!e?.start_time||!e?.duration_minutes)return;let i={device_id:t,start_time:e.start_time,duration_minutes:Number(e.duration_minutes),enabled:!!e.enabled,repeat_days:e.repeat_days||[]};e.use_location&&e.location&&typeof e.location=="object"&&Number.isFinite(Number(e.location.latitude))&&Number.isFinite(Number(e.location.longitude))&&(i.location={latitude:Number(e.location.latitude),longitude:Number(e.location.longitude)}),!e.use_location&&e.had_location&&(i.clear_location=!0);let o=Number.isInteger(e.timer_index)?"update_timer":"create_timer";o==="update_timer"&&(i.timer_index=e.timer_index),this._hass.callService("webastoconnect",o,i),this._closeTimerDraft()}_setupTimerLocationSelector(){if(!this._hass||!this._timerDraftOpen)return;let t=this.shadowRoot?.getElementById("timer-location");if(!t)return;t.hass=this._hass,t.selector={location:{}},t.value=this._timerDraft?.location??null;let e=i=>{let o=i?.detail?.value??t.value??null;this._setTimerDraftField("location",o)};t.addEventListener("value-changed",e),t.addEventListener("change",e)}_resolveMode(t){return!t||t.state==="unknown"||t.state==="unavailable"?null:t.state==="on"?"ventilation":"heating"}_modeLabel(t){return t==="ventilation"?a(this._hass,"card.ui.ventilation"):t==="heating"?a(this._hass,"card.ui.heating"):a(this._hass,"card.ui.mode_unavailable")}_isModeSelectable(t){return!!(t&&this._getState(t))}_openModePopup(){let t=this._resolveEntities().ventilation_mode_entity,e=this._getState(t);this._isModeSelectable(t)&&(this._modeDraft=this._resolveMode(e)||"heating",this._modePopupOpen=!0,this._render())}_closeModePopup(){this._modePopupOpen=!1,this._modeDraft=void 0,this._render()}_selectModeDraft(t){this._modeDraft=t,this._render()}_saveModeSelection(){let t=this._resolveEntities().ventilation_mode_entity;if(!this._hass||!t||!this._modeDraft)return;let e=this._modeDraft==="ventilation"?"turn_on":"turn_off";this._hass.callService("homeassistant",e,{entity_id:t}),this._closeModePopup()}_timerItems(t){let e=t?.attributes?.timers;return Array.isArray(e)?e.filter(i=>i&&typeof i=="object").map((i,o)=>({...i,index:o,line_code:i.line_code||i.line||"OUTH"})):[]}_activeLine(t){return this._resolveMode(t)==="ventilation"?"OUTV":"OUTH"}_formatTimerRepeat(t){return t.repeat?a(this._hass,"card.ui.timer_repeating"):a(this._hass,"card.ui.timer_once")}_formatTimerStart(t){let e=Number(t?.start);if(!Number.isFinite(e)||e<0)return"--:--";let i=Math.floor(e/60)%24,o=e%60,l=new Date,r=new Date(Date.UTC(l.getUTCFullYear(),l.getUTCMonth(),l.getUTCDate(),i,o,0,0));return`${String(r.getHours()).padStart(2,"0")}:${String(r.getMinutes()).padStart(2,"0")}`}_canManageTimers(t,e){return!!t&&e}_weekdayOptions(){return[["monday",a(this._hass,"card.ui.day_monday")],["tuesday",a(this._hass,"card.ui.day_tuesday")],["wednesday",a(this._hass,"card.ui.day_wednesday")],["thursday",a(this._hass,"card.ui.day_thursday")],["friday",a(this._hass,"card.ui.day_friday")],["saturday",a(this._hass,"card.ui.day_saturday")],["sunday",a(this._hass,"card.ui.day_sunday")]]}_toggleTimerEnabled(t){let e=this._config?.device_id;!this._hass||!e||this._hass.callService("webastoconnect","update_timer",{device_id:e,timer_index:t.index,enabled:!t.enabled})}_deleteTimer(t,e){let i=this._config?.device_id;!this._hass||!i||(e&&(e.disabled=!0,e.textContent=a(this._hass,"card.ui.deleting")),Promise.resolve(this._hass.callService("webastoconnect","delete_timer",{device_id:i,timer_index:t.index})).finally(()=>{e?.isConnected&&(e.disabled=!1,e.textContent=a(this._hass,"card.ui.delete"))}))}async _renderMapPopup(t){let e=this.shadowRoot?.getElementById("map-card-host");if(!(!e||!this._hass||!t)){e.innerHTML="";try{let o=await(await window.loadCardHelpers?.())?.createCardElement?.({type:"map",entities:[t]});if(!o){e.innerHTML=`<div class="map-unavailable">${s(a(this._hass,"card.ui.map_unavailable"))}</div>`;return}o.hass=this._hass,o.style.display="block",o.style.height="360px",e.appendChild(o)}catch{e.innerHTML=`<div class="map-unavailable">${s(a(this._hass,"card.ui.map_unavailable"))}</div>`}}}_render(){if(!this.shadowRoot||!this._config||!this._hass)return;let t=this._resolveEntities(),e=this._getState(t.main_output_entity),i=this._getState(t.end_time_entity),o=this._getState(t.temperature_entity),l=this._getState(t.battery_entity),r=this._getState(t.location_entity),D=this._getState(t.ventilation_mode_entity),it=this._getState(t.connected_entity),at=this._getState(t.next_timer_entity),u=this._isConnected(it),ot=this._activeLine(D),v=this._timerItems(at).filter(n=>n.line_code===ot),q=!!e,nt=q&&e.state==="on",st=u&&nt?"#d33131":"#c5cfdf",B=u?this._computeOutputName(e):a(this._hass,"card.ui.offline_title"),F=u?q?this._computeLabel(e,i):a(this._hass,"card.ui.main_output_missing"):a(this._hass,"card.ui.offline_label"),rt=u?this._stateWithUnit(o):"--",dt=u?this._stateWithUnit(l):"--",lt=this._locationText(r),W=u?this._config.center_icon||e?.attributes?.icon||"mdi:car-defrost-rear":"mdi:signal-off",ct="",L=a(this._hass,"card.ui.mode"),R=a(this._hass,"card.ui.timers"),O=a(this._hass,"card.ui.map"),mt=a(this._hass,"card.ui.toggle_output"),x=u&&this._isModeSelectable(t.ventilation_mode_entity),ut=x?"mode-enabled":"mode-disabled",pt=x?"0":"-1",ht=x?"false":"true",U=this._modePopupOpen&&x,H=this._modeDraft||this._resolveMode(D)||"heating",_t=a(this._hass,"card.ui.save"),w=this._isMapEnabled(t.location_entity,r),ft=w?"map-enabled":"map-disabled",gt=w?"0":"-1",bt=w?"false":"true",V=this._mapPopupOpen&&w,k=!!t.next_timer_entity,yt=k?"timers-enabled":"timers-disabled",vt=k?"0":"-1",xt=k?"false":"true",K=this._timersPopupOpen&&k,b=this._canManageTimers(this._config?.device_id,u),f=this._timerDraft||this._defaultTimerDraft(),G=this._timerDraftOpen&&b,S=a(this._hass,"card.ui.close");this.shadowRoot.innerHTML=`
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
          border: 10px solid ${st};
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
        .timer-edit,
        .timer-delete {
          border: 0;
          border-radius: 10px;
          padding: 8px 10px;
          background: var(--secondary-background-color, #eee);
          color: var(--primary-text-color, #111);
          cursor: pointer;
          font: inherit;
        }
        .timer-edit[disabled],
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
          <div class="q tl">${ct}</div>
          <div class="q tr ${ut}" id="mode-action" role="button" tabindex="${pt}" aria-disabled="${ht}">
            <span class="q-label">${L}</span>
          </div>
          <div class="q bl ${yt}" id="timers-action" role="button" tabindex="${vt}" aria-disabled="${xt}">${R}</div>
          <div class="q br ${ft}" id="map-action" role="button" tabindex="${gt}" aria-disabled="${bt}">${O}</div>
          <div class="divider-v"></div>
          <div class="divider-h"></div>
          <div class="center-wrap ${u?"":"offline"}" id="center-toggle" role="button" tabindex="0" aria-label="${mt}">
            ${u?`
            <ha-icon class="icon" icon="${W}" style="--mdc-icon-size: 96px;"></ha-icon>
            <div class="name">${B}</div>
            <div class="label">${F}</div>
            `:`
            <div class="offline-copy">${F}</div>
            <ha-icon class="icon" icon="${W}" style="--mdc-icon-size: 72px;"></ha-icon>
            <div class="name">${B}</div>
            `}
          </div>
        </ha-card>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-item"><ha-icon icon="mdi:thermometer" style="--mdc-icon-size: 24px;"></ha-icon>${rt}</span>
            <span class="meta-item"><ha-icon icon="mdi:car-battery" style="--mdc-icon-size: 24px;"></ha-icon>${dt}</span>
          </div>
          <div class="meta-location"><ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 24px;"></ha-icon>${lt}</div>
        </div>
      </div>
      ${U?`
      <div class="modal-backdrop" id="mode-modal-backdrop">
        <div class="mode-modal" role="dialog" aria-modal="true" aria-label="${L}">
          <div class="mode-modal-header">
            <span>${L}</span>
            <button class="modal-close" id="mode-modal-close">${S}</button>
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
              <button class="mode-save" id="mode-save">${_t}</button>
            </div>
          </div>
        </div>
      </div>
      `:""}
      ${K?`
      <div class="modal-backdrop" id="timers-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${R}">
          <div class="modal-header">
            <span>${R}</span>
            <button class="modal-close" id="timers-modal-close">${S}</button>
          </div>
          <div class="timers-modal-body">
            ${G?`
            <div class="timer-form">
              <div class="timer-form-grid">
                <label>${s(a(this._hass,"card.ui.start_time"))}
                  <input id="timer-start-time" type="time" value="${s(f.start_time)}">
                </label>
                <label>${s(a(this._hass,"card.ui.duration_minutes"))}
                  <input id="timer-duration" type="number" min="1" max="1440" value="${s(f.duration_minutes)}">
                </label>
              </div>
              <label class="timer-location-toggle">
                <input id="timer-use-location" type="checkbox" ${f.use_location?"checked":""}>
                <span>${s(a(this._hass,"card.ui.timer_use_location"))}</span>
              </label>
              <div class="timer-location-help">${s(a(this._hass,"card.ui.timer_location_optional"))}</div>
              ${f.use_location?`
              <label class="timer-location-field">${s(a(this._hass,"card.ui.location"))}
                <ha-selector id="timer-location"></ha-selector>
              </label>
              `:""}
              <label class="timer-checkbox">
                <input id="timer-enabled" type="checkbox" ${f.enabled?"checked":""}>
                <span>${s(a(this._hass,"card.ui.timer_enabled"))}</span>
              </label>
              <div class="timer-days">
                ${this._weekdayOptions().map(([n,m])=>`
                <button class="timer-day ${(f.repeat_days||[]).includes(n)?"selected":""}" data-day="${n}" type="button">${s(m)}</button>
                `).join("")}
              </div>
              <div class="timer-form-actions">
                <button class="timer-form-secondary" id="timer-cancel" type="button">${s(S)}</button>
                <button class="timer-form-primary" id="timer-save-new" type="button">${s(Number.isInteger(f.timer_index)?a(this._hass,"card.ui.update_timer"):a(this._hass,"card.ui.add_timer"))}</button>
              </div>
            </div>
            `:""}
            ${v.length?`
            <div class="timers-list">
              ${v.map(n=>`
              <div class="timer-row">
                <div class="timer-main">
                  <div class="timer-title">${s(this._formatTimerStart(n))}</div>
                  <div class="timer-meta">${s(this._formatTimerRepeat(n))} \xB7 ${n.enabled?s(a(this._hass,"card.ui.timer_enabled")):s(a(this._hass,"card.ui.timer_disabled"))}</div>
                </div>
                <div class="timer-actions">
                  <ha-switch class="timer-toggle" data-timer-index="${n.index}" ${n.enabled?"checked":""} ${b?"":"disabled"}></ha-switch>
                  <button class="timer-edit" data-edit-index="${n.index}" ${b?"":"disabled"}>${s(a(this._hass,"card.ui.edit"))}</button>
                  <button class="timer-delete" data-delete-index="${n.index}" ${b?"":"disabled"}>${s(a(this._hass,"card.ui.delete"))}</button>
                </div>
              </div>
              `).join("")}
            </div>
            `:`<div class="timers-empty">${s(a(this._hass,"card.ui.timers_empty"))}</div>`}
            ${b&&!G?`
            <div class="timer-add-wrap">
              <button class="timer-add" id="timer-add" type="button">${s(a(this._hass,"card.ui.add_timer"))}</button>
            </div>
            `:""}
            <div class="timers-note">${s(b?a(this._hass,"card.ui.timers_manage_note"):a(this._hass,"card.ui.timers_readonly_note"))}</div>
          </div>
        </div>
      </div>
      `:""}
      ${V?`
      <div class="modal-backdrop" id="map-modal-backdrop">
        <div class="modal-shell" role="dialog" aria-modal="true" aria-label="${O}">
          <div class="modal-header">
            <span>${O}</span>
            <button class="modal-close" id="map-modal-close">${S}</button>
          </div>
          <div class="map-card-host" id="map-card-host"></div>
        </div>
      </div>
      `:""}
    `;let P=this.shadowRoot.getElementById("center-toggle");P&&u&&(P.onclick=()=>this._toggleMainOutput(),P.onkeydown=n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),this._toggleMainOutput())});let I=this.shadowRoot.getElementById("mode-action");I&&x&&(I.onclick=()=>this._openModePopup(),I.onkeydown=n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),this._openModePopup())});let N=this.shadowRoot.getElementById("timers-action");N&&k&&(N.onclick=()=>this._openTimersPopup(),N.onkeydown=n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),this._openTimersPopup())});let A=this.shadowRoot.getElementById("map-action");if(A&&w&&(A.onclick=()=>this._openMapPopup(),A.onkeydown=n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),this._openMapPopup())}),V){this._renderMapPopup(t.location_entity);let n=this.shadowRoot.getElementById("map-modal-close");n&&(n.onclick=()=>this._closeMapPopup());let m=this.shadowRoot.getElementById("map-modal-backdrop");m&&(m.onclick=g=>{g.target===m&&this._closeMapPopup()})}if(U){let n=this.shadowRoot.getElementById("mode-modal-close");n&&(n.onclick=()=>this._closeModePopup());let m=this.shadowRoot.getElementById("mode-option-ventilation");m&&(m.onclick=()=>this._selectModeDraft("ventilation"));let g=this.shadowRoot.getElementById("mode-option-heating");g&&(g.onclick=()=>this._selectModeDraft("heating"));let $=this.shadowRoot.getElementById("mode-save");$&&($.onclick=()=>this._saveModeSelection());let y=this.shadowRoot.getElementById("mode-modal-backdrop");y&&(y.onclick=E=>{E.target===y&&this._closeModePopup()})}if(K){let n=this.shadowRoot.getElementById("timers-modal-close");n&&(n.onclick=()=>this._closeTimersPopup());let m=this.shadowRoot.getElementById("timers-modal-backdrop");m&&(m.onclick=d=>{d.target===m&&this._closeTimersPopup()}),this.shadowRoot.querySelectorAll(".timer-toggle").forEach(d=>{d.addEventListener("change",p=>{let h=Number(p.currentTarget?.dataset?.timerIndex),_=v.find(T=>T.index===h);_&&this._toggleTimerEnabled(_)})}),this.shadowRoot.querySelectorAll(".timer-delete").forEach(d=>{d.addEventListener("click",p=>{let h=Number(p.currentTarget?.dataset?.deleteIndex),_=v.find(T=>T.index===h);_&&this._deleteTimer(_,p.currentTarget)})}),this.shadowRoot.querySelectorAll(".timer-edit").forEach(d=>{d.addEventListener("click",p=>{let h=Number(p.currentTarget?.dataset?.editIndex),_=v.find(T=>T.index===h);_&&this._openTimerDraft(_)})});let g=this.shadowRoot.getElementById("timer-add");g&&(g.onclick=()=>this._openTimerDraft());let $=this.shadowRoot.getElementById("timer-start-time");$&&$.addEventListener("change",d=>{this._setTimerDraftField("start_time",d.currentTarget.value)});let y=this.shadowRoot.getElementById("timer-duration");y&&y.addEventListener("change",d=>{this._setTimerDraftField("duration_minutes",d.currentTarget.value)});let E=this.shadowRoot.getElementById("timer-enabled");E&&E.addEventListener("change",d=>{this._setTimerDraftField("enabled",d.currentTarget.checked)});let X=this.shadowRoot.getElementById("timer-use-location");X&&X.addEventListener("change",()=>{this._toggleTimerDraftLocation()}),this._setupTimerLocationSelector(),this.shadowRoot.querySelectorAll(".timer-day").forEach(d=>{d.addEventListener("click",p=>{let h=p.currentTarget?.dataset?.day;h&&this._toggleTimerDraftDay(h)})});let Y=this.shadowRoot.getElementById("timer-cancel");Y&&(Y.onclick=()=>this._closeTimerDraft());let J=this.shadowRoot.getElementById("timer-save-new");J&&(J.onclick=()=>this._saveTimerDraft())}}getCardSize(){return 4}},z=class extends HTMLElement{setConfig(t){this._config={...t},this._render()}set hass(t){this._hass=t,this._suggestionsLoaded||(this._suggestionsLoaded=!0,this._loadSuggestions()),this._render()}connectedCallback(){this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}async _loadSuggestions(){if(this._hass){try{let[t,e]=await Promise.all([this._hass.callWS({type:"config/entity_registry/list"}),this._hass.callWS({type:"config/device_registry/list"})]),i=t.filter(r=>r.platform==="webastoconnect"&&!r.hidden_by),o=i.map(r=>r.entity_id),l=new Set(i.map(r=>r.device_id).filter(Boolean));this._deviceSuggestions=e.filter(r=>l.has(r.id)).map(r=>({id:r.id,name:r.name_by_user||r.name||r.id})).sort((r,D)=>r.name.localeCompare(D.name)),this._entitySuggestions=[...new Set(o)].sort()}catch{let e=Object.keys(this._hass.states||{}).filter(i=>i.includes("webasto"));this._entitySuggestions=[...new Set(e)].sort(),this._deviceSuggestions=[]}this._render()}}_datalistOptions(t){return(this._entitySuggestions||[]).filter(i=>t.includes(i.split(".")[0])).map(i=>`<option value="${s(i)}"></option>`).join("")}_handleInput(t){let e=t.target?.dataset?.field;if(!e)return;let i=String(t.target.value||"").trim(),o={...this._config||{}};i===""?delete o[e]:o[e]=i,this._config=o,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:o},bubbles:!0,composed:!0}))}_render(){if(!this.shadowRoot)return;let t=this._config||{},e=['<option value="">Select device automatically</option>',...(this._deviceSuggestions||[]).map(i=>`<option value="${s(i.id)}"${t.device_id===i.id?" selected":""}>${s(i.name)}</option>`)].join("");this.shadowRoot.innerHTML=`
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
          <input data-field="main_output_entity" list="webasto-options-switch" value="${s(t.main_output_entity)}" placeholder="switch.webasto_main_output" />
        </label>
        <label>Ventilation mode entity
          <input data-field="ventilation_mode_entity" list="webasto-options-switch" value="${s(t.ventilation_mode_entity)}" placeholder="switch.webasto_ventilation_mode" />
        </label>
        <label>Connected entity
          <input data-field="connected_entity" list="webasto-options-binary-sensor" value="${s(t.connected_entity)}" placeholder="binary_sensor.webasto_connected" />
        </label>
        <label>Timer sensor entity
          <input data-field="next_timer_entity" list="webasto-options-sensor" value="${s(t.next_timer_entity)}" placeholder="sensor.webasto_next_start" />
        </label>
        <label>End-time sensor entity
          <input data-field="end_time_entity" list="webasto-options-sensor" value="${s(t.end_time_entity)}" placeholder="sensor.webasto_main_output_end_time" />
        </label>
        <label>Temperature entity
          <input data-field="temperature_entity" list="webasto-options-sensor" value="${s(t.temperature_entity)}" placeholder="sensor.webasto_temperature" />
        </label>
        <label>Battery entity
          <input data-field="battery_entity" list="webasto-options-sensor" value="${s(t.battery_entity)}" placeholder="sensor.webasto_battery_voltage" />
        </label>
        <label>Location entity
          <input data-field="location_entity" list="webasto-options-location" value="${s(t.location_entity)}" placeholder="device_tracker.webasto_location" />
        </label>
        <label>Center icon
          <input data-field="center_icon" value="${s(t.center_icon)}" placeholder="mdi:car-defrost-rear" />
        </label>
        <div class="hint">Pick a device to auto-resolve entities. Manual entity fields override auto-detection.</div>
      </div>
      <datalist id="webasto-options-switch">${this._datalistOptions(["switch"])}</datalist>
      <datalist id="webasto-options-binary-sensor">${this._datalistOptions(["binary_sensor"])}</datalist>
      <datalist id="webasto-options-sensor">${this._datalistOptions(["sensor"])}</datalist>
      <datalist id="webasto-options-location">${this._datalistOptions(["sensor","device_tracker"])}</datalist>
    `,this.shadowRoot.querySelectorAll("input, select").forEach(i=>{i.addEventListener("change",o=>this._handleInput(o))})}};customElements.get("webasto-connect-card")||customElements.define("webasto-connect-card",j);customElements.get("webasto-connect-card-editor")||customElements.define("webasto-connect-card-editor",z);window.customCards=window.customCards||[];window.customCards.push({type:"webasto-connect-card",name:"Webasto Connect Card",description:"Webasto Connect card with center toggle for main output",preview:!0});
