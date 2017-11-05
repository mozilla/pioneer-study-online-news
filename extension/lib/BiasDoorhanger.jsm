const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Panels", "resource://pioneer-study-online-news/lib/Panels.jsm",
);

const DOORHANGER_URL = "resource://pioneer-study-online-news/content/doorhanger/doorhanger-bias.html";
const FRAME_SCRIPT_URL = "resource://pioneer-study-online-news/content/doorhanger/doorhanger.js";
const LEARN_MORE_URL = "chrome://pioneer-study-online-news/content/learn-more.html";

const MESSAGES = {
  AGREE: "PioneerOnlineNews::agree",
  DISAGREE: "PioneerOnlineNews::disagree",
  DISMISS: "PioneerOnlineNews::dismiss",
  LEARN_MORE: "PioneerOnlineNews::learn-more",
};

const mappedWindows = new WeakMap();


class BiasDoorhanger {
  constructor(browserWindow) {
    this.browserWindow = browserWindow;
    this.panel = Panels.create(browserWindow, "online-news-bias-panel", DOORHANGER_URL);
    this.panelBrowser = Panels.getEmbeddedBrowser(this.panel);

    BiasDoorhanger.set(browserWindow, this);

    const mm = this.panelBrowser.messageManager;
    const self = this;

    Object.values(MESSAGES).forEach(message => {
      mm.addMessageListener(message, self);
    });

    mm.loadFrameScript(`${FRAME_SCRIPT_URL}?${Math.random()}`, false);
    mm.sendAsyncMessage("PioneerOnlineNews::load", { rating: 0.1234 });
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

  show(anchor) {
    const document = this.browserWindow.window.document;
    if (!anchor) {
      anchor = document.getElementById("PanelUI-menu-button"); // Hamburger menu button
    }
    this.panel.openPopup(anchor, "bottomcenter topright", 0, 0, false, false);
  }

  hide() {
    this.panel.hidePopup();
  }

  showLearnMore() {
    const browser = this.browserWindow.gBrowser;
    browser.selectedTab = browser.addTab(LEARN_MORE_URL);
    this.hide();
  }

  receiveMessage(message) {
    switch (message.name) {
      case MESSAGES.LEARN_MORE:
        this.showLearnMore();
        break;

      default:
        break;
    }
  }
}

this.EXPORTED_SYMBOLS = ["BiasDoorhanger"];
