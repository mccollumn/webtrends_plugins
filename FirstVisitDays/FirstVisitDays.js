/*
 * FirstVisitDays v2
 * 
 * This plugin calculates the number of days since the visitor's first visit.
 * The first visit day is stored using a cookie in the visitor's browser,
 * and passed on all Webtrends events via the WT.z_fvd parameter.
 * Visitors that already had a Webtrends FPC (i.e. returning visitors) are indicated by WT.z_fvd_rv=1.
 *
 * Parameters:
 * WT.z_fvd = Number of days since the visitor's first visit (i.e. date WT_FVD cookie was written).
 * WT.z_fvd_rv = Indicates whether this was a returning visitor when the WT_FVD cookie was written. Values are "1" or "0".
 * 
 * Plugin options:
 * expiry -> The amount of time (in milliseconds) before the cookie will expire.
 * 			 If no expiry value is provided the WT_FPC expiry from the Webtrends tag will be used.
 * cname -> The name of the cookie used to store the date of first visit.
 * 			If no cname value is provided the cookie name is "WT_FVD".
 * collect -> Indicates whether the WT.z_fvd parameter should be passed. The cookie is still written.
 * 			  Valid values are true/false. Default is true.
 * 
 * Example of including the plugin with your tag:
 * FirstVisitDays: {src:"FirstVisitDays.js"}
 */

(function(window, document, undefined) {
	var fvd = {
		// Reads the plugin options
		readOptions: function(dcs, options)	{
			fvd.expiry = options.expiry || dcs.FPCConfig.expiry;
			fvd.cName = options.cname || "WT_FVD";
			fvd.collect = true;
			if (options.collect === false)	{
				fvd.collect = false;
			}
		},
		
		// Checks if the Webtrends FPC already exists
		checkReturning: function(dcs)	{
			var c = window.document.cookie;
			if (c.indexOf(dcs.FPCConfig.name) != -1)	{
				return "1";
			}
			else return "0";
		},
		
		// Writes cookie with current date/time
		setCookie: function(dcs)	{
			var dCur = new Date();
			var date = dCur.getTime();
			var expireDate = new Date(date + fvd.expiry).toUTCString();
			var domain = dcs.FPCConfig.domain;
			var rv = fvd.checkReturning(dcs);
			window.document.cookie = fvd.cName + "=d=" + date.toString() + ":rv=" + rv + "; path=/; " + "expires=" + expireDate + (domain != "" ? "; domain=" + domain : "");
		},
		
		// Takes a cookie name as input and returns the value. Returns empty string if cookie does not exist.
		getCookie: function(cname)	{
			var name = cname + "=";
     		var ca = window.document.cookie.split(';');
     		for(var i=0; i<ca.length; i++) {
         		var c = ca[i];
        		while (c.charAt(0)==' ') c = c.substring(1);
         		if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
     		}
     		return "";
		},
		
		// Takes the cookie value as input and returns the specified crumb
		getCrumb: function(cval, crumb, sep)	{
			var aCookie = cval.split(sep || ":");
			for (var i = 0; i < aCookie.length; i++) {
				var aCrumb = aCookie[i].split("=");
				if (crumb == aCrumb[0]) {
					return aCrumb[1];
				}
			}
			return null;
		},
		
		// Calculates the number of days between today and the cookie date
		calcDays: function(dStr)	{
			var startDate = new Date(Number(dStr));
			var dCur = new Date();
			var todayDate = dCur.getTime();
			var diffDays = Math.round(Math.abs((todayDate - startDate) / 86400000));
			return diffDays;
		},
		
		// Main function that handles reading/writing the cookie and setting WT.z_fvd
		firstVisitDays: function(dcs, options) {
			fvd.readOptions(dcs, options);
			var days = "0";
			var rv = "";
			var firstVisit = "";
			var cval = fvd.getCookie(fvd.cName);
			if (cval != "")	{
				rv = fvd.getCrumb(cval, "rv");
				firstVisit = fvd.getCrumb(cval, "d");
				days = fvd.calcDays(firstVisit).toString();
			}
			else	{
				fvd.setCookie(dcs);
				cval = fvd.getCookie(fvd.cName);
				if (cval == "")	{
					days = "Unknown";
					rv = "Unknown";
				}
				else	{
					rv = fvd.getCrumb(cval, "rv");
					firstVisit = fvd.getCrumb(cval, "d");
					days = fvd.calcDays(firstVisit).toString();
				}
			}
			if (fvd.collect)	{
				dcs.WT["z_fvd"] = days;
				dcs.WT["z_fvd_rv"] = rv;
			}
  		}
	};
	window.Webtrends.registerPlugin("FirstVisitDays",fvd.firstVisitDays);
})(window, window.document);