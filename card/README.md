# Webasto Connect Card

Custom Home Assistant Lovelace card.

## Files
- `webasto-connect-card.js`: custom card module (add as Lovelace resource)
- `localize/localize.js`: translation lookup and language fallback
- `translations/*.json`: per-language strings
- `webasto_connect_card.yaml`: example card configuration

## Install in Home Assistant
From this repository root:

```bash
mkdir -p config/www/webasto-connect-card
cp -r card/* config/www/webasto-connect-card/
```

Then add a Lovelace resource:
- URL: `/local/webasto-connect-card/webasto-connect-card.js`
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
