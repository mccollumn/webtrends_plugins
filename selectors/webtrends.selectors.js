/**
 * This plugin allows additional click tracking to be attached to DOM elements,
 * by utilizing the addSelector() function of the base Webtrends tracking code.
 * 
 * @see <a href="https://analytics.webtrends.help/docs/automatic-tracking#selectors">Selectors</a>
 * 
 * Plugin Options:
 * 	selectors       An array of one or more objects that define the elements to which click tracking should be bound,
 *                  and the code to run when one of those elements is clicked.
 * 
 * Selector Object:
 * 	The selector objects must follow this structure.
 * 	Any other object format may cause unexpected behavior.
 *  "selector" and "function" are required properties.
 *  "name" is optional, but recommended. as it provides a way to identify each selector.
 * 	
 *	{
 *		name: "Selector Name",
 *      selector: "CSS Selector",
 *      function: {
 *          actionElems: {"Additional element types"},
 *          filter: {function that returns true if the click should not be tracked, false if it should},
 *          transform: {function that modifies the multiTrack object before data is sent},
 *          finish: {function called after the request has been sent}
 *      }
 *	}
 *
 * Example of including the plugin:
 * 	selectors: {src: "webtrends.selectors.js", selectors: {name: "My Selector", selector: "a", function: {transform: function (dcsObject, multiTrackObject) {...}}}
 * 
 * @author      Nick M.
 * @version		1.0
 */

(function () {
    window.wt_sp_globals.selectors_plugin = {
        readSelectors: function (options) {
            if (options.selectors) {
                for (var i = 0; i < options.selectors.length; i++) {
                    var selector = options.selectors[i];
                    if (selector.hasOwnProperty("selector") && selector.hasOwnProperty("function")) {
                        wtSelectors.createSelector(selector);
                    }
                    else {
                        var name = selector.name ? "'" + selector.name + "' " : "";
                        console.error("Webtrends - Custom Selector Plugin: Selector " + name + "is not configured correctly.");
                    }
                }
            }
        },

        createSelector: function (selector) {
            try {
                wtSelectors.plugin.tagObj.addSelector(selector.selector, selector.function);
            }
            catch (error) {
                console.error("Webtrends - Custom Selector Plugin: " + error);
            }
        },

        init: function (dcsObject, options) {
            var waitForSpPlugin = setInterval(function () {
                if (window.wt_sp_globals && window.wt_sp_globals.pluginObj) {
                    clearInterval(waitForSpPlugin);
                    wtSelectors = window.wt_sp_globals.selectors_plugin;
                    wtSelectors.plugin = window.wt_sp_globals.pluginObj;

                    wtSelectors.readSelectors(options);
                }
            }, 100);
        }
    }

    Webtrends.registerPlugin("selectors", window.wt_sp_globals.selectors_plugin.init);
})();