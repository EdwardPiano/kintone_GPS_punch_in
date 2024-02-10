"use strict";

module.exports = {
  extends: "@cybozu/eslint-config/presets/prettier",
  globals: {
    kintone: false,
    moment: false,
    KintoneRestAPIClient: false,
    Kuc: false,
    Swal: false,
    $: false,
    jQuery: false,
    google: false,
    setHtmlStructure: false,
  },
};
