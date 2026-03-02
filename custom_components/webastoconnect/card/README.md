# Webasto Connect Card

Custom Home Assistant Lovelace card.

## Files
- `webasto-connect-card.js`: source for the custom card
- `dist/webasto-connect-card.js`: built single-file card module (generated)
- `localize/localize.js`: translation lookup and language fallback
- `translations/*.json`: per-language strings
- `webasto_connect_card.yaml`: example card configuration

## Build (separate from release)
From repository root:

```bash
cd custom_components/webastoconnect/card
npm install
npm run build
```

For iterative testing while developing:

```bash
cd custom_components/webastoconnect/card
npm run build:watch
```

## Install in Home Assistant
The integration auto-installs card assets on load/update to:
- `config/www/webastoconnect/webasto-connect-card.js`
- `config/www/webastoconnect/localize/*`
- `config/www/webastoconnect/translations/*`

Manual install is optional:

From this repository root:

```bash
mkdir -p config/www/webastoconnect
cp -r custom_components/webastoconnect/card/* config/www/webastoconnect/
```

Then add a Lovelace resource:
- URL: `/local/webastoconnect/webasto-connect-card.js`
- Type: `module`

Use the example from `card/webasto_connect_card.yaml` and set your own entity IDs.

## Language / translations
- The card auto-selects text from Home Assistant language (`hass.language`).
- Built-in translations currently include `da` and `en` (fallback: `en`).
- You can still override corner titles with:
  - `title_geo_fence`
  - `title_mode`
  - `title_timers`
  - `title_map`
