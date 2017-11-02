/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.importGlobalProperties(['fetch']);

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-online-news/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "ActiveURIService", "resource://pioneer-study-online-news/lib/ActiveURIService.jsm",
);
XPCOMUtils.defineLazyModuleGetter(
  this, "DwellTime", "resource://pioneer-study-online-news/lib/DwellTime.jsm",
);
XPCOMUtils.defineLazyModuleGetter(
  this, "State", "resource://pioneer-study-online-news/lib/State.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Phases", "resource://pioneer-study-online-news/lib/Phases.jsm"
);

const TIMER_NAME = "pioneer-online-news-study-state";
const REASONS = {
  APP_STARTUP:      1, // The application is starting up.
  APP_SHUTDOWN:     2, // The application is shutting down.
  ADDON_ENABLE:     3, // The add-on is being enabled.
  ADDON_DISABLE:    4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL:    5, // The add-on is being installed.
  ADDON_UNINSTALL:  6, // The add-on is being uninstalled.
  ADDON_UPGRADE:    7, // The add-on is being upgraded.
  ADDON_DOWNGRADE:  8, // The add-on is being downgraded.
};
const UI_AVAILABLE_NOTIFICATION = "sessionstore-windows-restored";
const STATE_PREF = "extensions.pioneer-online-news.state";

this.Bootstrap = {
  install() {},

  startup(data, reason) {
    // If the app is starting up, wait until the UI is available before finishing
    // init.
    if (reason === REASONS.APP_STARTUP) {
      Services.obs.addObserver(this, UI_AVAILABLE_NOTIFICATION);
    } else {
      this.finishStartup();
    }
  },

  observe(subject, topic, data) {
    if (topic === UI_AVAILABLE_NOTIFICATION) {
      Services.obs.removeObserver(this, UI_AVAILABLE_NOTIFICATION);
      this.finishStartup();
    }
  },

  /**
   * Add-on startup tasks delayed until after session restore so as
   * not to slow down browser startup.
   */
  async finishStartup() {
    const domainResponse = await fetch("resource://pioneer-study-online-news/domains.json");
    const domains = await domainResponse.json();
    const trackedHosts = domains.map(d => d.domain);

    ActiveURIService.startup();
    DwellTime.startup(trackedHosts);
    Phases.startup();
  },

  shutdown(data, reason) {
    // In case the observer didn't run, clean it up.
    try {
      Services.obs.removeObserver(this, UI_AVAILABLE_NOTIFICATION);
    } catch (err) {
      // It must already be removed!
    }

    if (reason === REASONS.ADDONS_UNINSTALL) {
      State.clear();
    }

    DwellTime.shutdown();
    ActiveURIService.shutdown();
    Phases.shutdown();

    Cu.unload("resource://pioneer-study-online-news/Config.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/ActiveURIService.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/DwellTime.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/Phases.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/State.jsm");
  },

  uninstall() {},
};

// Expose bootstrap methods on the global
for (const methodName of ["install", "startup", "shutdown", "uninstall"]) {
  this[methodName] = Bootstrap[methodName].bind(Bootstrap);
}
