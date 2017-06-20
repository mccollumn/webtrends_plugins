/*
This plugin tracks the number of hours and days between a visitor's campaign click and their next visit to the site.

Parameters:
WT.z_mcid = campaign ID
WT.z_mcid_hrs = # of hours since campaign click
WT.z_mcid_days = # of days since campaign click

Example of including the plugin with your tag.

campaign_time:{src:"campaign_time.js", cookiePath:"COOKIE PATH (Default /)", cookieName:"COOKIE NAME (Default WT_MC)", cookieDomain:"COOKIE DOMAIN (Default 'document.location.host')", cookieExpiration:"COOKIE EXPIRATION IN SECONDS (Default 2629743000)"}
*/

(function() {

	campaignTime= {
		transformWorker:function(dcs,options) {
			// Cookie options
			var name=dcs.plugins.campaign_time.cookieName || "WT_MC";
			var path=dcs.plugins.campaign_time.cookiePath || "/";
			var domain=dcs.plugins.campaign_time.cookieDomain || document.location.host;
			var expiration=parseInt(dcs.plugins.campaign_time.cookieExpiration) || 2629743000;
			
			var id=campaignTime.getCookieVal(dcs,"id",name);
			var lv=campaignTime.getCookieVal(dcs,"lv",name);
			var curTime=Math.round(new Date().getTime()/1000.0);
			
			// If cookie already exists, calculate elapsed time and expire the cookie.
			if (id != null)	{
				var elapseTime=curTime-lv;
				if (elapseTime > 7200)	{			// Considering any activity more than 2 hours later to be a returning visit
					options['argsa'].push(
						"WT.z_mcid", id,
						"WT.z_mcid_hrs", Math.round(elapseTime/3600).toString(),
						"WT.z_mcid_days", Math.round(elapseTime/86400).toString()
					);
					campaignTime.deleteCookie(name,path,domain);
				}
			}
			// If there isn't a cookie, check if one should be written.
			else	{
				var mcID=campaignTime.getCampaign(dcs);
				if (mcID)	{											//Check if WT.mc_id is in the query string
					options['argsa'].push(
						"WT.z_mcid", mcID
					);
					campaignTime.setCookie(mcID,curTime,name,path,domain,expiration);
				}
			}
		},
		doWork:function(dcs, options) {
			dcs.addTransform(campaignTime.transformWorker, 'collect');			
		},
		// Function to get campaign ID and visit time from the cookie
		getCookieVal:function(dcs,crumb,name)	{
			var cval=dcs.dcsGetCookie(name);
			if (cval != null)	{
				var aCookie = cval.split(":");
				for (var i = 0; i < aCookie.length; i++) {
					var aCrumb = aCookie[i].split("=");
					if (crumb == aCrumb[0]) {
						return aCrumb[1];
					}
				}
			}
			else {return null;}
		},
		// Function to expire the cookie
		deleteCookie:function(name,path,domain)	{
			var cDelete = name + "=";
			cDelete += "; expires=Thu, 01 Jan 1970 00:00:01 GMT";
			cDelete += "; path=" + path;
			cDelete += (domain) ? ";domain=" + domain : "";
			document.cookie = cDelete;
		},
		// Function to write the cookie
		setCookie:function(id,lv,name,path,domain,expiration)	{
			var expireDate=new Date().getTime()+expiration;
			var expiry=new Date(expireDate).toGMTString();
			document.cookie=name+"=id="+id+":lv="+lv+"; expires="+expiry+"; domain="+domain+"; path="+path;
		},
		// Function to retrieve the campaign ID from the URL query string
		getCampaign:function(dcs)	{
			var params=(dcs.DCS.dcsqry && Webtrends.getQryParams) ? Webtrends.getQryParams(dcs.DCS.dcsqry) : "";
			if (params["WT.mc_id"] != "undefined")	{
				return params["WT.mc_id"];
			}
			else	{return null;}
		}
	}
})();

Webtrends.registerPlugin("campaign_time",campaignTime.doWork);