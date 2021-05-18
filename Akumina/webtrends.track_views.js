/**
 * This plugin triggers a page view event on Akumina sites when the hash changes.
 * Also adds the hash to regular view events.
 * 
 * Plugin Options:
 *  waitTime - Time (in milliseconds) to wait for Akumina content after hash change. (Default 2000)
 * 
 * Example of plugin options:
 *  async: false,
 *  waitForCallback: true,
 *  timeout: 7500,
 *  waitTime: 2000
 * 
 * @author      Nick M.
 * @version     1.0
 */

(function () {
    let trackViews;
    window.wt_sp_globals.trackViews = {
        init: function (dcs, options) {
            trackViews = window.wt_sp_globals.trackViews;
            trackViews.readOptions(options);
            trackViews.transform();
            // Listen for hash change
            window.addEventListener("hashchange", function (event) {
                trackViews.trackPV(event);
            });
        },

        readOptions: function (options) {
            trackViews.waitTime = options.waitTime || 2000;
        },

        // Let the WT tag know we're done
        registerPlugin: function () {
            window.wt_sp_globals.pluginObj.tagObj.registerPluginCallback("trackViews");
            window.wt_sp_globals.SPAllowRegister = false;
        },

        // On page load, adds the hash to dcsuri and sets dcsqry if needed.
        transform: function () {
            // Wait for Akumina to change the page title
            setTimeout(function () {
                Webtrends.addTransform(function (dcsObj, multiTrack) {
                    try {
                        const plugin = wt_sp_globals.pluginObj;
                        const res = plugin.getURIArrFromHREF(window.location.href);
                        const query = dcsObj.DCS.dcsqry ? dcsObj.DCS.dcsqry : res.dcsqry;
                        multiTrack.argsa.push(
                            "DCS.dcsuri", dcsObj.DCS.dcsuri + res.dcshash,
                            "DCS.dcsqry", query
                        );
                    }
                    catch (e) { }
                }, "collect");
                trackViews.registerPlugin();
            }, trackViews.waitTime);
        },

        // Sends a virtual page view event
        trackPV: function (event) {
            const ref = event.oldURL;
            // Wait for Akumina content
            setTimeout(function () {
                try {
                    const plugin = wt_sp_globals.pluginObj;
                    const res = plugin.getURIArrFromHREF(window.location.href);
                    const ti = document.title;
                    const argsa = [
                        "DCS.dcssip", res.dcssip,
                        "DCS.dcsuri", res.dcsuri + res.dcshash,
                        "DCS.dcsqry", res.dcsqry,
                        "DCS.dcsref", ref,
                        "WT.ti", ti,
                        "WT.shp_page_ti", ti,
                        "WT.cg_s", ti,
                        "WT.dl", "0",
                        "WT.es", window.location.hostname + window.location.pathname + window.location.hash,
                    ];

                    Webtrends.multiTrack({
                        argsa: argsa
                    });
                }
                catch (e) { }
            }, trackViews.waitTime);
        }
    }
})();

Webtrends.registerPlugin("trackViews", window.wt_sp_globals.trackViews.init);