// Main RTL logic for RTL AI Chat Helper.

(function () {
  "use strict";

  const rtlUtils = window.NATI_RTL_UTILS;
  if (!rtlUtils) return;

  const CLASS_RTL = "nati-rtl-applied";
  const CLASS_RTL_CONTAINER = "nati-rtl-container";
  const CLASS_ALIGN_RIGHT = "nati-align-right";
  const CLASS_LTR_CODE = "nati-ltr-code";

  const CODE_SELECTORS = ["pre", "code", "kbd", "samp", ".cm-editor", ".monaco-editor"];
  const CODE_SELECTOR_STRING = CODE_SELECTORS.join(", ");
  const CHILD_TEXT_SELECTOR = "p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote";
  const EDITABLE_SELECTOR = "textarea, input[type='text'], input[type='search'], [contenteditable], .ProseMirror";
  const SKIP_ANCESTOR_SELECTOR = [
    "button",
    "a",
    "nav",
    "aside",
    "header",
    "footer",
    "[role='button']",
    "[role='navigation']",
    "[role='menu']",
    "[role='menubar']",
    "[data-testid*='sidebar']",
    "[data-testid*='conversation-title']"
  ].join(", ");
  const DEBOUNCE_MS = 50;

  const SKIP_TAGS = new Set([
    "button",
    "svg",
    "nav",
    "aside",
    "menu",
    "toolbar",
    "header",
    "footer",
    "select",
    "option"
  ]);

  const SKIP_ROLES = new Set([
    "button",
    "toolbar",
    "navigation",
    "menu",
    "menubar",
    "complementary",
    "banner",
    "tab",
    "switch"
  ]);

  let globalEnabled = true;
  let siteSettings = {};
  let currentSelectors = [];
  let debounceTimer = null;
  let observer = null;

  function injectStyles() {
    if (document.getElementById("nati-rtl-style")) return;

    const style = document.createElement("style");
    style.id = "nati-rtl-style";
    style.textContent = `
      .${CLASS_RTL} {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }

      .${CLASS_RTL} p,
      .${CLASS_RTL} li,
      .${CLASS_RTL} h1,
      .${CLASS_RTL} h2,
      .${CLASS_RTL} h3,
      .${CLASS_RTL} h4,
      .${CLASS_RTL} h5,
      .${CLASS_RTL} h6,
      .${CLASS_RTL} blockquote,
      .${CLASS_RTL}[contenteditable],
      [contenteditable].${CLASS_RTL},
      .ProseMirror.${CLASS_RTL},
      .${CLASS_RTL} .ProseMirror {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }

      .${CLASS_RTL} ul,
      .${CLASS_RTL} ol,
      ul.${CLASS_RTL},
      ol.${CLASS_RTL} {
        direction: rtl !important;
        text-align: right !important;
        padding-inline-start: 0 !important;
        padding-inline-end: 1.5rem !important;
      }

      .${CLASS_RTL_CONTAINER} {
        text-align: right !important;
        unicode-bidi: isolate !important;
      }

      .${CLASS_ALIGN_RIGHT} {
        text-align: right !important;
        unicode-bidi: plaintext !important;
      }

      .${CLASS_LTR_CODE},
      .${CLASS_LTR_CODE} *,
      pre,
      code,
      kbd,
      samp,
      .cm-editor,
      .monaco-editor {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: embed !important;
      }

      pre button,
      pre [role="button"],
      pre svg,
      code button,
      [data-testid*="copy"],
      button[aria-label*="Copy"],
      button[aria-label*="copy"] {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: embed !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getCurrentDomain() {
    const host = window.location.hostname;
    for (const key of Object.keys(NATI_DEFAULTS)) {
      if (host === key || host.endsWith("." + key)) return key;
    }
    return host;
  }

  function defaultSiteSettings() {
    return {
      enabled: true,
      input: true,
      messages: true
    };
  }

  function effectiveSiteSettings() {
    return Object.assign(defaultSiteSettings(), siteSettings || {});
  }

  function isSiteEnabled() {
    return globalEnabled && effectiveSiteSettings().enabled !== false;
  }

  function isTargetEnabled(target) {
    const settings = effectiveSiteSettings();
    if (target === "input") return settings.input !== false;
    return settings.messages !== false;
  }

  function isEditable(el) {
    const tag = el.tagName.toLowerCase();
    return (
      tag === "textarea" ||
      (tag === "input" && ["text", "search"].includes((el.type || "").toLowerCase())) ||
      el.hasAttribute("contenteditable") ||
      el.classList.contains("ProseMirror")
    );
  }

  function findEditableElement(target) {
    const el = target && target.nodeType === Node.TEXT_NODE ? target.parentElement : target;
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;
    if (isEditable(el)) return el;

    try {
      const closest = el.closest(EDITABLE_SELECTOR);
      return closest && isEditable(closest) ? closest : null;
    } catch {
      return null;
    }
  }

  function inferTarget(item, el) {
    if (item.target) return item.target;
    return isEditable(el) ? "input" : "messages";
  }

  function firstStrongIsRTL(text) {
    for (const ch of text || "") {
      if (/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(ch)) {
        return true;
      }
      if (/[A-Za-z0-9]/.test(ch)) return false;
    }
    return false;
  }

  function mergeSelectorsWithDefaults(domain, storedSelectors) {
    const defaults = NATI_DEFAULTS[domain] || [];
    if (!storedSelectors) return defaults;

    const storedBySelector = new Map(storedSelectors.map((item) => [item.selector, item]));
    return defaults.map((defaultItem) => {
      const storedItem = storedBySelector.get(defaultItem.selector);
      if (!storedItem) return defaultItem;
      return Object.assign({}, defaultItem, storedItem, {
        target: storedItem.target || defaultItem.target,
        mode: storedItem.mode || defaultItem.mode
      });
    });
  }

  function isInsideCodeBlock(el) {
    try {
      return el.matches(CODE_SELECTOR_STRING) || !!el.closest(CODE_SELECTOR_STRING);
    } catch {
      return false;
    }
  }

  function lockCodeLTR(el) {
    el.classList.add(CLASS_LTR_CODE);
  }

  function removeElementState(el) {
    el.classList.remove(CLASS_RTL, CLASS_RTL_CONTAINER, CLASS_ALIGN_RIGHT);
  }

  function removeInputState(el) {
    el.classList.remove(CLASS_RTL);
    el.style.direction = "";
    el.style.textAlign = "";
  }

  function clearAppliedState() {
    document.querySelectorAll(`.${CLASS_RTL}, .${CLASS_RTL_CONTAINER}, .${CLASS_ALIGN_RIGHT}`).forEach(removeElementState);
    document.querySelectorAll(`.${CLASS_LTR_CODE}`).forEach((el) => {
      el.classList.remove(CLASS_LTR_CODE);
    });
    document.querySelectorAll(EDITABLE_SELECTOR).forEach((el) => {
      removeInputState(el);
    });
  }

  function shouldSkipElement(el) {
    if (isInsideCodeBlock(el)) return true;

    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return true;

    const role = (el.getAttribute("role") || "").toLowerCase();
    if (SKIP_ROLES.has(role)) return true;

    try {
      const ancestor = el.closest(SKIP_ANCESTOR_SELECTOR);
      if (ancestor && ancestor !== el) return true;
    } catch {
      // Ignore unusual transient DOM states.
    }

    const testid = (el.getAttribute("data-testid") || "").toLowerCase();
    if (testid.includes("copy") || testid.includes("action")) return true;

    const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
    if (ariaLabel.includes("copy") || ariaLabel.includes("העתק")) return true;

    return false;
  }

  function isLayoutContainer(el) {
    try {
      return el.querySelector("p, div, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, li") !== null;
    } catch {
      return false;
    }
  }

  function applyTextDirection(el, mode, options) {
    const text = el.textContent || "";
    if (!rtlUtils.shouldUseRTLDirection(text, mode)) {
      removeElementState(el);
      return;
    }

    const forceAlignOnly = options && options.alignOnly;
    const alignOnly = forceAlignOnly || !firstStrongIsRTL(text);

    if (alignOnly) {
      el.classList.add(CLASS_ALIGN_RIGHT);
      el.classList.remove(CLASS_RTL, CLASS_RTL_CONTAINER);
      return;
    }

    if (isLayoutContainer(el) && !(options && options.forceRootDirection)) {
      el.classList.add(CLASS_RTL_CONTAINER);
      el.classList.remove(CLASS_RTL, CLASS_ALIGN_RIGHT);
    } else {
      el.classList.add(CLASS_RTL);
      el.classList.remove(CLASS_RTL_CONTAINER, CLASS_ALIGN_RIGHT);
    }
  }

  function processElement(el, mode, options) {
    if (shouldSkipElement(el)) return;

    applyTextDirection(el, mode, options);

    try {
      el.querySelectorAll(CHILD_TEXT_SELECTOR).forEach((child) => {
        if (shouldSkipElement(child)) return;
        applyTextDirection(child, mode, options);
      });
    } catch {
      // Ignore transient DOM states.
    }

    try {
      el.querySelectorAll(CODE_SELECTOR_STRING).forEach(lockCodeLTR);
    } catch {
      // Ignore transient DOM states.
    }
  }

  function processInputElement(el) {
    if (isInsideCodeBlock(el)) return;

    const editable = findEditableElement(el) || el;
    const text = editable.value !== undefined ? editable.value : editable.textContent || "";
    if (rtlUtils.containsRTL(text)) {
      editable.style.direction = "rtl";
      editable.style.textAlign = "right";
      editable.classList.add(CLASS_RTL);
    } else {
      editable.style.direction = "ltr";
      editable.style.textAlign = "left";
      editable.classList.remove(CLASS_RTL);
    }
  }

  function processMatchedElement(item, el) {
    const target = inferTarget(item, el);
    if (!isTargetEnabled(target)) {
      if (target === "input" && isEditable(el)) removeInputState(el);
      else removeElementState(el);
      return;
    }

    if (isEditable(el)) {
      processInputElement(el);
    } else {
      processElement(el, item.mode || "includes", { forceRootDirection: target === "userMessages" });
    }
  }

  function runScan() {
    if (!isSiteEnabled()) return;

    for (const item of currentSelectors) {
      if (!item.enabled) continue;

      let elements;
      try {
        elements = document.querySelectorAll(item.selector);
      } catch {
        continue;
      }

      elements.forEach((el) => processMatchedElement(item, el));
    }
  }

  function processAddedNode(node) {
    if (!isSiteEnabled() || node.nodeType !== Node.ELEMENT_NODE) return;

    for (const item of currentSelectors) {
      if (!item.enabled) continue;

      try {
        if (node.matches(item.selector)) processMatchedElement(item, node);
        node.querySelectorAll(item.selector).forEach((el) => processMatchedElement(item, el));
      } catch {
        // Ignore invalid selectors and transient DOM states.
      }
    }
  }

  function debouncedScan() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      runScan();
    }, DEBOUNCE_MS);
  }

  function attachInputListeners() {
    document.addEventListener(
      "input",
      (event) => {
        if (!isSiteEnabled()) return;
        const editable = findEditableElement(event.target);
        if (!editable || !isTargetEnabled("input")) return;
        processInputElement(editable);
      },
      true
    );
  }

  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      let hasCharacterData = false;

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          hasCharacterData = true;
          continue;
        }

        for (const node of mutation.addedNodes) {
          processAddedNode(node);
        }
      }

      if (hasCharacterData) debouncedScan();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function loadSettings(callback) {
    const domain = getCurrentDomain();

    chrome.storage.local.get(["enabled", "selectors", "siteSettings"], (result) => {
      globalEnabled = result.enabled !== false;

      const selectors = result.selectors || {};
      currentSelectors = mergeSelectorsWithDefaults(domain, selectors[domain]);
      selectors[domain] = currentSelectors;
      chrome.storage.local.set({ selectors });

      const allSiteSettings = result.siteSettings || {};
      siteSettings = allSiteSettings[domain] || defaultSiteSettings();

      if (callback) callback();
    });
  }

  function listenForStorageChanges() {
    const domain = getCurrentDomain();

    chrome.storage.onChanged.addListener((changes) => {
      let needsRescan = false;

      if (changes.enabled) {
        globalEnabled = changes.enabled.newValue !== false;
        needsRescan = true;
      }

      if (changes.selectors && changes.selectors.newValue) {
        currentSelectors = changes.selectors.newValue[domain] || NATI_DEFAULTS[domain] || [];
        needsRescan = true;
      }

      if (changes.siteSettings && changes.siteSettings.newValue) {
        siteSettings = changes.siteSettings.newValue[domain] || defaultSiteSettings();
        needsRescan = true;
      }

      if (!needsRescan) return;

      clearAppliedState();
      if (isSiteEnabled()) {
        runScan();
        startObserver();
      } else {
        stopObserver();
      }
    });
  }

  function init() {
    injectStyles();
    loadSettings(() => {
      attachInputListeners();
      if (isSiteEnabled()) {
        runScan();
        startObserver();
      }
      listenForStorageChanges();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
