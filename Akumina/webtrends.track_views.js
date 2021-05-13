(function () {
    window.wt_sp_globals.trackViews = {
        init: function () {
            window.addEventListener("hashchange", window.wt_sp_globals.trackViews.trackPV);
        },

        trackPV: function () {
            const ref = window.location.href;
            setTimeout(function () {
                try {
                    const plugin = wt_sp_globals.pluginObj;

                    // Set page variables
                    const res = plugin.getURIArrFromHREF(window.location.href);
                    const ti = document.title;
                    const argsa = [
                        "DCS.dcssip", res.dcssip,
                        "DCS.dcsuri", res.dcsuri + res.dcshash,
                        "DCS.dcsqry", res.dcsqry,
                        "DCS.dcsref", ref,
                        "WT.ti", ti,
                        "WT.dl", "0",
                        "WT.es", window.location.hostname + window.location.pathname + window.location.hash,
                    ];

                    // Fire page view event
                    Webtrends.multiTrack({
                        argsa: argsa
                    });
                }
                catch (e) { }
            }, 1500);
        }
    }
})();

Webtrends.registerPlugin("trackViews", window.wt_sp_globals.trackViews.init);