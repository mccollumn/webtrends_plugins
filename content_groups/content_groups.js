/*
This plugin checks the path of the URL and by default uses the first and second directory names, if they exist, as the content group (WT.cg_n) and content sub-group (WT.cg_s).
However, plugin options can be used to override the default behavior.
If the page is already assigned a content group value it is not changed.


Options:

cg -> Directory number for content group. Default is 1 if not specified.
csg -> Directory number for content sub group. Default is 2 if not specified.
		Valid values are 0, 1, 2, or 3, where 0 prevents the parameter from being logged.
hp -> Indicates if a content group value of "Homepage" should be assigned.  Default is 0 if not specified.
		Valid values are 0 (disable the functionality) and 1 (enable the functionality).

For example, this URL:

www.domain.com/directory1/directory2/directory3/file.html

Logs this content group / sub-group:

WT.cg_n=Directory1
WT.cg_s=Directory2


Example of including the plugin with your tag.

content_groups: { src: "content_groups.js", cg: "0-3 (Default 1)", csg: "0-3 (Default 2)", hp: "0 or 1 (Default 0)" }
*/

(function() {
	ContentGroups= {
		transformWorker:function(dcs, options) {
			var fileName = dcs.DCS.dcsuri.match(/^.*\/([^/]*)$/)[1];
			var URI = dcs.DCS.dcsuri.lastIndexOf(".") === -1 ? dcs.DCS.dcsuri : dcs.DCS.dcsuri.replace(fileName, "");
			
			var d = [];
			d[0] = new RegExp(/\/([^/]+)/);
			d[1] = new RegExp(/\/([^/]+)\/([^/]+)/);
			d[2] = new RegExp(/\/([^/]+)\/([^/]+)\/([^/]+)/);

			if ((typeof dcs.WT.cg_n == "undefined") && (document.location.pathname == "/") && (dcs.cgHP == "1"))	{
				dcs.WT.cg_n = "Homepage";
			}
			else if ((typeof dcs.WT.cg_n == "undefined") && (dcs.cgDir != "0") && (URI.match(d[dcs.cgDir - 1])))	{
				dcs.WT.cg_n = URI.match(d[dcs.cgDir - 1])[dcs.cgDir].charAt(0).toUpperCase() + URI.match(d[dcs.cgDir - 1])[dcs.cgDir].slice(1);
			}
			if ((typeof dcs.WT.cg_s == "undefined") && (dcs.csgDir != "0") && (URI.match(d[dcs.csgDir - 1])))	{
				dcs.WT.cg_s = URI.match(d[dcs.csgDir - 1])[dcs.csgDir].charAt(0).toUpperCase() + URI.match(d[dcs.csgDir - 1])[dcs.csgDir].slice(1);
			}

		},
		doWork: function(dcs, options) {
			dcs.cgDir = options.cg || "1";
			dcs.csgDir = options.csg || "2";
			dcs.cgHP = options.hp || "0";
			if (((dcs.cgDir >= "0") && (dcs.cgDir <= "3")) && ((dcs.csgDir >= "0") && (dcs.csgDir <= "3")))	{
				dcs.addTransform(ContentGroups.transformWorker, 'all');
			}
		}
	}
})();

Webtrends.registerPlugin("content_groups",ContentGroups.doWork);