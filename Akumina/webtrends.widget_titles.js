/*
* This plugin adds the widget title to any CCPIB SharePoint widget click events.
*
* Parameter:
*   WT.z_widget_title = <widget title>
*
* Plugin Options:
*   widgetSelectors - An array of strings representing the widget elements. (required)
*   titleSelectors - An array of strings representing the title elements within the widget element. (required)
*
* Example of plugin options:
*   async: false,
*   waitForCallback: true,
*   timeout: 7500,
*   widgetSelectors: ["div.ak-widget"],
*   titleSelectors: [
*       "div.ia-header .ia-header--title",      // Active Equities
*       "div.slick-active a",                   // Intranet Homepage
*       ".cppib-single-news .meta-tag",         // Intranet Homepage
*       ".title",                               // Intranet Homepage CTA
*       "div.search-widget-heading span",       // NeuralNet
*   ]
*
* Nick M. 03/22/2021
* Version: 1.0
*
* Note: This plugin is not compatible with IE browsers.
*/

(function (document, undefined) {
    let wt;

    window.wt_sp_globals.widgetTitles = {
        init: function (dcs, options) {
            const waitForSpPlugin = setInterval(function () {
                if (window.wt_sp_globals) {
                    clearInterval(waitForSpPlugin);
                    wt = window.wt_sp_globals;
                    wt.widgetTitles.readOptions(options);
                    wt.widgetTitles.trackTitle(dcs, options);
                }
            }, 100);
        },

        // Reads plugin options
        readOptions: function (options) {
            wt.widgetTitles.widgetSelectors = options.widgetSelectors || [];
            wt.widgetTitles.titleSelectors = options.titleSelectors || [];
        },

        // Let the WT tag know we're done
        registerPlugin: function () {
            window.wt_sp_globals.pluginObj.tagObj.registerPluginCallback("widgetTitles");
            window.wt_sp_globals.SPAllowRegister = false;
        },

        // Gets correct element from those specified in the plugin options
        getEl: function (el, selectors, type) {
            let elem;
            let i = 0;
            do {
                try {
                    if (type === "widgetEl") {
                        elem = el.closest(selectors[i]);
                    }
                    else if (type === "titleEl") {
                        elem = el.querySelector(selectors[i]);
                    }
                }
                catch(err) {}
                i++;
            }
            while (!elem && i < selectors.length);
            return elem;
        },

        // Adds widget title to the click event
        trackTitle: function (dcs, options) {
            const widgetSelectors = wt.widgetTitles.widgetSelectors;
            const titleSelectors = wt.widgetTitles.titleSelectors;
            dcs.addTransform(function (dcs, multiTrack) {
                const el = multiTrack.element || {};
                const widgetEl = wt.widgetTitles.getEl(el, widgetSelectors, "widgetEl");
                if (widgetEl) {
                    const titleEl = wt.widgetTitles.getEl(widgetEl, titleSelectors, "titleEl");
                    let widgetTitle = (titleEl.textContent || titleEl.innerText).trim() || "";

                    // Strip colon off end of title
                    if (widgetTitle.endsWith(":")) {
                        widgetTitle = widgetTitle.slice(0, -1).trim();
                    }

                    multiTrack.argsa.push(
                        "WT.z_widget_title", widgetTitle || ""
                    )
                }
            }, "multitrack");
            wt.widgetTitles.registerPlugin();
        }
    }
})(window.document);

Webtrends.registerPlugin("widgetTitles", window.wt_sp_globals.widgetTitles.init);