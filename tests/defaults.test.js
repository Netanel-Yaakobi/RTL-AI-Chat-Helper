const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "defaults.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${source}; this.NATI_DEFAULTS = NATI_DEFAULTS;`, context);

for (const domain of ["chatgpt.com", "claude.ai", "gemini.google.com"]) {
  const selectors = context.NATI_DEFAULTS[domain];
  assert.ok(Array.isArray(selectors), `${domain} has selectors`);
  assert.ok(selectors.some((item) => item.target === "input"), `${domain} has input selectors`);
  assert.ok(selectors.some((item) => item.target === "messages"), `${domain} has message selectors`);
  assert.ok(selectors.every((item) => item.selector && item.enabled === true), `${domain} selectors are enabled`);
}

console.log("defaults tests passed");
