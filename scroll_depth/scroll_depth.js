/* WebTrends ScrollDepth Plug-in
   Asset ID: 1361814098901
   Last Modified: 10/13/2015
*/

/*
This plugin will set a value of scroll depth by quartiles. It will use WT.z_scrdpth=25,50,75,95.

To use this plugin:
 In the inline html or webtrends.load.js file, add a call to the plugin:

        plugins:{
            scroll_depth:{src:"./Insert_Path_Here/webtrends.scroll_depth.js"}
        }
*/

(function() {
	ScrollDepthFunctions= {
		// Main function that binds handler to scroll event
		doWork:function(dcs, options) {
			
			//Set the percentage where events should fire
			ScrollDepthFunctions.scrolltrigger = [0.25,0.50,0.75,0.95];
			ScrollDepthFunctions.tagSent = [false, false, false, false];
			
			if (jQuery().scroll && jQuery().scrollTop)	{
				if (ScrollDepthFunctions.jQueryVersion('1.4.3'))	{
					jQuery(window).scroll([],function()	{
						ScrollDepthFunctions.trackScroll();
					});	
				}
				else	{
					jQuery(window).scroll(function()	{
						ScrollDepthFunctions.trackScroll();
					});
				}
			}
			else {
				console.log("jQuery not found. Cannot track scroll depth.");
			}
		},
		// Helper function that checks the jQuery version
		jQueryVersion:function(v)	{
			var jv, varr = [], jvarr = [], len, i;
  		if (typeof(jQuery) !== 'undefined') {
    		if (typeof(v) === 'undefined') {
      		return true;
    		}
    		jv = jQuery.fn.jquery;
    		varr = v.split('.');
    		jvarr = jv.split('.');
    		len = varr.length;
    		if (jvarr.length < len) {
      		len = jvarr.length;
    		}
    		for (i = 0; i < len; i++) {
      		if (jvarr[i] < varr[i]) {
      	  	return false;
      		}
    		}
    		return true;
  		}
		},
		// Helper function that checks the dimensions of the page and returns the percentage
		getPercent:function()	{
			var wintop = jQuery(window).scrollTop(), docheight = jQuery(document).height(), winheight = jQuery(window).height();
			return wintop/(docheight-winheight);
		},
		// Fires dcsMultiTrack event when the triggers are hit
		trackScroll:function()	{
			var len = ScrollDepthFunctions.scrolltrigger.length;
			var percent = ScrollDepthFunctions.getPercent();
			for (x = 0; x < len; x++)  {
				if ((percent >= ScrollDepthFunctions.scrolltrigger[x]) && (!ScrollDepthFunctions.tagSent[x]))  {
					Webtrends.multiTrack({
						argsa: ["WT.z_scrdpth",ScrollDepthFunctions.scrolltrigger[x]*100,"WT.dl","60"]
					});
				     ScrollDepthFunctions.tagSent[x] = true;
				}
			}
		}
	}
})();

Webtrends.registerPlugin("scroll_depth",ScrollDepthFunctions.doWork);