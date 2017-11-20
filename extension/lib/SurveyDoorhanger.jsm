const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Panels", "resource://pioneer-study-online-news/lib/Panels.jsm",
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Phases", "resource://pioneer-study-online-news/lib/Phases.jsm",
);

this.EXPORTED_SYMBOLS = ["SurveyDoorhanger"];

const DOORHANGER_URL = "resource://pioneer-study-online-news/content/doorhanger/doorhanger-survey.html";
const FRAME_SCRIPT_URL = "resource://pioneer-study-online-news/content/doorhanger/doorhanger-survey.js";
const PANEL_ID = "online-news-survey-panel";

const MESSAGES = {
  SHOW_SURVEY: "PioneerOnlineNews::show-survey",
};

const mappedWindows = new WeakMap();


class SurveyDoorhanger {
  constructor(browserWindow) {
    this.browserWindow = browserWindow;
    this.panel = Panels.create(browserWindow, PANEL_ID, DOORHANGER_URL);
    this.panelBrowser = Panels.getEmbeddedBrowser(this.panel);

    const mm = this.panelBrowser.messageManager;
    const self = this;

    Object.values(MESSAGES).forEach(message => {
      mm.addMessageListener(message, self);
    });

    mm.loadFrameScript(`${FRAME_SCRIPT_URL}?${Math.random()}`, false);
    mm.sendAsyncMessage("PioneerOnlineNews::load", {});
  }

  static getOrCreate(browserWindow) {
    if (mappedWindows.has(browserWindow)) {
      return mappedWindows.get(browserWindow);
    }
    const doorhanger = new SurveyDoorhanger(browserWindow);
    mappedWindows.set(browserWindow, doorhanger);
    return doorhanger;
  }

  show(surveyUrl, anchor) {
    Panels.ensureStyleSheetsLoaded();
    this.surveyUrl = surveyUrl;
    const document = this.browserWindow.window.document;
    if (!anchor) {
      anchor = document.getElementById("PanelUI-menu-button"); // Hamburger menu button
    }
    this.panelBrowser.messageManager.sendAsyncMessage("PioneerOnlineNews::update");
    this.panel.openPopup(anchor, "bottomcenter topright", 0, 0, false, false);
  }

  hide() {
    if (this.panel && this.panel.hidePopup) {
      this.panel.hidePopup();
    }
  }

  showSurvey() {
    const browser = this.browserWindow.gBrowser;
    browser.selectedTab = browser.addTab(this.surveyUrl);
    this.hide();

    // If the current phase is a survey only skip ahead
    const phase = Phases.getCurrentPhase();
    if (phase.surveyOnly) {
      Phases.gotoNextPhase();
    }
  }

  receiveMessage(message) {
    switch (message.name) {
      case MESSAGES.SHOW_SURVEY:
        this.showSurvey();
        break;

      default:
        break;
    }
  }
}
