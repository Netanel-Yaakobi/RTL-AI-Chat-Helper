// Handles the extension popup UI.

(function () {
  "use strict";

  const LANGUAGES = {
    en: {
      title: "RTL AI Chat Helper",
      subtitle: "Smart direction for AI chats",
      globalToggle: "Enable or disable the extension",
      currentSite: "Current site",
      detected: "detected",
      unknownSite: "Unsupported site",
      interfaceLanguage: "Interface language",
      siteRtl: "RTL on this site",
      siteRtlDesc: "Use only for the current AI website.",
      inputBox: "Writing box",
      inputDesc: "Right-align Hebrew and Arabic while typing.",
      messages: "Messages and replies",
      messagesDesc: "Fix RTL reading in conversations.",
      codeLTR: "Code stays LTR",
      codeDesc: "Code blocks are protected automatically.",
      alwaysOn: "Always on",
      resetDefaults: "Reset defaults",
      supportProject: "Support the project ☕",
      createdBy: "Created by"
    },
    he: {
      title: "RTL AI Chat Helper",
      subtitle: "כיוון חכם לשיחות AI",
      globalToggle: "הפעל או כבה את התוסף",
      currentSite: "האתר הנוכחי",
      detected: "זוהה",
      unknownSite: "אתר לא נתמך",
      interfaceLanguage: "שפת הממשק",
      siteRtl: "RTL באתר הזה",
      siteRtlDesc: "כיבוי נקודתי בלי לכבות את כל התוסף.",
      inputBox: "תיבת הכתיבה",
      inputDesc: "עברית וערבית מיושרות לימין בזמן ההקלדה.",
      messages: "הודעות ותשובות",
      messagesDesc: "תיקון קריאה של שיחות RTL.",
      codeLTR: "קוד נשאר LTR",
      codeDesc: "בלוקים של קוד מוגנים אוטומטית.",
      alwaysOn: "קבוע",
      resetDefaults: "איפוס הגדרות",
      supportProject: "Support the project ☕",
      createdBy: "Created by"
    },
    ar: {
      title: "RTL AI Chat Helper",
      subtitle: "اتجاه ذكي لمحادثات الذكاء الاصطناعي",
      globalToggle: "تشغيل أو إيقاف الإضافة",
      currentSite: "الموقع الحالي",
      detected: "تم التعرف على",
      unknownSite: "موقع غير مدعوم",
      interfaceLanguage: "لغة الواجهة",
      siteRtl: "RTL في هذا الموقع",
      siteRtlDesc: "إيقاف هذا الموقع فقط بدون إيقاف الإضافة.",
      inputBox: "صندوق الكتابة",
      inputDesc: "محاذاة العربية والعبرية لليمين أثناء الكتابة.",
      messages: "الرسائل والردود",
      messagesDesc: "تحسين قراءة محادثات RTL.",
      codeLTR: "الكود يبقى LTR",
      codeDesc: "تتم حماية كتل الكود تلقائيا.",
      alwaysOn: "دائما",
      resetDefaults: "إعادة الضبط",
      supportProject: "Support the project ☕",
      createdBy: "Created by"
    }
  };

  const SITE_LABELS = {
    "chatgpt.com": "ChatGPT",
    "claude.ai": "Claude",
    "gemini.google.com": "Gemini"
  };

  const toggleEnabled = document.getElementById("toggle-enabled");
  const languageSelect = document.getElementById("ui-language");
  const siteNameEl = document.getElementById("site-name");
  const siteDomainEl = document.getElementById("site-domain");
  const toggleSite = document.getElementById("toggle-site");
  const toggleInput = document.getElementById("toggle-input");
  const toggleMessages = document.getElementById("toggle-messages");
  const btnReset = document.getElementById("btn-reset");
  const btnYaapps = document.getElementById("btn-yaapps");
  const btnDonate = document.getElementById("btn-donate");

  let currentDomain = null;
  let supportedDomain = null;
  let allSelectors = {};
  let allSiteSettings = {};
  let uiLanguage = "en";

  function domainFromHost(hostname) {
    for (const key of Object.keys(NATI_DEFAULTS)) {
      if (hostname === key || hostname.endsWith("." + key)) return key;
    }
    return hostname;
  }

  function defaultSiteSettings() {
    return {
      enabled: true,
      input: true,
      messages: true
    };
  }

  function getCurrentSettings() {
    if (!supportedDomain) return defaultSiteSettings();
    return Object.assign(defaultSiteSettings(), allSiteSettings[supportedDomain] || {});
  }

  function saveSiteSettings(settings) {
    if (!supportedDomain) return;
    allSiteSettings[supportedDomain] = settings;
    chrome.storage.local.set({ siteSettings: allSiteSettings });
  }

  function saveSelectors() {
    chrome.storage.local.set({ selectors: allSelectors });
  }

  function mergeSelectorsWithDefaults(domain, storedSelectors) {
    const defaults = NATI_DEFAULTS[domain] || [];
    if (!storedSelectors) return JSON.parse(JSON.stringify(defaults));

    const storedBySelector = new Map(storedSelectors.map((item) => [item.selector, item]));
    const merged = defaults.map((defaultItem) => {
      const storedItem = storedBySelector.get(defaultItem.selector);
      if (!storedItem) return defaultItem;
      return Object.assign({}, defaultItem, storedItem, {
        target: storedItem.target || defaultItem.target,
        mode: storedItem.mode || defaultItem.mode
      });
    });

    return JSON.parse(JSON.stringify(merged));
  }

  function setControlsDisabled(disabled) {
    [toggleSite, toggleInput, toggleMessages, btnReset].forEach((el) => {
      el.disabled = disabled;
    });
  }

  function renderLanguage() {
    const dictionary = LANGUAGES[uiLanguage] || LANGUAGES.en;
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = uiLanguage === "en" ? "ltr" : "rtl";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = dictionary[key] || LANGUAGES.en[key] || key;
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      el.title = dictionary[key] || LANGUAGES.en[key] || key;
    });

    const siteLabel = SITE_LABELS[supportedDomain];
    if (!siteLabel) {
      siteNameEl.textContent = dictionary.unknownSite;
    } else if (uiLanguage === "ar") {
      siteNameEl.textContent = `${dictionary.detected} ${siteLabel}`;
    } else {
      siteNameEl.textContent = `${siteLabel} ${dictionary.detected}`;
    }
  }

  function renderSite() {
    const settings = getCurrentSettings();
    const isSupported = !!SITE_LABELS[supportedDomain];

    siteDomainEl.textContent = supportedDomain || currentDomain || "Unknown";
    toggleSite.checked = settings.enabled !== false;
    toggleInput.checked = settings.input !== false;
    toggleMessages.checked = settings.messages !== false;
    setControlsDisabled(!isSupported);

    document.querySelectorAll(".supported [data-site]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-site") === supportedDomain);
    });

    renderLanguage();
  }

  function initStorage(result) {
    toggleEnabled.checked = result.enabled !== false;
    uiLanguage = result.uiLanguage || "en";
    languageSelect.value = uiLanguage;

    allSelectors = result.selectors || {};
    allSiteSettings = result.siteSettings || {};

    if (supportedDomain) {
      allSelectors[supportedDomain] = mergeSelectorsWithDefaults(supportedDomain, allSelectors[supportedDomain]);
      saveSelectors();
    }

    if (supportedDomain && !allSiteSettings[supportedDomain]) {
      allSiteSettings[supportedDomain] = defaultSiteSettings();
      chrome.storage.local.set({ siteSettings: allSiteSettings });
    }

    renderSite();
  }

  function init() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url) {
        try {
          const url = new URL(tab.url);
          currentDomain = domainFromHost(url.hostname);
          supportedDomain = NATI_DEFAULTS[currentDomain] ? currentDomain : null;
        } catch {
          currentDomain = null;
          supportedDomain = null;
        }
      }

      chrome.storage.local.get(["enabled", "uiLanguage", "selectors", "siteSettings"], initStorage);
    });
  }

  toggleEnabled.addEventListener("change", () => {
    chrome.storage.local.set({ enabled: toggleEnabled.checked });
  });

  languageSelect.addEventListener("change", () => {
    uiLanguage = languageSelect.value || "en";
    chrome.storage.local.set({ uiLanguage });
    renderLanguage();
  });

  toggleSite.addEventListener("change", () => {
    const settings = getCurrentSettings();
    settings.enabled = toggleSite.checked;
    saveSiteSettings(settings);
  });

  toggleInput.addEventListener("change", () => {
    const settings = getCurrentSettings();
    settings.input = toggleInput.checked;
    saveSiteSettings(settings);
  });

  toggleMessages.addEventListener("change", () => {
    const settings = getCurrentSettings();
    settings.messages = toggleMessages.checked;
    saveSiteSettings(settings);
  });

  btnReset.addEventListener("click", () => {
    if (!supportedDomain) return;

    allSelectors[supportedDomain] = JSON.parse(JSON.stringify(NATI_DEFAULTS[supportedDomain]));
    allSiteSettings[supportedDomain] = defaultSiteSettings();
    saveSelectors();
    chrome.storage.local.set({ siteSettings: allSiteSettings });
    renderSite();
  });

  btnYaapps.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://yaapps.website" });
  });

  btnDonate.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://www.paypal.com/donate/?hosted_button_id=ZD3GMUDAHXWPJ" });
  });

  init();
})();
