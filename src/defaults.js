// Per-domain selector configuration.
// Loaded before content.js in the content script and before popup.js in popup.html.

const NATI_DEFAULTS = {
  "chatgpt.com": [
    {
      selector: "[data-message-author-role] .markdown",
      enabled: true,
      target: "messages",
      mode: "includes"
    },
    {
      selector: "[data-message-author-role='user'] .whitespace-pre-wrap",
      enabled: true,
      target: "userMessages",
      mode: "includes"
    },
    {
      selector: "#prompt-textarea",
      enabled: true,
      target: "input",
      mode: "includes"
    }
  ],

  "claude.ai": [
    {
      selector: ".font-claude-response-body",
      enabled: true,
      target: "messages",
      mode: "includes"
    },
    {
      selector: "div[class*='font-claude-response-body']",
      enabled: true,
      target: "messages",
      mode: "includes"
    },
    {
      selector: ".standard-markdown",
      enabled: true,
      target: "messages",
      mode: "includes"
    },
    {
      selector: ".font-user-message",
      enabled: true,
      target: "userMessages",
      mode: "includes"
    },
    {
      selector: ".whitespace-pre-wrap.break-words",
      enabled: true,
      target: "userMessages",
      mode: "includes"
    },
    {
      selector: "[data-testid='human-turn'], [data-testid='user-message'], [data-testid='user-turn'], [data-is-user-message]",
      enabled: true,
      target: "userMessages",
      mode: "includes"
    },
    {
      selector: "div[contenteditable='true']",
      enabled: true,
      target: "input",
      mode: "includes"
    },
    {
      selector: "[contenteditable], .ProseMirror",
      enabled: true,
      target: "input",
      mode: "includes"
    },
    {
      selector: "[data-testid='chat-input']",
      enabled: true,
      target: "input",
      mode: "includes"
    }
  ],

  "gemini.google.com": [
    {
      selector: "message-content .markdown",
      enabled: true,
      target: "messages",
      mode: "includes"
    },
    {
      selector: "message-content",
      enabled: true,
      target: "messages",
      mode: "includes"
    },
    {
      selector: "user-query .query-text",
      enabled: true,
      target: "messages",
      mode: "includes"
    },
    {
      selector: "rich-textarea div[contenteditable='true']",
      enabled: true,
      target: "input",
      mode: "includes"
    },
    {
      selector: "rich-textarea [contenteditable]",
      enabled: true,
      target: "input",
      mode: "includes"
    }
  ]
};
