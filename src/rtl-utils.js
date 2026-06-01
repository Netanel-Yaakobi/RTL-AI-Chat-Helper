(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.NATI_RTL_UTILS = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const RTL_CHAR_REGEX = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  const RTL_CHAR_GLOBAL_REGEX = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;

  function containsRTL(text) {
    return RTL_CHAR_REGEX.test(text || "");
  }

  function rtlRatio(text) {
    const compact = (text || "").replace(/\s/g, "");
    if (!compact) return 0;
    const matches = compact.match(RTL_CHAR_GLOBAL_REGEX);
    return matches ? matches.length / compact.length : 0;
  }

  function shouldUseRTLDirection(text, mode) {
    if (mode === "equals") {
      return rtlRatio(text) > 0.7;
    }
    return containsRTL(text);
  }

  return {
    containsRTL,
    rtlRatio,
    shouldUseRTLDirection
  };
});
