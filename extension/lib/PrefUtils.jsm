const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");


const PrefUtils = {
  setInt64Pref(name, value) {
    return Services.prefs.setCharPref(name, `${value}`);
  },

  getInt64Pref(name, defaultValue) {
    return parseInt(Services.prefs.getCharPref(name, `${defaultValue}`), 10);
  }
};

this.EXPORTED_SYMBOLS = ["PrefUtils"];
