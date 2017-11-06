const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const EXPORTED_SYMBOLS = ["Config"];

const HOUR = 1000 * 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const Config = {
  addonId: "pioneer-study-online-news@mozilla.org",
  studyName: "online-news",
  branches: [
    { name: "control", weight: 1 },
    { name: "treatment", weight: 1 },
  ],

  updateTimerInterval: 1 * DAY,
  showDoorhangerInterval: 1 * DAY,

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
   * @property {boolean?} surveyOnly
   *    Once a survey has been given to the user, go to the next
   *    phase, regardless of the time spend.
   * @property {boolean?} lastPhase
   *    Optional. If true, upon reaching this state the study will end.
   */

  firstPhase: 'preTreatment',

  phases: {
    preTreatment: {
      duration: 3 * WEEK,
      next: 'treatment',
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-1",
    },

    treatment: {
      duration: 3 * WEEK,
      next: 'postTreatment',
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-2",
      treatment: true,
      promptRepeat: 2,
    },

    postTreatment: {
      duration: 3 * WEEK,
      next: 'postStudy',
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-3",
    },

    postStudy: {
      duration: 1 * WEEK,
      surveyOnly: true,
      next: 'studyEnd',
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-4",
    },

    studyEnd: {
      lastPhase: true,
    }
  }
};
