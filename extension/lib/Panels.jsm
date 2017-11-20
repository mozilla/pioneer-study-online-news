const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyServiceGetter(
  this, "StyleSheetService", "@mozilla.org/content/style-sheet-service;1", "nsIStyleSheetService",
);

this.EXPORTED_SYMBOLS = ["Panels"];

const PANEL_CSS_URI = Services.io.newURI("resource://pioneer-study-online-news/content/panel.css");


const Panels = {
  startup() {
    this.ensureStyleSheetsLoaded();
  },

  shutdown() {
    if (StyleSheetService.sheetRegistered(PANEL_CSS_URI, StyleSheetService.AGENT_SHEET)) {
      StyleSheetService.unregisterSheet(PANEL_CSS_URI, StyleSheetService.AGENT_SHEET);
    }
  },

  ensureStyleSheetsLoaded() {
    if (!StyleSheetService.sheetRegistered(PANEL_CSS_URI, StyleSheetService.AGENT_SHEET)) {
      StyleSheetService.loadAndRegisterSheet(PANEL_CSS_URI, StyleSheetService.AGENT_SHEET);
    }
  },

  create(browserWindow, id, src) {
    const document = browserWindow.window.document;
    let panel = this.getPanel(browserWindow, id);

    // Create the panel if it does not exist.
    if (panel === null) {
      panel = document.createElement("panel");
      panel.setAttribute("id", id);
      panel.setAttribute("class", "pioneer-panel");
      panel.setAttribute("type", "arrow");
      panel.setAttribute("noautofocus", true);
      panel.setAttribute("level", "parent");

      const embeddedBrowser = document.createElement("browser");
      embeddedBrowser.setAttribute("id", `${id}-embedded-browser`);
      embeddedBrowser.setAttribute("src", src);
      embeddedBrowser.setAttribute("type", "content");
      embeddedBrowser.setAttribute("disableglobalhistory", "true");
      embeddedBrowser.setAttribute("flex", "1");

      panel.appendChild(embeddedBrowser);
      document.getElementById("mainPopupSet").appendChild(panel);
    }

    return panel;
  },

  getPanel(browserWindow, id) {
    const document = browserWindow.window.document;
    return document.getElementById(id);
  },

  getEmbeddedBrowser(panel) {
    return panel.firstChild;
  }
};
