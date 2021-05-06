/*
* This plugin adds the widget title to any CCPIB SharePoint widget click events.
*
* Parameter:
*   WT.z_widget_title = <widget title>
*
* Plugin Options:
*   widgetSelectors - An array of strings representing the widget elements. (required)
*   sectionSelectors - An array of strings representing the sections of the page containing the widgets to be tracked. (required)
*
* Example of plugin options:
*   async: false,
*   waitForCallback: true,
*   timeout: 7500,
*   widgetSelectors: ["div.ak-widget"],
*   sectionSelectors: [".ak-widget-row"]
*
* Nick M. 05/6/2021
* Version: 2.0
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

                    // IE is not supported
                    if (wt.widgetTitles.isIE()) {
                        wt.widgetTitles.registerPlugin();
                        return;
                    }

                    wt.widgetTitles.readOptions(options);
                    wt.widgetTitles.trackTitle(dcs, options);
                }
            }, 100);
        },

        // Checks if the brower is IE
        isIE: function () {
            const agent = window.navigator.userAgent;
            if (agent.indexOf("MSIE") >= 0 || agent.indexOf("Trident") >= 0) {
                return true;
            }
            return false;
        },

        // Reads plugin options
        readOptions: function (options) {
            wt.widgetTitles.widgetSelectors = options.widgetSelectors || [];
            wt.widgetTitles.sectionSelectors = options.sectionSelectors || [];
        },

        // Let the WT tag know we're done
        registerPlugin: function () {
            window.wt_sp_globals.pluginObj.tagObj.registerPluginCallback("widgetTitles");
            window.wt_sp_globals.SPAllowRegister = false;
        },

        // Check if the click was on a widget that should be tracked
        isWidget: function (el) {
            for (const selector of wt.widgetTitles.widgetSelectors) {
                if (el.closest(selector)) {
                    for (const section of wt.widgetTitles.sectionSelectors) {
                        if (el.closest(section)) return true;
                    }
                }
            }
            return false;
        },

        // Clean up or replace titles in special cases where the value returned from getAllClickTitle() is not correct.
        cleanTitle: function (title, el) {
            let newTitle = null;
            // Some widgets have two titles: one for the desktop view and one for mobile.
            // In those cases we need to be specific about what text to capture.
            if (el.querySelector(".show-in-desktop") && el.querySelector(".show-in-mobile") && el.querySelector(".two-line-summary")) {
                newTitle =  el.querySelector(".two-line-summary").textContent.trim().replace(/\s+/g, " ");
            }
            return newTitle || title;
        },

        // Adds widget title to the click event
        trackTitle: function (dcs, options) {
            dcs.addTransform(function (dcs, multiTrack) {
                let widgetTitle = "";
                if (wt.widgetTitles.isWidget(multiTrack.element)) {
                    const plugin = window.wt_sp_globals.pluginObj;
                    widgetTitle = plugin.getAllClickTitle(multiTrack.element, multiTrack.event);
                    widgetTitle = wt.widgetTitles.cleanTitle(widgetTitle, multiTrack.element);
                }

                multiTrack.argsa.push(
                    "WT.z_widget_title", widgetTitle
                );

            }, "multitrack");
            wt.widgetTitles.registerPlugin();
        }
    }
})(window.document);

Webtrends.registerPlugin("widgetTitles", window.wt_sp_globals.widgetTitles.init);