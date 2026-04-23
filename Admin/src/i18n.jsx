import i18n from "i18next"
import detector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import translationTR from "./locales/tr/translation.json"
// import translationGr from "./locales/gr/translation.json"
// import translationIT from "./locales/it/translation.json"
// import translationRS from "./locales/rs/translation.json"
import translationSP from "./locales/sp/translation.json"
import translationENG from "./locales/eng/translation.json"
// import translationAR from "./locales/ar/translation.json"

// the translations
const resources = {
  tr: {
    translation: translationTR,
  },
  eng: {
    translation: translationENG,
  },
  sp: {
    translation: translationSP,
  },
  // ar: {
  //   translation: translationAR,
  // },
  // gr: {
  //   translation: translationGr,
  // },
  // it: {
  //   translation: translationIT,
  // },
  // rs: {
  //   translation: translationRS,
  // },
}

/** Safari Private / strict mode: localStorage throws → entire bundle fails before React mounts (white screen). */
function safeGetItem(key) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore — storage blocked */
  }
}

const language = safeGetItem("I18N_LANGUAGE");
if (!language) {
  safeSetItem("I18N_LANGUAGE", "tr");
}

i18n
  .use(detector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: safeGetItem("I18N_LANGUAGE") || "tr",
    fallbackLng: "tr", // use tr if detected lng is not available

    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

export default i18n
