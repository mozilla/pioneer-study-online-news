const { utils: Cu } = Components;
Cu.importGlobalProperties(["fetch"]);

this.EXPORTED_SYMBOLS = ["Hosts"];

const Hosts = {
  async startup() {
    const domainResponse = await fetch("resource://pioneer-study-online-news/domains.json");
    const domains = await domainResponse.json();

    this.trackedHosts = {};
    domains.forEach(d => {
      this.trackedHosts[d.domain] = d.avgAlign;
    });
  },

  getHostnameFromURI(uri) {
    return uri ? uri.host : null;
  },

  isTrackedURI(uri) {
    const hostname = this.getHostnameFromURI(uri);
    return Object.keys(this.trackedHosts).includes(hostname);
  },

  getRatingForURI(uri) {
    const hostname = this.getHostnameFromURI(uri);
    return this.trackedHosts[hostname];
  }
};
