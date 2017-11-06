/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "IndexedDB", "resource://gre/modules/IndexedDB.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Pioneer", "resource://pioneer-study-online-news/lib/Pioneer.jsm"
);

this.EXPORTED_SYMBOLS = ["NewsIndexedDB"];

const DB_NAME = "online-news-study";
const DB_OPTIONS = {
  version: 1,
  storage: "persistent",
};


const NewsIndexedDB = {
  async startup() {
    this.db = await IndexedDB.open(DB_NAME, DB_OPTIONS, iDB => {
      iDB.createObjectStore("log", {
        keyPath: "timestamp",
        autoIncrement: false,
      });

      iDB.createObjectStore("doorhanger", {
        autoIncrement: false,
      });
    });
  },

  shutdown() {
    this.db.close();
  },

  getStore(name) {
    return this.db.objectStore(name, "readwrite");
  },
};
