/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

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

this.DwellTime = {
  trackedHosts: new Set(),
  dwellTimes: new Map(),

  dwellStartTime: null, // Timestamp when the idle state or focused host last changed
  focusedHost: null, // Host of the currently-focused URI
  userIsIdle: false, // Whether the user is currently idle or not

  startup(trackedHosts) {
    this.trackedHosts = new Set(trackedHosts);
    IdleService.addIdleObserver(this, IDLE_DELAY_SECONDS);
    ActiveURIService.addObserver(this);
    this.onFocusURI(ActiveURIService.focusedURI);
  },

  shutdown() {
    ActiveURIService.removeObserver(this);
    IdleService.removeIdleObserver(this, IDLE_DELAY_SECONDS);
  },

  /**
   * Called before the idle state or the currently focused URI changes. Logs the
   * dwell time on the previous hostname.
   */
  logPreviousDwell(now) {
    // dwellStartTime is null on startup
    // focusedHost is null if the user was looking at a non-browser window
    // userIsIdle is true if the user was not active
    // If any of these is the case, we don't log activity.
    if (!this.dwellStartTime || !this.focusedHost || this.userIsIdle) {
      return;
    }

    if (this.trackedHosts.has(this.focusedHost)) {
      let dwellTime = this.dwellTimes.get(this.focusedHost) || 0;
      dwellTime += (now - this.dwellStartTime);
      this.dwellTimes.set(this.focusedHost, dwellTime);
    }
  },

  onFocusURI(uri) {
    const now = Date.now();
    this.logPreviousDwell(now);

    let host = null;
    if (uri && ACCEPTED_SCHEMES.has(uri.scheme)) {
      host = uri.host;
    }

    this.dwellStartTime = now;
    this.focusedHost = host;
  },

  onIdle() {
    const now = Date.now();
    this.logPreviousDwell(now);

    this.dwellStartTime = now;
    this.userIsIdle = true;
  },

  onIdleBack() {
    const now = Date.now();
    this.logPreviousDwell(now);

    this.dwellStartTime = now;
    this.userIsIdle = false;

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
