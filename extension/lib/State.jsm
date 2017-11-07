/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-online-news/Config.jsm"
);

this.EXPORTED_SYMBOLS = ["State"];

const STATE_PREF = "extensions.pioneer-online-news.state";

XPCOMUtils.defineLazyGetter(this, "DEFAULT_STATE", () => {
  return {
    phaseName: Config.firstPhase,
    lastTransition: Date.now(),
    promptsRemaining: {},
    lastSurveyShown: {},
  };
});

this.State = {
  load() {
    const stateJson = Services.prefs.getCharPref(STATE_PREF, "");
    try {
      return JSON.parse(stateJson);
    } catch (err) {
      this.save(DEFAULT_STATE);
      return DEFAULT_STATE;
    }
  },

  save(newState) {
    Services.prefs.setCharPref(STATE_PREF, JSON.stringify(newState));
  },

  update(updates) {
    const newState = Object.assign(this.load(), updates);
    this.save(newState);
    return newState;
  },

  clear() {
    Services.prefs.clearUserPref(STATE_PREF);
  }
};
