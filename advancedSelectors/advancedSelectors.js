/*
This plugin provides a means to track interactions with DOM elements that may not be present at the time the Webtrends tag runs.

The plugin allows the event handler to be delegated to child elements that may not exist within the bound element at the time the Webtrends tag loads.
The plugin can also be configured to wait until the Webtrends.registerSelectors() method is called before attaching tracking code to the event handlers.
Requires jQuery version 1.7 or higher.

Plugin options:
selectors -> An array of one or more selector objects that define the elements to be tracked and the parameters to include with the data collection event.

Selector properties:
selector -> Required. A string indicating the element to be selected.
params -> Required. An array of parameter name-value pairs to be included with the data collection event.
									If a function is included the return value will be used.
childSelector -> Optional. A string indicating the child elements that the event handler should be attached to.
									These delegated events can be processed for elements that are added to the document after the plugin loads.
defer -> Optional. A value of true indicates that the selector should not be processed when the plugin loads.
									Instead it will wait until external code calls the Webtrends.registerSelectors() method.

Example of including the plugin with your tag:

advancedSelectors:  {src:"advancedSelectors.js", selectors: [
											{selector: "#links", defer: true, childSelector: ".innerlinks", params: ["DCS.dcsuri","/click/"]}
										]}
*/

(function(window, undefined) {
	var AdvSelectors = {

		// Helper function that checks if the required jQuery method is available.
		checkJQuery: function ()	{
			if (typeof(jQuery) !== "undefined") {
				if (typeof(jQuery().on) === "function")	{
					return true;
				}
      }
      else {
      	return false;
      }
		},

		// Helper function that accepts any vv, returns true if vv is an Array object.
    isArray: function (vv) {
      return (typeof(vv) === 'object' && vv.constructor === Array);
    },

    // Helper function that accepts a string and returns a copy of the string with special characters removed and
    // whitespace replaced with a single space.
    cleanString: function (str)	{
    	str = str.replace(/[^\w\s\.\+-:()\|]/gi, '');
			str = str.replace(/\s+/g, ' ');
			str = str.replace(/^\s+|\s+$/gm,'');
			return str;
    },

  	// Helper function that accepts and returns an array. If an array value is a function the function is executed.
  	execParamFunctions: function(params,targetElement)	{
  		var len,i,args;
  		args = [];
  		len = params.length;
  		for (i=0; i < len; i++)	{
  			if (typeof params[i] === "function")	{
					args[i] = params[i].apply(targetElement);
  			}
  			else {
  				args[i] = params[i];
  			}
  			args[i] = AdvSelectors.cleanString(args[i]);
  		}
  		return args;
  	},

    // Attaches event handlers to the appropriate elements
  	bindEvent: function(selector,params,child,data)	{
  		child = child || "";
  		data = data || "";
  		jQuery(selector).on("mousedown", child, function()	{
				var targetElement = this;
				Webtrends.multiTrack({
					argsa: AdvSelectors.execParamFunctions(params,targetElement)
				});
			});
  	},

    // Reads the plugin options
    readSelectors: function(selectors)	{
    	var len, i, selector;
    	AdvSelectors.selectorData = {};
      AdvSelectors.selectorData.deferred = [];
      AdvSelectors.selectorData.immediate = [];
      if (selectors && AdvSelectors.isArray(selectors))	{
      	len = selectors.length;
      	for (i = 0; i < len; i++) {
        	selector = selectors[i];
					if ((typeof(selector.selector) === "string") && (AdvSelectors.isArray(selector.params)))	{
						if (selector.defer === true)	{
							AdvSelectors.selectorData.deferred[AdvSelectors.selectorData.deferred.length] = selector;
						}
						else	{
							AdvSelectors.selectorData.immediate[AdvSelectors.selectorData.immediate.length] = selector;
						}
					}
      	}
      }
    },

  	// Registers selectors
		registerSelectors: function (selType) {
			var len,i,selector,child,data,params,type;
			if (AdvSelectors.selectorData.length === 0)	{
				return false;
			}
			if (AdvSelectors.checkJQuery())	{
				type = selType || "deferred";
				len = AdvSelectors.selectorData[type].length;
				for (i = 0; i < len; i++)	{
					selector = AdvSelectors.selectorData[type][i].selector;
					params = AdvSelectors.selectorData[type][i].params;
					child = typeof(AdvSelectors.selectorData[type][i].childSelector) === "string" ? AdvSelectors.selectorData[type][i].childSelector : "";
					data = AdvSelectors.selectorData[type][i].data || "";
					AdvSelectors.bindEvent(selector,params,child,data);
    		}
				return true;
			}
			else if (AdvSelectors.retryCount < AdvSelectors.retryMax)	{
				AdvSelectors.retryCount++;
				setTimeout(function() {AdvSelectors.registerSelectors(selType);}, 50);
			}
			else	{
				console.log("Webtrends Advanced Selectors plugin: jQuery is missing or too old");
				return false;
			}
    },

    // Main function that reads plugin options and registers selectors
		advancedSelectors: function(dcs, options) {
			AdvSelectors.retryCount = 0;
			AdvSelectors.retryMax = 10;

      // Read selector configs
      AdvSelectors.readSelectors(options.selectors);

      // Register immediate selectors
      AdvSelectors.registerSelectors("immediate");

			// Register deferred selectors
			window.Webtrends.registerSelectors = AdvSelectors.registerSelectors;
  	}
  };

	Webtrends.registerPlugin("advancedSelectors",AdvSelectors.advancedSelectors);
})(window);