const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const EXPORTED_SYMBOLS = ["Config"];

const TELEMETRY_ENV_PREF = "extensions.pioneer-online-news.telemetryEnv";
const UPDATE_TIMER_PREF = "extensions.pioneer-online-news.updateTimerInterval";
const DOORHANGER_INTERVAL_PREF = "extensions.pioneer-online-news.showDoorhangerInterval";
const LOG_INTERVAL_PREF = "extensions.pioneer-online-news.logSubmissionInterval";
const PRETREATMENT_DURATION_PREF = "extensions.pioneer-online-news.preTreatmentDuration";
const TREATMENT_DURATION_PREF = "extensions.pioneer-online-news.treatmentDuration";
const POSTTREATMENT_DURATION_PREF = "extensions.pioneer-online-news.postTreatmentDuration";
const POSTSTUDY_DURATION_PREF = "extensions.pioneer-online-news.postStudyDuration";
const IDLE_DELAY_PREF = "extensions.pioneer-online-news.idleDelaySeconds";
const LOG_UPLOAD_ATTEMPT_PREF = "extensions.pioneer-online-news.logUploadAttemptInterval";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const Config = {
  addonId: "pioneer-study-online-news@mozilla.org",
  studyName: "online-news",
  branches: [
    { name: "control", weight: 1 },
    { name: "treatment", weight: 1, showDoorhanger: true },
  ],
  telemetryEnv: Services.prefs.getCharPref(TELEMETRY_ENV_PREF, "prod"),

  updateTimerInterval: Services.prefs.getIntPref(UPDATE_TIMER_PREF, 1 * DAY),
  showDoorhangerInterval: Services.prefs.getIntPref(DOORHANGER_INTERVAL_PREF, 1 * DAY),
  logSubmissionInterval: Services.prefs.getIntPref(LOG_INTERVAL_PREF, 1 * DAY),
  logUploadAttemptInterval: Services.prefs.getIntPref(LOG_UPLOAD_ATTEMPT_PREF, 3 * HOUR),

  // Note: This is set in seconds not milliseconds
  idleDelaySeconds: Services.prefs.getIntPref(IDLE_DELAY_PREF, 5),

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
   * @property {boolean?} treatment
   *    Optional. If the treatment should be shown during this phase.
   */

  firstPhase: "preTreatment",

  phases: {
    preTreatment: {
      duration: Services.prefs.getIntPref(PRETREATMENT_DURATION_PREF, 3 * WEEK),
      next: "treatment",
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-1",
    },

    treatment: {
      duration: Services.prefs.getIntPref(TREATMENT_DURATION_PREF, 3 * WEEK),
      next: "postTreatment",
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-2",
      treatment: true,
    },

    postTreatment: {
      duration: Services.prefs.getIntPref(POSTTREATMENT_DURATION_PREF, 3 * WEEK),
      next: "postStudy",
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-3",
    },

    postStudy: {
      duration: Services.prefs.getIntPref(POSTSTUDY_DURATION_PREF, 1 * WEEK),
      surveyOnly: true,
      next: "studyEnd",
      surveyURL: "https://qsurvey.mozilla.com/s3/Pioneer-Online-News-Wave-4",
    },

    studyEnd: {
      lastPhase: true,
    }
  }
};
