/*
 * This plugin captures meta tag values from the page.
 * It extends the capabilities of the built in functionality by allowing you to specify the RDFa property attribute in addition to the standard HTML name attribute.
 * 
 * If multiple meta tags with the same name/property exist on the page, all values will be passed as a semicolon delimited list.
 * 
 * Plugin Options:
 * name - Meta tag name.
 * property - Meta tag property.
 * param (optional) - Used to specify a custom parameter name in the form of WT.<name>. If this option is not used the default is WT.z_<meta name/property>.
 *
 * Example of including the plugin with your tag:
 * meta_data:{src:"meta_data.js", metaTags:[{name:"META TAG NAME", param:"WT.PARAMETER NAME"},{property:"META TAG PROPERTY"}]}
 *
*/

(function(document, undefined) {
	metaData = {
		init: function(dcs, options) {
			metaData.readOptions(options);
			dcs.addTransform(metaData.metaTransform, 'all');
		},
		
		// Reads plugin options
		readOptions: function(options)	{
			var len, tag;
			metaData.tagNames = [];
			metaData.tagProps = [];
			len = options.metaTags.length;
			for (var i = 0; i < len; i++)	{
				tag = options.metaTags[i];
				if (tag.name)	{
					metaData.tagNames.push(tag);
				}
				else if (tag.property)	{
					metaData.tagProps.push(tag);
				}
			}
		},
		
		metaTransform: function(dcs, options)	{
			options.argsa.push.apply(options.argsa, metaData.objectToArray(metaData.readMeta()));
		},
		
		// Helper function to convert key - value pair object into an array
		objectToArray: function (object) {
			var arr = [];
			for (var key in object) {
				if (object.hasOwnProperty(key) && object[key] != "" && object[key] != undefined && (typeof object[key] != "function"))	{
				 arr.push(key,object[key]);
				}
			}
			return arr;
		},
		
		// Reads meta tags from the page and returns an object containing the values to be tracked
		readMeta: function() {
			var elems;
			var meta = {};
			if (document.documentElement) {
				elems = document.getElementsByTagName("meta");
			}
			else if (document.all) {
				elems = document.all.tags("meta");
			}
			if (typeof (elems) != "undefined") {
				var length = elems.length;
				for (var i = 0; i < length; i++) {
					var name = elems[i].name || "";
					var prop = elems[i].getAttribute("property") || "";
					var content = elems[i].content || "";
					// Handle meta tags that use the name attribute
					if (name != "" && name != undefined) {
						var len = metaData.tagNames.length;
						for (var x = 0; x < len; x++)	{
							if (metaData.tagNames[x].name == name)	{
								var paramName = metaData.tagNames[x].param || "WT.z_" + name;
								if (meta.hasOwnProperty(paramName) && meta[paramName] != "" && meta[paramName] != undefined)	{
									meta[paramName] += ";" + content;
								}
								else	{
									meta[paramName] = content;
								}
							}
						}
					}
					// Handle meta tags that use the property attribute
					else if (prop != "" && prop != undefined)	{
						var len = metaData.tagProps.length;
						for (var x = 0; x < len; x++)	{
							if (metaData.tagProps[x].property == prop)	{
								var paramName = metaData.tagProps[x].param || "WT.z_" + prop;
								if (meta.hasOwnProperty(paramName) && meta[paramName] != "" && meta[paramName] != undefined)	{
									meta[paramName] += ";" + content;
								}
								else	{
									meta[paramName] = content;
								}
							}
						}
					}	
				}
			}
			return meta;
		}
	}
})(window.document);

Webtrends.registerPlugin("meta_data",metaData.init);