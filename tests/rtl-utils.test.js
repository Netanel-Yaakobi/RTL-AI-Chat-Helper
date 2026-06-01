const assert = require("node:assert/strict");
const path = require("node:path");

const utils = require(path.join(__dirname, "..", "src", "rtl-utils.js"));

const cases = [
  ["detects Hebrew text", "תוסף RTL מומלץ ל-GPT וקלוד ב-WEB"],
  ["detects Arabic text", "إضافة RTL مفيدة للذكاء الاصطناعي"],
  ["detects mixed text that starts with English", "GPT אחלה של AI"],
  ["detects mixed Arabic text that starts with English", "GPT ممتاز للكتابة"],
];

for (const [name, text] of cases) {
  assert.equal(utils.containsRTL(text), true, name);
  assert.equal(utils.shouldUseRTLDirection(text, "includes"), true, name);
}

assert.equal(utils.containsRTL("GPT is a helpful AI"), false, "does not detect plain English as RTL");
assert.equal(utils.shouldUseRTLDirection("GPT is a helpful AI", "includes"), false, "keeps plain English LTR");

assert.equal(
  utils.shouldUseRTLDirection("GPT אחלה של AI", "equals"),
  false,
  "equals mode still requires mostly RTL text"
);

console.log("rtl-utils tests passed");
