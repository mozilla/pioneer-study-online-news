const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const EXPORTED_SYMBOLS = ["Config"];

const HOUR = 1000 * 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const Config = {
  studyName: "news",
  schemaVersion: 1,
  branches: [
    { name: "control", weight: 1 },
    { name: "treatment", weight: 1 },
  ],

  updateTimerInterval: 1000,

  /**
   * @typedef {Object} Phase
   * @property {number?} duration
   *    Time before automatically transitioning to the next phase, in
   *    milliseconds. If null or not specified, no automatic
   *    transition will occur. Set to 0 to show the postUrl
   *    immediately.
   * @property {string?} next
   *    Optional. Phase to transition to next. If null or not
   *    specified, no automatic transition will occur.
   * @property {string?} surveyURL
   *    Optional. Url of a page tied to this phase. If specified, at
   *    the start of the phase, a prompt to view this page will be
   *    shown. Will be repeated one a day, up to promptRepeat times.
   * @property {number?} promptRepeat
   *    Optional. Number of times to prompt the user to view the
   *    surveyURL. Defaults to 3.
   * @property {boolean?} lastPhase
   *    Optional. If true, upon reaching this state the study will end.
   */

  firstPhase: 'preTreatment',

  phases: {
    preTreatment: {
      duration: 5000, // 3 * WEEK,
      next: 'treatment',
      surveyURL: "data:text/plain;charset=UTF-8,online-news phase = preTreatment",
    },

    treatment: {
      duration: 5000, // 3 * WEEK,
      next: 'postTreatment',
      surveyURL: "data:text/plain;charset=UTF-8,online-news phase = treatment",
      promptRepeat: 2,
    },

    postTreatment: {
      duration: 5000, // 3 * WEEK,
      next: 'studyEnd',
      surveyURL: "data:text/plain;charset=UTF-8,online-news phase = postTreatment",
    },

    studyEnd: {
      lastPhase: true,
    }
  }
};
