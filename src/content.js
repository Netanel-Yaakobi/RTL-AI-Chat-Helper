// content.js — Main RTL logic for Nati RTL Helper.
// Runs as a content script on AI chat pages. Requires defaults.js to be loaded first.

(function () {
  "use strict";

  // ── Constants ─────────────────────────────────────────────────────────────

  // Matches any character in the Hebrew Unicode block (U+0590–U+05FF)
  const HEBREW_REGEX = /[֐-׿]/;
  const HEBREW_CHAR_REGEX = /[֐-׿]/g;

  // CSS classes we add so styles can be overridden via user stylesheets if needed
  const CLASS_RTL = "nati-rtl-applied";
  const CLASS_RTL_CONTAINER = "nati-rtl-container";
  const CLASS_LTR_CODE = "nati-ltr-code";

  // Elements that must always stay LTR — code areas of all kinds
  const CODE_SELECTORS = [
    "pre", "code", "kbd", "samp",
    ".cm-editor", ".monaco-editor"
  ];
  const CODE_SELECTOR_STRING = CODE_SELECTORS.join(", ");

  // How long to wait after the last DOM mutation before running a full scan.
  // Prevents excessive work during streaming AI responses.
  const DEBOUNCE_MS = 50;

  // Child block-level tags that we also individually check for Hebrew inside a container.
  // ul/ol included so list containers get RTL + padding fix via CSS.
  const CHILD_BLOCK_SELECTOR = "p, li, ul, ol, h1, h2, h3, h4, blockquote, span";

  // Tags that are layout/interactive — never receive RTL treatment.
  const SKIP_TAGS = new Set([
    "button", "svg", "nav", "aside", "menu", "toolbar", "header", "footer", "input"
  ]);

  // ARIA roles that signal layout or interactive widgets.
  const SKIP_ROLES = new Set([
    "button", "toolbar", "navigation", "menu", "menubar", "complementary", "banner"
  ]);

  // Pure text-level tags — skip the expensive querySelector check for these.
  const TEXT_TAGS = new Set([
    "p", "li", "h1", "h2", "h3", "h4", "blockquote", "span", "em", "strong", "b", "i", "a"
  ]);

  // ── State ─────────────────────────────────────────────────────────────────

  let extensionEnabled = true;
  let currentSelectors = []; // array of { selector, enabled, mode }
  let debounceTimer = null;
  let observer = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function containsHebrew(text) {
    return HEBREW_REGEX.test(text);
  }

  // Returns the fraction (0–1) of non-whitespace characters that are Hebrew.
  // Used for "equals" mode which requires the element to be predominantly Hebrew.
  function hebrewRatio(text) {
    if (!text) return 0;
    const stripped = text.replace(/\s/g, "");
    if (stripped.length === 0) return 0;
    const matches = stripped.match(HEBREW_CHAR_REGEX);
    return matches ? matches.length / stripped.length : 0;
  }

  // Returns true if the element is a code block or is nested inside one.
  // Uses .closest() so ancestors are also caught (e.g. a <span> inside a <pre>).
  function isInsideCodeBlock(el) {
    try {
      return el.matches(CODE_SELECTOR_STRING) || !!el.closest(CODE_SELECTOR_STRING);
    } catch {
      return false;
    }
  }

  // Inject a <style> tag so RTL rules carry !important and win over site styles.
  // Called once at init; idempotent (checks for existing tag by id).
  function injectStyles() {
    if (document.getElementById("nati-rtl-style")) return;
    const style = document.createElement("style");
    style.id = "nati-rtl-style";
    style.textContent = `
      /* ── Base RTL class ─────────────────────────────────────── */
      .nati-rtl-applied {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: plaintext !important;
      }

      /* ── Child text elements ────────────────────────────────── */
      .nati-rtl-applied p,
      .nati-rtl-applied li,
      .nati-rtl-applied h1,
      .nati-rtl-applied h2,
      .nati-rtl-applied h3,
      .nati-rtl-applied h4,
      .nati-rtl-applied blockquote,
      .nati-rtl-applied span {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: plaintext !important;
      }

      /* ── Lists: flip bullet indent to right side ────────────── */
      .nati-rtl-applied ul,
      .nati-rtl-applied ol {
        direction: rtl !important;
        text-align: right !important;
        padding-right: 1.5rem !important;
        padding-left: 0 !important;
      }

      /* ── Claude-specific: higher specificity via body:has ───── */
      /* body:has([data-testid]) is true on Claude (uses data-testid everywhere). */
      /* The extra ancestor in the selector wins over Claude's own RTL overrides. */
      body:has([data-testid]) .nati-rtl-applied {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: plaintext !important;
      }
      body:has([data-testid]) .nati-rtl-applied ul,
      body:has([data-testid]) .nati-rtl-applied ol {
        direction: rtl !important;
        text-align: right !important;
        padding-right: 1.5rem !important;
        padding-left: 0 !important;
      }
      body:has([data-testid]) .nati-rtl-applied li {
        direction: rtl !important;
        text-align: right !important;
      }

      /* ── Layout container wrapper ───────────────────────────── */
      /* Applied to matched elements that are flex/grid containers. */
      /* Skips direction: rtl so flex item order is preserved.     */
      /* Text children still get full RTL via nati-rtl-applied.   */
      .nati-rtl-container {
        unicode-bidi: plaintext !important;
      }

      /* ── Code areas always LTR ──────────────────────────────── */
      .nati-ltr-code,
      .nati-ltr-code *,
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

      /* ── Copy buttons inside code blocks stay LTR ───────────── */
      /* Prevents RTL on a parent from pushing the copy button to the wrong side. */
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

  // Just add the class — the injected CSS carries !important and handles children.
  function applyRTL(el) {
    el.classList.add(CLASS_RTL);
  }

  function removeRTL(el) {
    el.classList.remove(CLASS_RTL, CLASS_RTL_CONTAINER);
  }

  // CSS class handles ltr !important via .nati-ltr-code rule.
  function lockCodeLTR(el) {
    el.classList.add(CLASS_LTR_CODE);
  }

  // Returns true if RTL must NOT be applied to this element.
  // Protects buttons, copy controls, toolbars, code areas, and layout containers.
  function shouldSkipElement(el) {
    // Always skip code blocks and their contents
    if (isInsideCodeBlock(el)) return true;

    const tag = el.tagName.toLowerCase();

    // Skip interactive/structural tags
    if (SKIP_TAGS.has(tag)) return true;

    // Skip by ARIA role
    const role = (el.getAttribute("role") || "").toLowerCase();
    if (SKIP_ROLES.has(role)) return true;

    // Skip copy/action controls by data-testid or aria-label
    const testid = el.getAttribute("data-testid") || "";
    if (testid.includes("copy") || testid.includes("action")) return true;

    const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
    if (ariaLabel.includes("copy") || ariaLabel.includes("העתק")) return true;

    return false;
  }

  // ── Core processing ───────────────────────────────────────────────────────

  // Returns true if the element has block-level children (i.e. acts as a layout
  // container rather than a leaf text node). Containers must not receive
  // direction: rtl directly because that reverses flex/grid item order; instead
  // they get the lightweight .nati-rtl-container class and only their text
  // children receive the full .nati-rtl-applied treatment.
  function isLayoutContainer(el) {
    try {
      return el.querySelector("p, div, ul, ol, h1, h2, h3, h4, blockquote, li") !== null;
    } catch {
      return false;
    }
  }

  // Decides whether to apply RTL based on the selector's mode setting.
  function shouldApplyRTL(el, mode) {
    const text = el.textContent || "";
    if (mode === "equals") {
      // Only flip if >70% of the content is Hebrew
      return hebrewRatio(text) > 0.7;
    }
    // "includes" mode: any Hebrew character is enough
    return containsHebrew(text);
  }

  // Process a content element (non-input): apply/remove RTL, cascade to child blocks,
  // then lock any code descendants to LTR.
  function processElement(el, mode) {
    // Guard: never touch layout containers, buttons, toolbars, or code areas.
    if (shouldSkipElement(el)) return;

    if (shouldApplyRTL(el, mode)) {
      if (isLayoutContainer(el)) {
        // Flex/grid containers: apply only unicode-bidi to avoid reversing layout order.
        // The text children below will each receive the full RTL treatment.
        el.classList.add(CLASS_RTL_CONTAINER);
        el.classList.remove(CLASS_RTL);
      } else {
        // Leaf text elements: apply full direction: rtl treatment.
        el.classList.add(CLASS_RTL);
        el.classList.remove(CLASS_RTL_CONTAINER);
      }
    } else {
      removeRTL(el);
    }

    // Also individually mark child block elements that contain Hebrew.
    // Gives per-paragraph RTL within mixed-language messages.
    try {
      el.querySelectorAll(CHILD_BLOCK_SELECTOR).forEach((child) => {
        if (shouldSkipElement(child)) return;
        if (containsHebrew(child.textContent || "")) {
          child.classList.add(CLASS_RTL);
        } else {
          child.classList.remove(CLASS_RTL);
        }
      });
    } catch {
      // Ignore — bad DOM or unusual state
    }

    // Always enforce LTR on code descendants, even inside RTL containers.
    try {
      el.querySelectorAll(CODE_SELECTOR_STRING).forEach(lockCodeLTR);
    } catch {
      // Ignore — defensive against unusual DOM states
    }
  }

  // Process an editable input: switch direction live based on current content.
  function processInputElement(el) {
    if (isInsideCodeBlock(el)) return;

    // textarea has .value; contenteditable uses .textContent
    const text = el.value !== undefined ? el.value : (el.textContent || "");

    if (containsHebrew(text)) {
      el.style.direction = "rtl";
      el.style.textAlign = "right";
      el.classList.add(CLASS_RTL);
    } else {
      el.style.direction = "ltr";
      el.style.textAlign = "left";
      el.classList.remove(CLASS_RTL);
    }
  }

  // Main scan: iterate enabled selectors and process matching elements.
  function runScan() {
    if (!extensionEnabled) return;

    for (const { selector, enabled, mode } of currentSelectors) {
      if (!enabled) continue;

      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch {
        // Invalid CSS selector — skip silently
        continue;
      }

      elements.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        const isInput =
          tag === "textarea" ||
          (tag === "input" && el.type === "text") ||
          el.getAttribute("contenteditable") === "true";

        if (isInput) {
          processInputElement(el);
        } else {
          processElement(el, mode);
        }
      });
    }
  }

  // ── Real-time input handling ──────────────────────────────────────────────

  // Single delegated listener on document (capture phase) catches all input events,
  // including those on dynamically added elements.
  function attachInputListeners() {
    document.addEventListener("input", (e) => {
      if (!extensionEnabled) return;
      const el = e.target;
      if (!el) return;

      const tag = el.tagName.toLowerCase();
      const isInput =
        tag === "textarea" ||
        (tag === "input" && el.type === "text") ||
        el.getAttribute("contenteditable") === "true";

      if (isInput) processInputElement(el);
    }, true /* capture phase */);
  }

  // ── MutationObserver ──────────────────────────────────────────────────────

  // Process a single newly-added element node immediately (no debounce).
  // Checks whether it or any descendant matches an active selector and
  // applies RTL right away, eliminating the visible render-then-flip jump.
  function processAddedNode(node) {
    if (!extensionEnabled || node.nodeType !== Node.ELEMENT_NODE) return;

    for (const { selector, enabled, mode } of currentSelectors) {
      if (!enabled) continue;
      try {
        if (node.matches(selector)) {
          const tag = node.tagName.toLowerCase();
          const isInput =
            tag === "textarea" ||
            (tag === "input" && node.type === "text") ||
            node.getAttribute("contenteditable") === "true";
          if (isInput) processInputElement(node);
          else processElement(node, mode);
        }
        node.querySelectorAll(selector).forEach((el) => {
          const tag = el.tagName.toLowerCase();
          const isInput =
            tag === "textarea" ||
            (tag === "input" && el.type === "text") ||
            el.getAttribute("contenteditable") === "true";
          if (isInput) processInputElement(el);
          else processElement(el, mode);
        });
      } catch {
        // Invalid selector — skip silently
      }
    }
  }

  // Debounce: collect rapid characterData mutations (streaming tokens) and run
  // one full scan after DEBOUNCE_MS of quiet. addedNodes are handled immediately
  // in startObserver so they never wait for this timer.
  function debouncedScan() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      runScan();
    }, DEBOUNCE_MS);
  }

  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      let hasCharData = false;

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          // Streaming token update — batch these through the debounce.
          hasCharData = true;
          continue;
        }
        // New elements added to the DOM — process immediately, no debounce,
        // so RTL is applied before the browser paints the new node.
        for (const node of mutation.addedNodes) {
          processAddedNode(node);
        }
      }

      if (hasCharData) debouncedScan();
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

  // ── Storage and initialization ────────────────────────────────────────────

  // Match the current hostname against NATI_DEFAULTS keys.
  // e.g. "chat.openai.com" would match "chatgpt.com" if we had it as a key.
  function getCurrentDomain() {
    const host = window.location.hostname;
    for (const key of Object.keys(NATI_DEFAULTS)) {
      if (host === key || host.endsWith("." + key)) return key;
    }
    return host;
  }

  // Load enabled state and selectors from storage.
  // On first visit to a domain, seeds NATI_DEFAULTS into storage.
  function loadSettings(callback) {
    const domain = getCurrentDomain();

    chrome.storage.local.get(["enabled", "selectors"], (result) => {
      extensionEnabled = result.enabled !== false; // default true

      if (result.selectors && result.selectors[domain]) {
        currentSelectors = result.selectors[domain];
      } else {
        currentSelectors = NATI_DEFAULTS[domain] || [];
        const selectors = result.selectors || {};
        selectors[domain] = currentSelectors;
        chrome.storage.local.set({ selectors });
      }

      if (callback) callback();
    });
  }

  // React to changes made in the popup without requiring a page refresh.
  function listenForStorageChanges() {
    const domain = getCurrentDomain();

    chrome.storage.onChanged.addListener((changes) => {
      let needsRescan = false;

      if (changes.enabled) {
        extensionEnabled = changes.enabled.newValue !== false;
        needsRescan = true;
      }

      if (changes.selectors && changes.selectors.newValue) {
        const domainSelectors = changes.selectors.newValue[domain];
        if (domainSelectors) {
          currentSelectors = domainSelectors;
          needsRescan = true;
        }
      }

      if (!needsRescan) return;

      if (extensionEnabled) {
        runScan();
        startObserver();
      } else {
        stopObserver();
        // Remove all RTL we applied (both class variants)
        document.querySelectorAll("." + CLASS_RTL + ", ." + CLASS_RTL_CONTAINER).forEach(removeRTL);
      }
    });
  }

  function init() {
    injectStyles();
    loadSettings(() => {
      if (extensionEnabled) {
        runScan();
        attachInputListeners();
        startObserver();
      }
      listenForStorageChanges();
    });
  }

  // run_at: document_idle already guarantees DOM is ready,
  // but guard for edge cases where the script loads during parsing.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
