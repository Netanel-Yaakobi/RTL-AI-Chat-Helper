const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const defaultsSource = fs.readFileSync(path.join(__dirname, "..", "src", "defaults.js"), "utf8");
const defaultsContext = {};
vm.createContext(defaultsContext);
vm.runInContext(`${defaultsSource}; this.NATI_DEFAULTS = NATI_DEFAULTS;`, defaultsContext);

const claudeInputs = defaultsContext.NATI_DEFAULTS["claude.ai"].filter((item) => item.target === "input");
assert.ok(
  claudeInputs.some((item) => item.selector.includes("[contenteditable]")),
  "Claude input selectors should match any contenteditable value"
);

const claudeSelectors = defaultsContext.NATI_DEFAULTS["claude.ai"].map((item) => item.selector);
assert.equal(
  claudeSelectors.some((selector) => selector.includes("div[class*='prose']")),
  false,
  "Claude defaults should not use broad prose substring selectors"
);
assert.equal(
  claudeSelectors.includes(".font-claude-message"),
  false,
  "Claude defaults should not use broad message font selectors"
);

assert.equal(
  defaultsContext.NATI_DEFAULTS["claude.ai"].some((item) => item.target === "userMessages"),
  true,
  "Claude user messages should be handled separately from assistant messages"
);
assert.equal(
  defaultsContext.NATI_DEFAULTS["claude.ai"].some((item) => item.selector.includes("human-turn")),
  true,
  "Claude user messages should include human-turn fallback selectors"
);
assert.equal(
  defaultsContext.NATI_DEFAULTS["claude.ai"].some((item) => item.selector.includes(".whitespace-pre-wrap.break-words")),
  true,
  "Claude user messages should include the sent-message paragraph selector"
);
assert.equal(
  defaultsContext.NATI_DEFAULTS["claude.ai"].some((item) => item.selector.includes(".standard-markdown")),
  true,
  "Claude assistant messages should include standard-markdown fallback"
);

const contentSource = fs.readFileSync(path.join(__dirname, "..", "src", "content.js"), "utf8");
const childSelectorLine = contentSource
  .split(/\r?\n/)
  .find((line) => line.includes("CHILD_TEXT_SELECTOR"));

assert.ok(childSelectorLine, "content script exposes child text selector");
assert.equal(childSelectorLine.includes("span"), false, "inline spans should not get independent RTL classes");
assert.equal(childSelectorLine.includes("div"), false, "nested divs should not get independent RTL classes");
assert.ok(contentSource.includes("CLASS_ALIGN_RIGHT"), "content script should support align-only mixed LTR-leading text");
assert.ok(contentSource.includes("firstStrongIsRTL"), "content script should detect text base direction");
assert.ok(contentSource.includes("closest(SKIP_ANCESTOR_SELECTOR)"), "content script should skip chat titles and sidebar controls");
assert.equal(
  contentSource.includes('alignOnly: target === "userMessages"'),
  false,
  "user messages should not force align-only; first strong character should decide direction"
);
assert.ok(
  contentSource.includes('forceRootDirection: target === "userMessages"'),
  "user message roots should be allowed to receive RTL direction"
);

console.log("content behavior tests passed");
