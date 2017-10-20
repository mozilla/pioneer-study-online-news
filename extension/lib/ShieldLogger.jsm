/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/osfile.jsm");

this.EXPORTED_SYMBOLS = ["ShieldLogger"];

this.ShieldLogger = {
  async log(msg) {
    OS.File.open("/tmp/shield_debug.log", 
      {write: true, append: true}).then(
        (valOpen) => {
          let n = new Date();
          let encoded = new TextEncoder().encode(`${n}: ${msg}\n`);
          valOpen.write(encoded).then((valWrite) => {
            valOpen.close();
          });
        });
  }
};
