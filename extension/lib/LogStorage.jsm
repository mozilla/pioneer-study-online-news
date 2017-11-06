/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "NewsIndexedDB", "resource://pioneer-study-online-news/lib/NewsIndexedDB.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Pioneer", "resource://pioneer-study-online-news/lib/Pioneer.jsm"
);

this.EXPORTED_SYMBOLS = ["LogStorage"];

const UPLOAD_DATE_PREF = "pioneer.study.online.news.upload.date";


function isonow() {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }
  let d = new Date();
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
}

this.LogStorage = {
  getStore() {
    return NewsIndexedDB.getStore("log");
  },

  clear() {
    return this.getStore().clear();
  },

  getAll() {
    return this.getStore().getAll();
  },

  async uploadPings() {
    // upload ping dataset at the most once a day
    this.getAll().then(payload => {
      let lastUploadDate = Services.prefs.getCharPref(UPLOAD_DATE_PREF, "");
      if (lastUploadDate !== isonow()) {
        Pioneer.utils.submitEncryptedPing("online-news-log", 1, {entries: payload}).then(() => {
          this.clear().then(() => {
            Services.prefs.setCharPref(UPLOAD_DATE_PREF, isonow());
          });
        }, reason => {
          // you probably want to add debug logging here if things
          // stop working.
        });
      }
    });
  },

  async put(ping) {
    return this.getStore().put(ping);
  },
};
