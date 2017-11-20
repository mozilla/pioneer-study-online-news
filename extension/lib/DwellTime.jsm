/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-online-news/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "LogStorage", "resource://pioneer-study-online-news/lib/LogStorage.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "ActiveURIService", "resource://pioneer-study-online-news/lib/ActiveURIService.jsm",
);
XPCOMUtils.defineLazyServiceGetter(
  this, "IdleService", "@mozilla.org/widget/idleservice;1", "nsIIdleService",
);

this.EXPORTED_SYMBOLS = ["DwellTime"];

const ACCEPTED_SCHEMES = new Set(["http", "https"]);


this.DwellTime = {
  dwellStartTime: null, // Timestamp when the idle state or focused host last changed
  focusedUrl: null, // URL of the currently-focused URI

  startup() {
    IdleService.addIdleObserver(this, Config.idleDelaySeconds);
    ActiveURIService.addObserver(this);
    this.onFocusURI(ActiveURIService.focusedURI);
    LogStorage.uploadPings();
    setInterval(LogStorage.uploadPings.bind(LogStorage), Config.logUploadAttemptInterval);
  },

  shutdown() {
    ActiveURIService.removeObserver(this);
    IdleService.removeIdleObserver(this, Config.idleDelaySeconds);
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

    let unixTs = Math.round(now / 1000);
    let obj = {url: this.focusedUrl, details: idle_tag, timestamp: unixTs};
    LogStorage.put(obj);
  },

  onFocusURI(data) {
    const uri = data.uri;
    const now = Date.now();
    this.logPreviousDwell("focus-end", now);

    let url = null;
    if (uri && ACCEPTED_SCHEMES.has(uri.scheme)) {
      url = uri.spec;
    }

    this.focusedUrl = url;
    this.logPreviousDwell("focus-start", now);
  },

  onIdle() {
    const now = Date.now();
    this.logPreviousDwell("idle-start", now);
  },

  onIdleBack() {
    const now = Date.now();
    this.logPreviousDwell("idle-end", now);
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
