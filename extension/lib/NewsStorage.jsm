/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

XPCOMUtils.defineLazyModuleGetter(this,
  "IndexedDB", 
  "resource://gre/modules/IndexedDB.jsm");


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
        keyPath: "focusedURL",
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

  async put(pingData) {
    const ping = Object.assign({ timestamp: new Date() }, pingData);
    const db = await getDatabase();
    let result = getStore(db).add(ping);
    // TODO: stringify the ping to JSON catching any errors along the
    // way and send them to the logger
    let promise = ShieldLogger.log(`stored something`);
    return result;
  },
};
