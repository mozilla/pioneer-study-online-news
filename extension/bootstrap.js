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
XPCOMUtils.defineLazyModuleGetter(
  this, "InterventionWindow", "resource://pioneer-study-online-news/lib/InterventionWindow.jsm",
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
    ActiveURIService.startup();
    DwellTime.startup();
    Phases.startup();

    const windowEnumerator = Services.wm.getEnumerator("navigator:browser");
    while (windowEnumerator.hasMoreElements()) {
      const window = windowEnumerator.getNext();
      const interventionWindow = new InterventionWindow(window);
      interventionWindow.startup();

      // Show a doorhanger for testing.
      this.doorhangerInterventionTreatment(window);
    }
  },

  doorhangerInterventionTreatment(browserWindow) {
    const document = browserWindow.window.document;
    let panel = document.getElementById("online-news-intervention-panel");
    if (panel === null) { // create the panel
      panel = document.createElement("panel");
      panel.setAttribute("id", "online-news-intervention-panel");
      panel.setAttribute("class", "no-padding-panel");
      panel.setAttribute("type", "arrow");
      panel.setAttribute("noautofocus", true);
      panel.setAttribute("level", "parent");

      const embeddedBrowser = document.createElement("browser");
      embeddedBrowser.setAttribute("id", "online-news-intervention-doorhanger");
      embeddedBrowser.setAttribute("src", "resource://pioneer-study-online-news/content/doorhanger-intervention.html");
      embeddedBrowser.setAttribute("type", "content");
      embeddedBrowser.setAttribute("disableglobalhistory", "true");
      embeddedBrowser.setAttribute("flex", "1");

      panel.appendChild(embeddedBrowser);
      document.getElementById("mainPopupSet").appendChild(panel);

      embeddedBrowser.messageManager.loadFrameScript(
        `resource://pioneer-study-online-news/content/doorhanger.js?${Math.random()}`, false);
      embeddedBrowser.messageManager.sendAsyncMessage("PioneerOnlineNews::load", JSON.stringify({ rating: 0.1234 }));
    }
    const burgerMenu = document.getElementById("PanelUI-menu-button");
    panel.openPopup(burgerMenu, "bottomcenter topright", 0, 0, false, false);
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

    const windowEnumerator = Services.wm.getEnumerator("navigator:browser");
    while (windowEnumerator.hasMoreElements()) {
      const window = windowEnumerator.getNext();
      if (InterventionWindow.has(window)) {
        const browserWindow = InterventionWindow.get(window);
        browserWindow.shutdown();
      }
    }

    Cu.unload("resource://pioneer-study-online-news/Config.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/ActiveURIService.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/DwellTime.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/Phases.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/State.jsm");
    Cu.unload("resource://pioneer-study-online-news/lib/InterventionWindow.jsm");
  },

  uninstall() {},
};

// Expose bootstrap methods on the global
for (const methodName of ["install", "startup", "shutdown", "uninstall"]) {
  this[methodName] = Bootstrap[methodName].bind(Bootstrap);
}
