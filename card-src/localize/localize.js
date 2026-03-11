import cs from "../translations/cs.json";
import da from "../translations/da.json";
import en from "../translations/en.json";
import fi from "../translations/fi.json";
import nl from "../translations/nl.json";

const languages = {
  cs,
  da,
  en,
  fi,
  nl,
};

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
