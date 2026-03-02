# Webasto Connect Card

Custom Home Assistant Lovelace card.

## Files
- `webasto-connect-card.js`: custom card module (add as Lovelace resource)
- `webasto_connect_card.yaml`: example card configuration

## Install in Home Assistant
From this repository root:

```bash
cp card/webasto-connect-card.js config/www/webasto-connect-card.js
```

Then add a Lovelace resource:
- URL: `/local/webasto-connect-card.js`
- Type: `module`

Use the example from `card/webasto_connect_card.yaml` and set your own entity IDs.
