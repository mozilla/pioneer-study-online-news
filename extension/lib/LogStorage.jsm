/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-online-news/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "NewsIndexedDB", "resource://pioneer-study-online-news/lib/NewsIndexedDB.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Pioneer", "resource://pioneer-study-online-news/lib/Pioneer.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "PrefUtils", "resource://pioneer-study-online-news/lib/PrefUtils.jsm"
);

this.EXPORTED_SYMBOLS = ["LogStorage"];

const UPLOAD_DATE_PREF = "extensions.pioneer-online-news.lastLogUploadDate";


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
    const payload = await this.getAll();
    const lastUploadDate = PrefUtils.getLongPref(UPLOAD_DATE_PREF, 0);
    const timesinceLastUpload = Date.now() - lastUploadDate;

    if (timesinceLastUpload > Config.logSubmissionInterval) {
      await Pioneer.utils.submitEncryptedPing("online-news-log", 1, { entries: payload });
      await this.clear();
      PrefUtils.setLongPref(UPLOAD_DATE_PREF, Date.now());
    }
  },

  async put(ping) {
    return this.getStore().put(ping);
  },
};
