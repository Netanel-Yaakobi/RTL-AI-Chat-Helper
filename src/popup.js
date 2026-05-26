// popup.js — Handles the extension popup UI.
// Relies on NATI_DEFAULTS being available (loaded via defaults.js before this script).

(function () {
  "use strict";

  // ── DOM refs ──────────────────────────────────────────────────────────────

  const toggleEnabled = document.getElementById("toggle-enabled");
  const domainNameEl  = document.getElementById("domain-name");
  const selectorsList = document.getElementById("selectors-list");
  const btnReset      = document.getElementById("btn-reset");

  // ── State ─────────────────────────────────────────────────────────────────

  let currentDomain = null;
  let allSelectors  = {}; // { "chatgpt.com": [...], "claude.ai": [...], ... }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Match a hostname against NATI_DEFAULTS keys.
  function domainFromHost(hostname) {
    for (const key of Object.keys(NATI_DEFAULTS)) {
      if (hostname === key || hostname.endsWith("." + key)) return key;
    }
    return hostname;
  }

  // Build the selectors list UI for the current domain.
  function renderSelectors(selectors) {
    selectorsList.innerHTML = "";

    if (!selectors || selectors.length === 0) {
      const li = document.createElement("li");
      li.className = "selector-item empty";
      li.textContent = "No selectors configured for this domain.";
      selectorsList.appendChild(li);
      return;
    }

    selectors.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "selector-item";

      const label = document.createElement("label");
      label.className = "selector-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.enabled;
      checkbox.addEventListener("change", () => {
        allSelectors[currentDomain][index].enabled = checkbox.checked;
        saveSelectors();
      });

      const textSpan = document.createElement("span");
      textSpan.className = "selector-text";
      textSpan.textContent = item.selector;

      const modeSpan = document.createElement("span");
      modeSpan.className = "selector-mode mode-" + item.mode;
      modeSpan.textContent = item.mode;

      label.appendChild(checkbox);
      label.appendChild(textSpan);
      label.appendChild(modeSpan);
      li.appendChild(label);
      selectorsList.appendChild(li);
    });
  }

  // ── Storage ───────────────────────────────────────────────────────────────

  function saveSelectors() {
    chrome.storage.local.set({ selectors: allSelectors });
  }

  function saveEnabled(value) {
    chrome.storage.local.set({ enabled: value });
  }

  // ── Initialization ────────────────────────────────────────────────────────

  function init() {
    // Query the active tab to determine which domain we're on.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url) {
        try {
          const url = new URL(tab.url);
          currentDomain = domainFromHost(url.hostname);
        } catch {
          currentDomain = null;
        }
      }

      domainNameEl.textContent = currentDomain || "Unknown";

      chrome.storage.local.get(["enabled", "selectors"], (result) => {
        // Reflect current enabled state
        toggleEnabled.checked = result.enabled !== false;

        // Load selectors, seeding defaults for this domain if needed
        allSelectors = result.selectors || {};
        if (currentDomain && !allSelectors[currentDomain]) {
          allSelectors[currentDomain] = JSON.parse(
            JSON.stringify(NATI_DEFAULTS[currentDomain] || [])
          );
          saveSelectors();
        }

        renderSelectors(currentDomain ? allSelectors[currentDomain] : []);
      });
    });
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  toggleEnabled.addEventListener("change", () => {
    saveEnabled(toggleEnabled.checked);
  });

  btnReset.addEventListener("click", () => {
    if (!currentDomain || !NATI_DEFAULTS[currentDomain]) return;
    // Deep-clone defaults so we don't mutate the original object
    allSelectors[currentDomain] = JSON.parse(
      JSON.stringify(NATI_DEFAULTS[currentDomain])
    );
    saveSelectors();
    renderSelectors(allSelectors[currentDomain]);
  });

  init();
})();
