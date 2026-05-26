// defaults.js — single source of truth for per-domain selector configuration.
// Loaded before content.js in the content script, and via <script> in popup.html.
// Exposes NATI_DEFAULTS as a plain global (no ES modules needed).

const NATI_DEFAULTS = {
  "chatgpt.com": [
    {
      // Markdown text body inside AI/user message bubbles — specific text container, not the bubble itself
      selector: "[data-message-author-role] .markdown",
      enabled: true,
      mode: "includes"
    },
    {
      // User message text (plain text, no markdown wrapper)
      selector: "[data-message-author-role='user'] .whitespace-pre-wrap",
      enabled: true,
      mode: "includes"
    },
    {
      // Main prompt textarea
      selector: "#prompt-textarea",
      enabled: true,
      mode: "includes"
    }
  ],

  "claude.ai": [
    {
      // Confirmed assistant response body selector (found via DevTools)
      selector: ".font-claude-response-body",
      enabled: true,
      mode: "includes"
    },
    {
      // Substring match for the same class — catches versioned/hashed variants
      selector: "div[class*='font-claude-response-body']",
      enabled: true,
      mode: "includes"
    },
    {
      // Claude AI response font class (text content only)
      selector: ".font-claude-message",
      enabled: true,
      mode: "includes"
    },
    {
      // Prose content block (AI responses)
      selector: ".prose",
      enabled: true,
      mode: "includes"
    },
    {
      // Divs with "prose" anywhere in their class list
      selector: "div[class*='prose']",
      enabled: true,
      mode: "includes"
    },
    {
      // Main input box (contenteditable)
      selector: "div[contenteditable='true']",
      enabled: true,
      mode: "includes"
    }
  ],

  "gemini.google.com": [
    {
      // AI response markdown area
      selector: "message-content .markdown",
      enabled: true,
      mode: "includes"
    },
    {
      // User query text
      selector: "user-query .query-text",
      enabled: true,
      mode: "includes"
    },
    {
      // Main input box (contenteditable inside rich-textarea)
      selector: "rich-textarea div[contenteditable='true']",
      enabled: true,
      mode: "includes"
    }
  ]
};
