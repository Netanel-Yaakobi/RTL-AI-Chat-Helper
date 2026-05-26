# Release Checklist — RTL AI Chat Helper v1.0.0

Work through this list top to bottom before uploading to the Chrome Web Store.

---

## 1. Load unpacked test

- [ ] Open `chrome://extensions`
- [ ] Enable Developer mode
- [ ] Click **Load unpacked** → select the project folder
- [ ] Extension appears with name **RTL AI Chat Helper**
- [ ] Icon appears in the toolbar (purple square with white arrow)
- [ ] No errors shown in the Extensions page
- [ ] Click the icon → popup opens correctly

---

## 2. ChatGPT test (`chatgpt.com`)

- [ ] Open a conversation
- [ ] Type Hebrew in the input box → direction switches to RTL immediately
- [ ] Send a Hebrew message → bubble is right-aligned
- [ ] Receive a Hebrew AI response → response is right-aligned
- [ ] Type English → input switches back to LTR
- [ ] Hover over a code block → **copy button stays at top-left** (not shifted)
- [ ] Inspect a code block → `direction: ltr` in computed styles
- [ ] Disable one selector in popup → that element type is no longer processed
- [ ] Toggle OFF → all RTL removed; toggle ON → RTL re-applied
- [ ] Reload page → extension still works (MutationObserver re-attaches)

---

## 3. Claude test (`claude.ai`)

- [ ] Open a conversation
- [ ] Type Hebrew in the input → switches to RTL
- [ ] Send a Hebrew message → right-aligned
- [ ] Receive a Hebrew AI response → response is right-aligned
- [ ] Hebrew bullet lists → right-aligned with indent on the right
- [ ] Code block inside a response → stays LTR
- [ ] Action buttons (copy, thumbs up/down) → stay in original position
- [ ] Open popup → domain shows `claude.ai`
- [ ] Click **Reset Defaults** → selectors reset without page refresh needed

---

## 4. Gemini test (`gemini.google.com`)

- [ ] Open a conversation
- [ ] Type Hebrew in the input → switches to RTL
- [ ] Send a Hebrew message → right-aligned
- [ ] AI Hebrew response → RTL
- [ ] Code blocks → LTR

---

## 5. Popup test

- [ ] Popup title shows **RTL AI Chat Helper**
- [ ] Domain row shows the correct site name (not "Unknown")
- [ ] Selector list renders with checkboxes and mode badges
- [ ] Checking/unchecking a selector immediately affects the page (no refresh needed)
- [ ] Toggle OFF → extension disables; toggle ON → re-enables
- [ ] Reset Defaults → restores original selector list for current domain
- [ ] Popup works on all three supported sites

---

## 6. Permissions review

- [ ] Open `manifest.json` — confirm only `"storage"` and `"activeTab"` are listed
- [ ] No `"tabs"` permission
- [ ] No `"history"` permission
- [ ] No `"webRequest"` permission
- [ ] No `"<all_urls>"` or `"http://*/*"` host permission
- [ ] Content scripts only injected on the three AI domains

---

## 7. Code cleanliness

- [ ] No `console.log` statements in `content.js` or `popup.js`
- [ ] No temporary test selectors in `defaults.js`
- [ ] No experimental or commented-out code blocks left in production files
- [ ] `src/defaults.js` — all selectors verified working
- [ ] `src/content.js` — no debug artifacts

---

## 8. Screenshot requirements

Chrome Web Store requires at least one screenshot. Recommended set:

| Screenshot | Size | What to show |
|---|---|---|
| Hebrew typing in ChatGPT | 1280×800 | Input box switched to RTL mid-sentence |
| Hebrew AI response in ChatGPT | 1280×800 | RTL response alongside LTR code block |
| Hebrew response in Claude | 1280×800 | RTL prose response |
| Extension popup | 640×400 | Popup with domain, toggle, and selector list visible |

**How to take screenshots:**
1. Open Chrome DevTools → toggle device toolbar (Ctrl+Shift+M)
2. Set dimensions to 1280×800
3. Use the DevTools "Capture screenshot" option for pixel-perfect results

---

## 9. ZIP packaging steps

1. Open the project folder in Explorer.
2. **Do not include:**
   - `.claude/` folder (internal IDE config)
   - `RELEASE_CHECKLIST.md` (optional — store won't reject it but keep it clean)
   - Any `.js` temp/generator scripts
3. Select everything else:
   ```
   icons/
   src/
   manifest.json
   README.md
   PRIVACY_POLICY.md
   STORE_DESCRIPTION.md
   SHORT_DESCRIPTION.txt
   ```
4. Right-click → **Send to → Compressed (zipped) folder** (Windows)
   OR: `zip -r rtl-ai-chat-helper-v1.0.0.zip icons/ src/ manifest.json README.md PRIVACY_POLICY.md STORE_DESCRIPTION.md SHORT_DESCRIPTION.txt`
5. Name the file: `rtl-ai-chat-helper-v1.0.0.zip`

---

## 10. Chrome Web Store upload steps

1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account (requires a one-time $5 developer registration fee).
3. Click **New item**.
4. Upload `rtl-ai-chat-helper-v1.0.0.zip`.
5. Fill in the listing:
   - **Name:** RTL AI Chat Helper
   - **Short description:** (copy from `SHORT_DESCRIPTION.txt`)
   - **Description:** (copy from `STORE_DESCRIPTION.md` — the text between the dividers)
   - **Category:** Productivity
   - **Language:** Hebrew or English (choose your primary)
6. Upload screenshots (minimum 1, recommended 4).
7. Set **Privacy practices** → declare that the extension does **not** collect user data.
   - Under "Data usage" → select "None" for all categories.
8. Add the Privacy Policy URL if you host `PRIVACY_POLICY.md` anywhere (GitHub, personal site).
   - If no URL yet, you can host it as a GitHub Gist and paste the raw URL.
9. Click **Submit for review**.
10. Review typically takes 1–3 business days.

---

## Done

All boxes checked? You are ready to publish.
