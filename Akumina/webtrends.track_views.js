/**
 * This plugin triggers a page view event on Akumina sites when /page/render/ fires.
 * Also adds the hash to regular view events.
 *
 * Plugin Options:
 *  waitTime - Time (in milliseconds) to wait for Akumina content after page render. (Default 5000)
 *
 * Example of plugin options:
 *  async: false,
 *  waitForCallback: true,
 *  timeout: 7500,
 *  waitTime: 2000,
 *  titleCallback: function() {...}
 *
 * @author      Nick M.
 * @version     1.9
 *
 * Change History:
 *  2021/09/14 - Now uses /page/render/ event to trigger a page view.
 *  2021/10/06 - Added isNewView flag to work around multiple /page/render/ events.
 *               Updated transform function.
 *  2021/10/07 - Added error logging.
 *  2021/11/05 - Added ability to pass in a titleCallback function.
 *               Poll for title as not to hold up the tag unnecessarily.
 *               Customized title handling for CPPIB.
 */

(function () {
  let trackViews;
  window.wt_sp_globals.trackViews = {
    init: function (dcs, options) {
      trackViews = window.wt_sp_globals.trackViews;
      trackViews.readOptions(options);
      // Listen for hash change and capture referring URL
      window.addEventListener("hashchange", function (event) {
        trackViews.ref = event.oldURL || "";
        trackViews.isNewView = true;
      });
      // Listen for /page/render/ event, indicating new content has loaded
      let count = 0;
      const waitForAkumina = setInterval(function () {
        if (typeof Akumina !== "undefined") {
          clearInterval(waitForAkumina);
          Akumina.Digispace.AppPart.Eventing.Subscribe("/page/render/", function () {
            if (trackViews.isNewView) trackViews.track("multiTrack");
            trackViews.isNewView = false;
          });
        }
        if (++count > 50) {
          clearInterval(waitForAkumina);
        }
      }, 100);
      // Wait for the Webtrends SharePoint plugin
      const waitForSpPlugin = setInterval(function () {
        if (window.wt_sp_globals && window.wt_sp_globals.pluginObj) {
          clearInterval(waitForSpPlugin);
          trackViews.track("transform");
        }
      }, 100);
    },

    readOptions: function (options) {
      trackViews.interval = 250; // Poll interval for page title
      trackViews.waitTime = options.waitTime || 5000;
      trackViews.titleCallback = options.titleCallback;
      trackViews.debug = options.debug || false;
    },

    // Let the WT tag know we're done
    registerPlugin: function () {
      window.wt_sp_globals.pluginObj.tagObj.registerPluginCallback("trackViews");
    },

    // Get the title from the titleCallback function if one has been provided
    getCustomTitle: function () {
      try {
        if (typeof trackViews.titleCallback === "function") {
          return trackViews.titleCallback();
        }
      } catch (e) {
        console.error("WT Error - Track Views Plugin - titleCallback:", e);
      }
      return null;
    },

    // Add hash and title to page view event
    transform: function (ti, time) {
      Webtrends.addTransform(function (dcsObj, multiTrack) {
        const plugin = wt_sp_globals.pluginObj;
        const res = plugin.getURIArrFromHREF(window.location.href);
        const query = dcsObj.DCS.dcsqry ? dcsObj.DCS.dcsqry : res.dcsqry;
        multiTrack.argsa.push(
          "DCS.dcsuri", dcsObj.DCS.dcsuri + res.dcshash,
          "DCS.dcsqry", query,
          "WT.ti", ti,
          "WT.shp_page_ti", ti,
          "WT.cg_s",  ti,
          "WT.es", window.location.hostname + window.location.pathname + window.location.hash,
          "WT.waited_for_title", Math.round(time).toString()
        );
      }, "collect");
      trackViews.registerPlugin();
    },

    // Generate virtual page view event
    multiTrack: function (ti, time) {
      const plugin = wt_sp_globals.pluginObj;
      const res = plugin.getURIArrFromHREF(window.location.href);
      const argsa = [
        "DCS.dcssip", res.dcssip,
        "DCS.dcsuri", res.dcsuri + res.dcshash,
        "DCS.dcsqry", res.dcsqry,
        "DCS.dcsref", trackViews.ref,
        "WT.ti", ti,
        "WT.shp_page_ti", ti,
        "WT.cg_s", ti,
        "WT.dl", "0",
        "WT.es", window.location.hostname + window.location.pathname + window.location.hash,
        "WT.waited_for_title", Math.round(time).toString()
      ];

      Webtrends.multiTrack({
        argsa: argsa
      });
    },

    // Wait for the page title, then send a view event
    track: function (type) {
      try {
        let startTime = 0;
        let endTime = 0;
        let count = 0;
        let ti = trackViews.getCustomTitle() || document.title;

        // Wait for Akumina to change the page title
        startTime = performance.now();
        const waitForTitle = setInterval(function () {
          if (ti !== "akumina" || ti === "") {
            clearInterval(waitForTitle);
            endTime = performance.now();
            if (trackViews.debug) {
              console.log(
                "WT - Track Views Plugin: Waited " + Math.round(endTime - startTime).toString() + "ms for page title"
              );
            }
            trackViews[type](ti, endTime - startTime);
          } else if (++count > trackViews.waitTime / trackViews.interval) {
            clearInterval(waitForTitle);
            console.warn(
              "WT - Track Views Plugin: Stopped waiting for page title after " + trackViews.waitTime.toString() + "ms"
            );
            trackViews[type](ti, trackViews.waitTime);
          }
          ti = document.title;
        }, trackViews.interval);
      } catch (e) {
        console.error("WT Error - Track Views Plugin:", e);
      }
    }
  };
})();

Webtrends.registerPlugin("trackViews", window.wt_sp_globals.trackViews.init);
