/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "NewsStorage",
  "resource://pioneer-study-online-news/lib/NewsStorage.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "ActiveURIService", "resource://pioneer-study-online-news/lib/ActiveURIService.jsm",
);
XPCOMUtils.defineLazyServiceGetter(
  this, "IdleService", "@mozilla.org/widget/idleservice;1", "nsIIdleService",
);

this.EXPORTED_SYMBOLS = ["DwellTime"];

const ACCEPTED_SCHEMES = new Set(['http', 'https']);
const IDLE_DELAY_SECONDS = Services.prefs.getIntPref(
  "extensions.pioneer-study-online-news.idleDelaySeconds", 5,
);
// Schedule uploads to run on a 3 hour interval
// Reduce this interval to test the uploads
const DELAY_TIME = 1000 * 3 * 60 * 60;

this.DwellTime = {
  dwellStartTime: null, // Timestamp when the idle state or focused host last changed
  focusedUrl: null, // URL of the currently-focused URI

  startup() {
    IdleService.addIdleObserver(this, IDLE_DELAY_SECONDS);
    ActiveURIService.addObserver(this);
    this.onFocusURI(ActiveURIService.focusedURI);
    NewsStorage.uploadPings();
    setInterval(NewsStorage.uploadPings.bind(NewsStorage), DELAY_TIME);
  },

  shutdown() {
    ActiveURIService.removeObserver(this);
    IdleService.removeIdleObserver(this, IDLE_DELAY_SECONDS);
  },

  /**
   * Called before the idle state or the currently focused URI changes. Logs the
   * dwell time on the previous hostname.
   */
  logPreviousDwell(idle_tag, now) {
    // dwellStartTime is null on startup
    // focusedUrl is null if the user was looking at a non-browser window
    // If this is the case, we don't log activity.
    if (!this.focusedUrl) {
      return;
    }

    let unixTs = Math.round(now/1000);
    let obj = {url: this.focusedUrl, details: idle_tag, timestamp: unitTs};
    NewsStorage.put(obj);
  },

  onFocusURI(uri) {
    const now = Date.now();
    this.logPreviousDwell('onfocus', now);

    let host = null;
    let url = null;
    if (uri && ACCEPTED_SCHEMES.has(uri.scheme)) {
      host = uri.host;
      url = uri.spec;
    }

    this.focusedUrl = url;
  },

  onIdle() {
    const now = Date.now();
    this.logPreviousDwell('idle-start', now);
  },

  onIdleBack() {
    const now = Date.now();
    this.logPreviousDwell('idle-end', now);
  },

  observe(subject, topic, data) {
    switch (topic) {
      case "uriFocused":
        this.onFocusURI(data);
        break;
      case "idle":
        this.onIdle();
        break;
      case "active":
        this.onIdleBack();
        break;
    }
  }
};
