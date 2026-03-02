const languages = {};
const loading = {};

function getNestedTranslation(obj, path) {
  if (!obj) return undefined;

  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result === undefined || result === null || typeof result !== "object") {
      return undefined;
    }
    result = result[key];
  }

  return typeof result === "string" ? result : undefined;
}

function resolveLanguage(language) {
  const raw = String(language || "en").toLowerCase();
  if (languages[raw]) return raw;

  const short = raw.split("-")[0];
  if (languages[short]) return short;

  return "en";
}

async function loadLanguage(lang) {
  if (languages[lang]) return;
  if (loading[lang]) {
    await loading[lang];
    return;
  }

  loading[lang] = (async () => {
    try {
      const url = new URL(`../translations/${lang}.json`, import.meta.url);
      const response = await fetch(url);
      if (!response.ok) {
        return;
      }
      languages[lang] = await response.json();
    } catch (_err) {
      // Ignore translation loading failures and fall back to keys/defaults.
    }
  })();

  await loading[lang];
}

export async function ensureTranslations(hass) {
  const lang = resolveLanguage(hass?.language);
  await loadLanguage("en");
  if (lang !== "en") {
    await loadLanguage(lang);
  }
}

export function localize(hass, key, vars = {}) {
  const lang = resolveLanguage(hass?.language);

  let translated =
    getNestedTranslation(languages[lang], key) ??
    getNestedTranslation(languages.en, key) ??
    key;

  Object.entries(vars).forEach(([name, value]) => {
    translated = translated.replace(`{${name}}`, String(value));
  });

  return translated;
}
