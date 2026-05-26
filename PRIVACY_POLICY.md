# Privacy Policy — RTL AI Chat Helper

**Last updated:** 2026-05-26

---

## Overview

RTL AI Chat Helper ("the Extension") is a browser extension for Google Chrome and Microsoft Edge. This policy describes what data the Extension does and does not collect.

**Summary: The Extension collects no personal data of any kind.**

---

## Data collection

The Extension does **not** collect, store, transmit, or share any of the following:

- Personal information (name, email, address, phone number)
- Browsing history or URLs visited
- Content of chat messages or conversations
- Keyboard input or typed text
- Cookies or tracking identifiers
- Device identifiers or IP addresses
- Usage statistics or analytics
- Crash reports sent to any server

---

## Local storage

The Extension stores the following data **locally on your device only**, using the browser's built-in `chrome.storage.local` API:

| Key | Value | Purpose |
|---|---|---|
| `enabled` | `true` or `false` | Whether the extension is currently active |
| `selectors` | Object | Your per-domain selector enable/disable preferences |

This data never leaves your browser. It is not transmitted to any server. It can be cleared at any time by removing the extension.

---

## Permissions explained

| Permission | Why it is needed |
|---|---|
| `storage` | To save your toggle state and selector preferences locally |
| `activeTab` | To read the current tab's hostname so the popup can show the correct domain |

The Extension does not use `tabs`, `history`, `cookies`, `webRequest`, or any permission that would allow reading or transmitting browsing data.

---

## Content script access

The Extension injects a content script into pages on:
- `chatgpt.com`
- `claude.ai`
- `gemini.google.com`

The content script reads the DOM of these pages **only** to detect Hebrew characters and apply CSS direction classes. It does not read, record, log, or transmit the text content of any messages.

---

## Network requests

The Extension makes **zero** network requests. There is no remote server, no analytics endpoint, no telemetry, and no update mechanism outside the Chrome Web Store's standard update process.

---

## Third-party services

The Extension does not integrate with any third-party service. No third-party scripts, SDKs, or libraries are included or loaded.

---

## Children's privacy

The Extension does not collect data from anyone, including children under the age of 13.

---

## Changes to this policy

If this policy changes in a future version, the updated policy will be included in the new release and reflected in the Chrome Web Store listing.

---

## Contact

For questions about this privacy policy, contact:

**netanelyakobi11@gmail.com**

---

*This extension is an unofficial tool not affiliated with OpenAI, Anthropic, or Google.*
