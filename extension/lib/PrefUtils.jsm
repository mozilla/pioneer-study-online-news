const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");


const PrefUtils = {
  setLongPref(name, value) {
    return Services.prefs.setCharPref(name, `${value}`);
  },

  getLongPref(name, defaultValue) {
    return parseInt(Services.prefs.getCharPref(name, `${defaultValue}`), 10);
  }
};

this.EXPORTED_SYMBOLS = ["PrefUtils"];
