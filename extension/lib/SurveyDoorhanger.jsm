const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");


XPCOMUtils.defineLazyModuleGetter(
  this, "Panels", "resource://pioneer-study-online-news/lib/Panels.jsm",
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Phases", "resource://pioneer-study-online-news/lib/Phases.jsm",
);

const DOORHANGER_URL = "resource://pioneer-study-online-news/content/doorhanger/doorhanger-survey.html";
const FRAME_SCRIPT_URL = "resource://pioneer-study-online-news/content/doorhanger/doorhanger-survey.js";
const PANEL_ID = "online-news-survey-panel";

const MESSAGES = {
  SHOW_SURVEY: "PioneerOnlineNews::show-survey",
};


class SurveyDoorhanger {
  constructor(browserWindow) {
    this.browserWindow = browserWindow;

    this.panel = Panels.getPanel(browserWindow, PANEL_ID);
    const panelExists = !!this.panel;

    if (!panelExists) {
      this.panel = Panels.create(browserWindow, PANEL_ID, DOORHANGER_URL);
    }
    this.panelBrowser = Panels.getEmbeddedBrowser(this.panel);

    if (!panelExists) {
      const mm = this.panelBrowser.messageManager;
      const self = this;

      Object.values(MESSAGES).forEach(message => {
        mm.addMessageListener(message, self);
      });

      mm.loadFrameScript(`${FRAME_SCRIPT_URL}?${Math.random()}`, false);
      mm.sendAsyncMessage("PioneerOnlineNews::load", {});
    }
  }

  show(surveyUrl, anchor) {
    this.surveyUrl = surveyUrl;
    const document = this.browserWindow.window.document;
    if (!anchor) {
      anchor = document.getElementById("PanelUI-menu-button"); // Hamburger menu button
    }
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
      this.gotoNextPhase();
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

this.EXPORTED_SYMBOLS = ["SurveyDoorhanger"];
