/**
 * This plugin is used for cross-origin tracking between a page and a popup or a page and an iframe.
 * It listens for postMessage() events and, if the appropriate message src was provided,
 * generates a Webtrends event that includes the message data.
 * 
 * Plugin Options:
 * 	messageSrc	 	The message data "src" property value used to indicate the information should be sent to Webtrends.
 * 					Default is "WT" if not specified.
 * 	defaults		An object containing parameter - value pairs that will be included in all Webtrends events.
 * 					See below for more information.
 * 	debug			Set to true to log debug information to the console. Default is false.
 * 
 * Data Object:
 * 	The data sent via postMessage() and the data for the default plugin option must follow this structure.
 * 	Any other object format may cause unexpected behavior.  "src" is the only required property.
 * 	
 *	{
 *		src: "WT",
 *		WT: {
 *			param: "value"
 *		},
 *		DCS: {
 *			param: "value"
 *		},
 *		DCSext: {
 *			param: "value"
 *		}
 *	}
 *
 * Example of including the plugin:
 * 	pml: {src: "webtrends.pml.js", messageSrc: "WT", debug: false, defaults: {WT: {myparam: "myvalue"}, DCS: {dcsuri: "/mypage"}}}
 * 
 * @author      Nick M.
 * @version		1.0
 */

(function () {
	window.wt_sp_globals.postMessageListener = {
		messageSrc: "WT",
		defaults: {},
		debug: false,
		args: [],
		wtNamespaces:  ["WT", "DCS", "DCSext"],
		// Check if the message received is from the source we are looking for
		isWTMessage: function(data) {
			return (data && data.src === pml.messageSrc);
		},
		// Output debug information to the console
		debugOutput: function(data) {
			if (pml.debug) {
				if (pml.isWTMessage(data)) {
					console.log("Webtrends Post Message Data:");
					for (var x = 0; x < pml.args.length; x += 2) {
						console.log(pml.args[x] + " = " + pml.args[x + 1]);
					}
				}
				else {
					console.log("Webtrends Post Message Received but Ignored");
				}
			}
		},
		// Polyfill for Object.assign
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
		assignPolyfill: function () {
			if (typeof Object.assign !== 'function') {
				// Must be writable: true, enumerable: false, configurable: true
				Object.defineProperty(Object, "assign", {
					value: function assign(target, varArgs) { // .length of function is 2
						'use strict';
						if (target === null || target === undefined) {
							throw new TypeError('Cannot convert undefined or null to object');
						}

						var to = Object(target);

						for (var index = 1; index < arguments.length; index++) {
							var nextSource = arguments[index];

							if (nextSource !== null && nextSource !== undefined) {
								for (var nextKey in nextSource) {
									// Avoid bugs when hasOwnProperty is shadowed
									if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
										to[nextKey] = nextSource[nextKey];
									}
								}
							}
						}
						return to;
					},
					writable: true,
					configurable: true
				});
			}
		},
		// Read the plugin options
		readOptions: function(options) {
			if (typeof(options.messageSrc) != "undefined") {
				pml.messageSrc = options.messageSrc;
			}
			if (typeof(options.defaults) != "undefined") {
				pml.defaults = options.defaults;
			}
			if (typeof(options.debug) != "undefined") {
				pml.debug = options.debug;
			}
		},
		// Merge any default data with the data received
		buildDataObj: function(data) {
			var wtData = {};
			wtData.src = data.src || "";
			pml.assignPolyfill();
			pml.wtNamespaces.forEach(function(element) {
				wtData[element] = {};
				if (typeof(pml.defaults[element]) != "undefined") {
					wtData[element] = JSON.parse(JSON.stringify(pml.defaults[element]));
				}
				if (typeof(data[element]) != "undefined") {
					wtData[element] = Object.assign(wtData[element], data[element]);
				}
			});
			return wtData;
		},
		// Push the data object properties/values into an array
		addArgs: function(data) {
			pml.wtNamespaces.forEach(function(element) {
				for (var param in data[element]) {
					pml.args.push(element + "." + param);
					pml.args.push(data[element][param]);
				}
			});
		},
		// Listen for message event and fire Webtrends image request
		addListener: function () {
			window.addEventListener("message", function (message) {
				pml.debugOutput(message.data);
				if (pml.isWTMessage(message.data)) {
					var data = pml.buildDataObj(message.data);
					pml.addArgs(data);
					pml.debugOutput(data);

					try {
						Webtrends.multiTrack({
							argsa: pml.args
						});
					}
					catch(e) {
						console.error("Webtrends: " + e.message);
					}
					
					pml.args = [];
					data = {};
				}
			});
		},
		// Initialize plugin options and add postMessage() listener
		init: function(dcs, options) {
			var waitForSpPlugin = setInterval(function () {
				if (window.wt_sp_globals && window.wt_sp_globals.pluginObj) {
					clearInterval(waitForSpPlugin);
					pml = window.wt_sp_globals.postMessageListener;
					pml.readOptions(options);
					pml.addListener();            
				}
			}, 100);
		}
	}
	
    Webtrends.registerPlugin("pml", window.wt_sp_globals.postMessageListener.init);
})();