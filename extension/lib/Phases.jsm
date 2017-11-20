/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");
Cu.importGlobalProperties(["URL"]);

XPCOMUtils.defineLazyModuleGetter(
  this, "AddonManager", "resource://gre/modules/AddonManager.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "RecentWindow", "resource:///modules/RecentWindow.jsm"
);
XPCOMUtils.defineLazyServiceGetter(
  this, "timerManager", "@mozilla.org/updates/timer-manager;1", "nsIUpdateTimerManager"
);

XPCOMUtils.defineLazyModuleGetter(
  this, "Pioneer", "resource://pioneer-study-online-news/lib/Pioneer.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-online-news/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "State", "resource://pioneer-study-online-news/lib/State.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "SurveyDoorhanger", "resource://pioneer-study-online-news/lib/SurveyDoorhanger.jsm"
);

this.EXPORTED_SYMBOLS = ["Phases"];

const TIMER_NAME = "pioneer-online-news-phases-timer";


this.Phases = {
  updateStateMachineInterval: null,

  startup() {
    // for < 10 minute timers, use set interval for testing purposes
    if (Config.updateTimerInterval < 1000 * 60 * 10) {
      this.updateStateMachineInterval = setInterval(this.updateStateMachine.bind(this), Config.updateTimerInterval);
    } else {
      timerManager.registerTimer(TIMER_NAME, this.updateStateMachine.bind(this), Config.updateTimerInterval);
    }

    this.updateStateMachine();
  },

  shutdown() {
    if (this.updateStateMachineInterval) {
      clearInterval(this.updateStateMachineInterval);
    } else {
      timerManager.unregisterTimer(TIMER_NAME);
    }
  },

  getCurrentPhase() {
    const state = State.load();
    return Config.phases[state.phaseName];
  },

  /**
   * Checks current phase and phase change criteria. Called via
   * persistent timer.
   */
  updateStateMachine() {
    const state = State.load();
    const phase = this.getCurrentPhase();

    if (!phase) {
      throw new Error(`Unknown study phase ${state.phaseName}`);
    }

    if (phase.surveyURL) {
      this.showSurvey(phase.surveyURL);
    }

    const now = Date.now();
    const sinceLastTransition = now - state.lastTransition;
    if (phase.duration && sinceLastTransition >= phase.duration) {
      this.gotoNextPhase();
    }
  },

  /** Unconditionally goes to the next phase. */
  gotoNextPhase() {
    let phase = this.getCurrentPhase();
    const state = State.update({ phaseName: phase.next, lastTransition: Date.now() });
    phase = Config.phases[state.phaseName];
    if (!phase) {
      throw new Error(`Unknown next phase ${state.phaseName}`);
    }

    if (phase.lastPhase) {
      Pioneer.utils.endStudy();
    }
  },

  /**
   * Prompts the user to take a survey.
   */
  showSurvey() {
    const state = State.load();
    const phase = this.getCurrentPhase();

    if (!state.promptsRemaining.hasOwnProperty(state.phaseName)) {
      state.promptsRemaining[state.phaseName] = phase.promptRepeat || 3;
    }

    const hasPromptsRemaining = state.promptsRemaining[state.phaseName] > 0;

    if (!state.lastSurveyShown.hasOwnProperty(state.phaseName)) {
      state.lastSurveyShown[state.phaseName] = 0;
    }

    const timesinceSurveyShown = Date.now() - state.lastSurveyShown[state.phaseName];
    const shouldShowDoorhanger = timesinceSurveyShown > Config.showDoorhangerInterval;

    if (shouldShowDoorhanger && hasPromptsRemaining) {
      const recentWindow = RecentWindow.getMostRecentBrowserWindow({
        private: false,
        allowPopups: false,
      });

      if (recentWindow && recentWindow.gBrowser) {
        const surveyURL = new URL(phase.surveyURL);
        surveyURL.searchParams.set("utm_source", "pioneer");
        surveyURL.searchParams.set("utm_campaign", "online-news");
        surveyURL.searchParams.set("pioneer_id", Pioneer.utils.getPioneerId());
        const dh = SurveyDoorhanger.getOrCreate(recentWindow);
        dh.show(surveyURL.href);

        // Update state
        state.promptsRemaining[state.phaseName] -= 1;
        state.lastSurveyShown[state.phaseName] = Date.now();
        State.save(state);
      }
    }
  },
};
