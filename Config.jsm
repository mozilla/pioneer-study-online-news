/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(config|EXPORTED_SYMBOLS)" }]*/

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "AddonManager", "resource://gre/modules/AddonManager.jsm");

const EXPORTED_SYMBOLS = ["config"];

const config = {
  pioneer: {
    studyName: "example",  // this name must match the pipeline schema to be used
    studyVersion: 1,
  },
  async isEligible() {
    const addon = await AddonManager.getAddonByID("pioneer-opt-in@mozilla.org");
    return addon !== null;
  },
};
