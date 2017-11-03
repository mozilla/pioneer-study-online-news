const { interfaces: Ci, utils: Cu  } = Components;
Cu.import("resource://gre/modules/Services.jsm");

const PANEL_CSS_URI = Services.io.newURI('resource://pioneer-study-online-news/content/panel.css');

const mappedWindows = new WeakMap();


class InterventionWindow {
  constructor(window) {
    this.window = window;
  }

  static has(key) {
    return mappedWindows.has(key);
  }

  static get(key) {
    return mappedWindows.get(key);
  }

  static set(key, value) {
    return mappedWindows.set(key, value)
  }

  insertCSS() {
    const utils = this.window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
    utils.loadSheet(PANEL_CSS_URI, utils.AGENT_SHEET);
  }

  removeCSS() {
    const utils = this.window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
    utils.removeSheet(PANEL_CSS_URI, utils.AGENT_SHEET);
  }

  startup() {
    InterventionWindow.set(this.window, this);
    this.insertCSS();
  }

  shutdown() {
    this.removeCSS();
  }
}

this.EXPORTED_SYMBOLS = ["InterventionWindow"];
