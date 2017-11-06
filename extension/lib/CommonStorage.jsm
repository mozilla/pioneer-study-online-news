 /* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "NewsIndexedDB", "resource://pioneer-study-online-news/lib/NewsIndexedDB.jsm"
);

this.EXPORTED_SYMBOLS = ["CommonStorage"];


this.CommonStorage = {
  getStore() {
    return NewsIndexedDB.getStore("common");
  },

  async clear() {
    await this.getStore().clear();
  },

  async getAll() {
    return await this.getStore().getAll();
  },

  async get(key) {
    return await this.getStore().get(key);
  },

  async add(value, key) {
    return await this.getStore().add(value, key);
  },

  async delete(key) {
    return await this.getStore().delete(key);
  },

  async put(value, key) {
    return await this.getStore().put(value, key);
  },
};
