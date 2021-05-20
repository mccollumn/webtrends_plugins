/*
* This plugin adds the widget title to any CCPIB SharePoint widget click events.
*
* Parameter:
*   WT.z_widget_title = <widget title>
*
* Plugin Options:
*   widgetSelectors - An array of strings representing the widget elements. (required)
*   sectionSelectors - An array of strings representing the sections of the page containing the widgets to be tracked. (required)
*   excludedSelectors - An array of strings representing sections of the page in which widget titles should NOT be tracked.
*
* Example of plugin options:
*   async: false,
*   waitForCallback: true,
*   timeout: 7500,
*   widgetSelectors: ["div.ak-widget"],
*   sectionSelectors: [".ak-widget-row"],
*   excludedSelectors: [".ia-people-directory"]
*
* Nick M. 05/20/2021
* Version: 2.5
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
                    wt.widgetTitles.registerPlugin();
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
            wt.widgetTitles.excludedSelectors = options.excludedSelectors || [];
        },

        // Let the WT tag know we're done
        registerPlugin: function () {
            window.wt_sp_globals.pluginObj.tagObj.registerPluginCallback("widgetTitles");
            window.wt_sp_globals.SPAllowRegister = false;
        },

        // Check if DOM element (el) is contained within any of the elements (selectorArray)
        inElement: function (el, selectorArray) {
            for (const selector of selectorArray) {
                if (el.closest(selector)) return true;
            }
            return false;
        },

        // Check if the click was on a widget that should be tracked
        isWidget: function (el) {
            if (!el) return false;

            const wTtl = wt.widgetTitles;
            if (wTtl.inElement(el, wTtl.widgetSelectors) && wTtl.inElement(el, wTtl.sectionSelectors)) {
                if (!wTtl.inElement(el, wTtl.excludedSelectors)) {
                    return true;
                }
            }
            return false;
        },

        // Replaces titles in special cases where the value returned from getAllClickTitle() is not correct.
        updateTitle: function (title, el) {
            let newTitle = null;
            // Some widgets have two titles: one for the desktop view and one for mobile.
            // In those cases we need to be specific about what text to capture.
            if (el.querySelector(".show-in-desktop") && el.querySelector(".show-in-mobile") && el.querySelector(".news-announcement")) {
                newTitle =  el.querySelector(".news-announcement").textContent.trim().replace(/\s+/g, " ");
            }
            // Some widgets include a headline and summary text.
            // All we want is the headline.
            else if (el.querySelector(".headline")) {
                newTitle = el.querySelector(".headline").textContent.trim().replace(/\s+/g, " ");
            }
            return newTitle || title;
        },

        // Gets the widget title
        getTitle: function (multiTrack) {
            let widgetTitle = "";
            if (wt.widgetTitles.isWidget(multiTrack.element)) {
                const plugin = window.wt_sp_globals.pluginObj;
                widgetTitle = plugin.getAllClickTitle(multiTrack.element, multiTrack.event);
                widgetTitle = wt.widgetTitles.updateTitle(widgetTitle, multiTrack.element);
            }
            return widgetTitle;
        },

        // Adds widget title to the click event
        trackTitle: function (dcs, options) {
            dcs.addTransform(function (dcs, multiTrack) {
                multiTrack.argsa.push(
                    "WT.z_widget_title", wt.widgetTitles.getTitle(multiTrack)
                );
            }, "multitrack");
        }
    }
})(window.document);

Webtrends.registerPlugin("widgetTitles", window.wt_sp_globals.widgetTitles.init);