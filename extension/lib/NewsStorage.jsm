/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { interfaces: Ci, utils: Cu } = Components;

const UPLOAD_DATE_PREF = "pioneer.study.online.news.upload.date";

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this,
  "config",
  "resource://pioneer-study-online-news/lib/Config.jsm");

XPCOMUtils.defineLazyModuleGetter(this,
  "IndexedDB",
  "resource://gre/modules/IndexedDB.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PioneerUtils",
  "resource://pioneer-study-online-news/PioneerUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "ShieldLogger",
  "resource://pioneer-study-online-news/lib/ShieldLogger.jsm");

this.EXPORTED_SYMBOLS = ["NewsStorage"];

const DB_NAME = "online-news-study";
const DB_OPTIONS = {
  version: 1,
  storage: "persistent",
};


/**
 * Cache the database connection so that it is shared among multiple
 * operations.
 */

let databasePromise;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = IndexedDB.open(DB_NAME, DB_OPTIONS, (db) => {
      db.createObjectStore(DB_NAME, {
        keyPath: "timestamp",
        autoIncrement: false,
      });
    });
  }
  return databasePromise;
}


/**
 * Get a transaction for interacting with the study store
 *
 * NOTE: Methods on the store returned by this function MUST be called
 * synchronously, otherwise the transaction with the store will expire.
 * This is why the helper takes a database as an argument; if we fetched the
 * database in the helper directly, the helper would be async and the
 * transaction would expire before methods on the store were called.
 */

function getStore(db) {
  return db.objectStore(DB_NAME, "readwrite");
}

function isonow() {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }
  let d = new Date();
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
};

this.NewsStorage = {

  async clear() {
    const db = await getDatabase();
    await getStore(db).clear();
  },

  async close() {
    if (databasePromise) {
      const promise = databasePromise;
      databasePromise = null;
      const db = await promise;
      await db.close();
    }
  },

  async getAllPings() {
    const db = await getDatabase();
    const allDBPings = await getStore(db).getAll();
    return allDBPings;
  },

  async uploadPings() {
    // upload ping dataset at the most once a day
    ShieldLogger.log("uploadPings called");
    let pioneerUtils = new PioneerUtils(config.pioneer);
    this.getAllPings().then(payload => {
      ShieldLogger.log("pings fetched");
      let lastUploadDate = Services.prefs.getCharPref(UPLOAD_DATE_PREF, "");
      ShieldLogger.log(`Last upload date: ${lastUploadDate}`);
      if (lastUploadDate !== isonow()) {
        pioneerUtils.submitEncryptedPing(payload).then(() => {
          ShieldLogger.log(`pings uploaded`);
          ShieldLogger.log(`pings uploaded ${JSON.stringify(payload)}`);
          this.clear().then(() => {
            Services.prefs.setCharPref(UPLOAD_DATE_PREF, isonow());
            ShieldLogger.log(`UPLOAD_DATE_PREF was set to now`);
          });
        }, reason => {
          ShieldLogger.log("pings failed to upload");
        });
      } else {
          ShieldLogger.log("Data was already uploaded today");
      }
    });

  },

  async put(pingData) {
    const ping = pingData;
    const db = await getDatabase();
    // This is ugly, but invoking 
    // `getStore(db).put` doesn't seem to match up to
    // https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
    // Invoking a put() always errors out and doesn't call the failure
    // branch of the promise.  The error in the debugger is:
    // "DataError: Data provided to an operation does not meet
    // requirements."
    // Pings are strictly timestamp ordered.
    getStore(db).delete(ping.timestamp).then(() => {
      getStore(db).add(ping).then(() => {
        ShieldLogger.log(`success! stored the ping`);
      }, reason => {
        ShieldLogger.log(`error out add with: ${reason}`);
      });
    }, reason => {
      ShieldLogger.log(`error out delete with: ${reason}`);
    });
  },
};
