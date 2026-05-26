# Chrome Web Store — Listing Description

> Copy the text below (between the dividers) into the Chrome Web Store "Description" field.
> Maximum: 16,000 characters. Current length: well within limit.

---

RTL AI Chat Helper automatically fixes Hebrew text direction (RTL) when you write or read Hebrew inside AI chat websites. No configuration needed — just install and type.

**Supported websites:**
• ChatGPT (chatgpt.com)
• Claude (claude.ai)
• Gemini (gemini.google.com)

---

**FEATURES**

✓ Automatic RTL detection
Detects Hebrew characters and applies right-to-left direction to chat messages automatically — both your messages and AI responses.

✓ Live input switching
The text input box switches to RTL as soon as you type Hebrew, and back to LTR when you switch to English. No manual toggling needed.

✓ Smart code block handling
Code blocks (pre, code, terminal output, Monaco editor, CodeMirror) always stay left-to-right. Code never gets scrambled by RTL rules.

✓ Hebrew list alignment
Bullet lists and numbered lists with Hebrew content align correctly to the right with proper indentation.

✓ Streaming response support
Uses a debounced MutationObserver to handle AI responses that stream token by token — RTL is applied as the response loads.

✓ Per-site selector control
Each CSS selector that the extension targets can be individually enabled or disabled from the popup. Advanced users can fine-tune exactly which elements get RTL treatment.

✓ Global ON/OFF toggle
Turn the extension on or off instantly from the popup icon in the toolbar. Your preference is remembered across sessions.

✓ Reset Defaults button
Restore the original selector configuration for the current site with one click.

---

**PRIVACY**

This extension collects absolutely no data.

• No analytics
• No tracking
• No remote server
• No data collection
• Your messages are never read, stored, or transmitted
• All processing happens locally inside your browser
• The only data stored is your toggle state and selector preferences, saved locally via chrome.storage.local

---

**PERMISSIONS**

The extension requests only two permissions:

• storage — to save your ON/OFF state and selector preferences locally
• activeTab — to detect which AI site you are on when the popup opens

No broad host permissions. No access to your browsing history. No network requests.

---

**LIGHTWEIGHT**

No external libraries. No build tools. No dependencies. Pure vanilla JavaScript under 10 KB total.

---

*Unofficial extension — not affiliated with OpenAI, Anthropic, or Google.*
