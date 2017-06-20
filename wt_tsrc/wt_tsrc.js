/*
Example of including the plugin with your tag.  Add as many traffic sources as you need.

traffic_source:{src:"tsrc.js", rDoms:[{domain:"REFERRING DOMAIN 1",source:"WT.tsrc VALUE"},{domain:"REFERRING DOMAIN 2",source:"WT.tsrc VALUE"}]}
*/

(function() {
	var Domains = "";

	PluginFunctions= {
		transformWorker:function(dcs) {
			dcs.WT.tsrc = PluginFunctions.getSource(dcs) ? PluginFunctions.getSource(dcs) : "";
		},
		doWork:function(dcs, options) {
			Domains = options["rDoms"];
			dcs.addTransform(PluginFunctions.transformWorker, 'all');
		},
		getSource:function(dcs)	{
			var refDom = (document.referrer) ? document.referrer.match(/\/\/([^\/^\?^#^;]+)/i)[1] : "";
			var len = Domains.length;
			for (var i=0;i<len;i++){
//				if (refDom.toLowerCase() == Domains[i].domain.toLowerCase() && refDom.toLowerCase() != document.domain.toLowerCase())	{
			if (refDom.toLowerCase() == Domains[i].domain.toLowerCase())	{
					var Src = Domains[i].source;
				}
			}
			return Src;
		}	
	}
})();

Webtrends.registerPlugin("traffic_source",PluginFunctions.doWork);