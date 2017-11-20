/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "BiasDoorhanger", "resource://pioneer-study-online-news/lib/BiasDoorhanger.jsm"
);

this.EXPORTED_SYMBOLS = ["ActiveURIService"];

/**
 * Converts an nsISupports object (returned by window observers) that
 * implements a XUL Window into a ChromeWindow object.
 */
function getDOMWindow(subject) {
  return (
    subject
    .QueryInterface(Ci.nsIXULWindow)
    .docShell
    .QueryInterface(Ci.nsIInterfaceRequestor)
    .getInterface(Ci.nsIDOMWindow)
  );
}

this.ActiveURIService = {
  focusedWindow: null,
  focusedURI: null,

  // Windows with registered listeners
  trackedWindows: new Set(),

  // Objects listening to changes in the active URI
  observers: new Set(),

  startup() {
    Services.obs.addObserver(this, "xul-window-registered");
    Services.obs.addObserver(this, "xul-window-destroyed");

    // Register existing windows for tracking
    const windowList = Services.wm.getEnumerator(null);
    while (windowList.hasMoreElements()) {
      const window = windowList.getNext();
      this.setupWindow(window);
    }

    // Set the focused URI to the currently-focused URI if possible
    const mostRecentWindow = Services.wm.getMostRecentWindow(null);
    this.onFocusWindow(mostRecentWindow);
  },

  updateTrackedWindows() {
    // Cleanup tracked domWindows.
    // We have to do this because xul-window-destroyed doesn't come
    // back with a pointer to the domWindow that is being destroyed.
    for (const domWindow of this.trackedWindows) {
      this.untrackWindow(domWindow);
    }

    const windowList = Services.wm.getEnumerator(null);
    while (windowList.hasMoreElements()) {
      const window = windowList.getNext();
      if (!this.isWindowPrivate(window)) {
        this.trackWindow(window);
      }
    }
  },

  shutdown() {
    Services.obs.removeObserver(this, "xul-window-registered");

    // Clean up tracked windows
    for (const domWindow of this.trackedWindows) {
      this.untrackWindow(domWindow);
    }
  },

  addObserver(observer) {
    this.observers.add(observer);
  },

  removeObserver(observer) {
    this.observers.delete(observer);
  },

  setFocusedURI(domWindow, uri) {
    this.focusedURI = uri;
    for (const observer of this.observers) {
      observer.observe(this, "uriFocused", {
        window: domWindow,
        uri
      });
    }
  },

  setupWindow(domWindow) {
    if (!this.isWindowPrivate(domWindow)) {
      this.trackWindow(domWindow);

      const doorhanger = new BiasDoorhanger(domWindow);
      this.addObserver(doorhanger);
    }
  },

  isWindowPrivate(domWindow) {
    const privacyContext = domWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                                    .getInterface(Ci.nsIWebNavigation)
                                    .QueryInterface(Ci.nsILoadContext);
    return privacyContext.usePrivateBrowsing;
  },

  trackWindow(domWindow) {
    this.trackedWindows.add(domWindow);
    domWindow.addEventListener("focus", this);
    domWindow.addEventListener("blur", this);
    if (domWindow.gBrowser) {
      domWindow.gBrowser.addProgressListener({
        onLocationChange: this.onLocationChange.bind(this, domWindow),
      });
    }
  },

  untrackWindow(domWindow) {
    domWindow.removeEventListener("focus", this);
    domWindow.removeEventListener("blur", this);
    if (domWindow.gBrowser) {
      domWindow.gBrowser.removeProgressListener(this);
    }
    this.trackedWindows.delete(domWindow);
  },

  onRegisterWindow(domWindow) {
    domWindow.addEventListener("load", () => {
      this.setupWindow(domWindow);
    });
  },

  onFocusWindow(domWindow) {
    this.focusedWindow = domWindow;
    if (domWindow.gBrowser) {
      this.setFocusedURI(domWindow, domWindow.gBrowser.currentURI);
    } else {
      this.setFocusedURI(domWindow, null);
    }
  },

  onBlurWindow(domWindow) {
    if (domWindow === this.focusedWindow) {
      this.focusedWindow = null;
      this.setFocusedURI(domWindow, null);
    }
  },

  onLocationChange(domWindow, progress, request, uri) {
    if (domWindow === this.focusedWindow) {
      this.setFocusedURI(domWindow, uri);
    }
  },

  observe(subject, topic, data) {
    switch (topic) {
      case "xul-window-registered":
        this.onRegisterWindow(getDOMWindow(subject));
        break;
      case "xul-window-destroyed":
        this.updateTrackedWindows();
        break;
    }
  },

  handleEvent(event) {
    switch (event.type) {
      // DOMWindow events
      case "focus":
        this.onFocusWindow(event.target);
        break;
      case "blur":
        this.onBlurWindow(event.target);
        break;
    }
  }
};
