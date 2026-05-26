# RTL AI Chat Helper

**Version 1.0.0** — Initial public release

A lightweight Chrome / Edge Manifest V3 extension that automatically fixes Hebrew RTL reading and writing inside AI chat interfaces. No backend. No analytics. No data collection.

---

## Supported websites

| Website | Status |
|---|---|
| chatgpt.com | Supported |
| claude.ai | Supported |
| gemini.google.com | Supported |

---

## Features

- **Automatic RTL detection** — detects Hebrew text and applies RTL direction to chat messages
- **Live input switching** — input boxes flip to RTL as you type Hebrew, back to LTR when you switch to English
- **Smart code handling** — `pre`, `code`, `.cm-editor`, `.monaco-editor` always stay LTR
- **List alignment** — Hebrew bullet lists align correctly to the right with proper indent
- **Streaming support** — MutationObserver handles messages that load token-by-token
- **Per-domain selectors** — each CSS selector can be toggled on/off independently per site
- **Toggle popup** — ON/OFF switch, current domain display, selector list, Reset Defaults button

---

## Version 1.0.0 — Release notes

Initial public release.

- RTL Hebrew typing in all supported AI chat inputs
- RTL alignment for AI assistant Hebrew responses
- Smart LTR protection for code blocks inside responses
- Full Claude.ai support (`.font-claude-response-body`, `.prose`)
- Full ChatGPT support (`.markdown`, `.whitespace-pre-wrap`)
- Full Gemini support
- Debounced MutationObserver — safe for streaming responses
- Per-domain selector system with enable/disable per selector
- Global ON/OFF toggle with persistent state in `chrome.storage.local`
- Copy button positioning preserved (not shifted by RTL styles)

---

## How to install (load unpacked)

1. Download or clone this repository.
2. Open Chrome (or Edge):
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the project folder (the folder that contains `manifest.json`).
6. The extension appears — pin it to the toolbar for quick access.

---

## How to test on ChatGPT

1. Go to `https://chatgpt.com` and start a conversation.
2. Type Hebrew in the input — direction switches to RTL immediately.
3. Send a Hebrew message — the bubble appears right-aligned.
4. AI Hebrew responses should also appear RTL.
5. Code blocks inside any response must stay left-aligned (LTR).
6. Hover over a code block — the copy button must stay at the top-left, not shift right.

## How to test on Claude

1. Go to `https://claude.ai` and open a conversation.
2. Type Hebrew in the input — switches to RTL.
3. Send a Hebrew message — right-aligned.
4. AI Hebrew responses inside the response body should be RTL.
5. Code blocks inside responses must stay LTR.

## How to test on Gemini

1. Go to `https://gemini.google.com`.
2. Type Hebrew in the prompt — switches to RTL.
3. Send — response should appear RTL if Hebrew.

---

## How to add another website

1. Open `src/defaults.js` and add a new domain entry:

```js
"perplexity.ai": [
  {
    selector: ".prose-answer",
    enabled: true,
    mode: "includes"
  },
  {
    selector: "textarea",
    enabled: true,
    mode: "includes"
  }
]
```

2. Add the domain to `manifest.json` under `content_scripts > matches`:

```json
"*://*.perplexity.ai/*"
```

3. Reload the extension in `chrome://extensions`.

**Tip:** Use DevTools (F12) on the target site, inspect a message element, and copy its class name. Use `mode: "includes"` as the default.

---

## Selector modes

| Mode | When RTL is applied |
|---|---|
| `includes` | Element contains **any** Hebrew character |
| `equals` | More than **70%** of the element's text is Hebrew |

Use `includes` for most cases. Use `equals` only when you want RTL applied exclusively to fully Hebrew blocks.

---

## Storage

| Key | Type | Description |
|---|---|---|
| `enabled` | boolean | Global ON/OFF state |
| `selectors` | object | `{ "domain.com": [{ selector, enabled, mode }] }` |

Everything is stored locally via `chrome.storage.local`. Nothing leaves the browser.

---

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Persist the enabled toggle and selector configuration |
| `activeTab` | Allow the popup to read the current tab's URL for domain detection |

No host permissions beyond the three AI domains. No network requests. No external scripts.

---

## Privacy Policy

**RTL AI Chat Helper does not collect any data.**

- No analytics
- No tracking pixels or beacons
- No remote server communication
- No data collection of any kind
- No user messages are read, stored, or transmitted
- No cookies set by the extension
- All processing runs locally inside your browser

The extension only reads the DOM of pages on `chatgpt.com`, `claude.ai`, and `gemini.google.com` for the purpose of applying CSS direction classes. It writes nothing outside `chrome.storage.local` on your own device.

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for the full policy.

---

## How to package for Chrome Web Store

1. Make sure all files are final and tested.
2. Delete any development-only files (`.claude/` folder, temp scripts).
3. Select all files inside the project folder — **do not include the folder itself**, only its contents.
4. Create a ZIP archive.
5. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
6. Click **New item** → upload the ZIP.
7. Fill in the store listing using `STORE_DESCRIPTION.md` and `SHORT_DESCRIPTION.txt`.
8. Upload screenshots (1280×800 or 640×400).
9. Set category: **Productivity** or **Accessibility**.
10. Submit for review.

---

## How to package as CRX (local sharing)

1. In `chrome://extensions`, click **Pack extension**.
2. Select the project folder as the Extension root directory.
3. Chrome generates a `.crx` file you can share directly.
