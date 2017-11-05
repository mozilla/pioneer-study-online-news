/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");

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

this.EXPORTED_SYMBOLS = ["Phases"];

this.Phases = {
  updateStateMachineInterval: null,

  startup() {
    // for < 10 minute timers, use set interval for testing purposes
    if (Config.updateTimerInterval < 1000 * 60 * 10) {
      this.updateStateMachineInterval = setInterval(this.updateStateMachine.bind(this), Config.updateTimerInterval);
    } else {
      timerManager.registerTimer(TIMER_NAME, this.updateStateMachine.bind(this), Config.updateTimerInterval);
    }
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
      return;
    }

    if (phase.surveyURL) {
      this.showSurvey(phase.surveyURL);
    }
  },

  /**
   * Prompts the user to take a survey.
   */
  showSurvey() {
    // TODO: show doorhanger instead of opening tab directly
    // TODO: Only show a survey once per ${INTERVAL}.

    const phase = this.getCurrentPhase();

    if (!state.promptsRemaining.hasOwnProperty(state.phaseName)) {
      state.promptsRemaining[state.phaseName] = phase.promptRepeat || 3;
    }

    if (state.promptsRemaining[state.phaseName] > 0) {
      state.promptsRemaining[state.phaseName] -= 1;
      State.save(state);
      const recentWindow = RecentWindow.getMostRecentBrowserWindow({
        private: false,
        allowPopups: false,
      });
      if (recentWindow && recentWindow.gBrowser) {
        // TODO: add pioneerID and utm_source parameters to surveyURL
        const tab = recentWindow.gBrowser.loadOneTab(phase.surveyURL, { inBackground: false });
      }
    } else if (phase.surveyOnly) {
      this.gotoNextPhase();
    }
  },
};
