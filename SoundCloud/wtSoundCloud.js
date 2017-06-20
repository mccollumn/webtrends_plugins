/*
SoundCloud tracking plugin.

To enable the SoundCloud Widget API, include this JS on the page.
https://w.soundcloud.com/player/api.js

Example of including the plugin with your tag:
	wtSoundCloud:{src:"wtSoundCloud.js"}

*/

(function(document) {
	wtSC= {
		
		// Default configs. Options can be changed in webtrends.load.js.
		opts: {
			pause: true,
			seek: true,
			download: true,
			share: true,
			buy: true,
			quartiles: true,
			dl: "41"
		},

		// Main function
		init: function(dcs, options) {
			wtSC.readOptions(options);
			jQuery(document).ready(function()	{
				// querySelectorAll() method is not support by IE 8 and older
				if (document.querySelectorAll)	{
					var iframes = document.querySelectorAll("iframe[src*='//w.soundcloud.com/player']");
					for ( var i = 0; i < iframes.length; i++)	{
						if (typeof(SC.Widget) == "function")	{
							wtSC.bindEvents(iframes[i]);
						}
					}
				}
				else	{
					console.log("Cannot load wtSoundCloud plugin. Browser is incompatible.");
				}
			});

		},
		
		// Set plugin options
		readOptions: function(options)	{
			for (i in wtSC.opts)	{
				if (options[i])	{
					wtSC.opts[i] = options[i];
				}
			}
		},
		
		// Bind player events
		bindEvents: function(iframe)	{
			var widget = SC.Widget(iframe);
			widget.bind(SC.Widget.Events.READY, function(){
				// Play
    			wtSC.playEvent(widget);
    			//Complete
    			wtSC.completeEvent(widget);
    			// Progress
    			if (wtSC.opts.quartiles)	{
    				wtSC.progressEvent(widget);
    			}
    			// Pause
    			if (wtSC.opts.pause)	{
    				wtSC.pauseEvent(widget);
    			}
    			// Seek
    			if (wtSC.opts.seek)	{
    				wtSC.seekEvent(widget);
    			}
    			// Download
    			if (wtSC.opts.download)	{
    				wtSC.downloadEvent(widget);
    			}
    			// Share
    			if (wtSC.opts.share)	{
    				wtSC.shareEvent(widget);
    			}
    			// Buy
    			if (wtSC.opts.buy)	{
    				wtSC.buyEvent(widget);
    			}
    		});
		},
		
		// Check info for current sound
		soundInfo: function(currentSound)	{
			var info = [];
			info.push(
				"WT.clip_n", currentSound.title,
				"WT.clip_id", currentSound.id,
				"WT.clip_duration", currentSound.duration || "",
				"WT.clip_downloads", currentSound.downloads || "",
				"WT.clip_likes", currentSound.likes_count || "",
				"WT.clip_comments", currentSound.comment_count || "",
				"WT.clip_shares", currentSound.reposts_count || "",
				"WT.clip_plays", currentSound.playback_count || "",
				"WT.clip_link", currentSound.permalink_url || "",
				"WT.ti", currentSound.title,
				"WT.dl", wtSC.opts.dl
			);
			return info;
		},
		
		// Play event fires when playback begins automatically or when user clicks play button
		playEvent: function(widget)	{
			widget.bind(SC.Widget.Events.PLAY, function()	{
				widget.getCurrentSound(function(currentSound) {
					var sound = wtSC.soundInfo(currentSound);
					sound.push(
						"WT.clip_ev", "V"
					);
					wtSC.fireEvent(sound);
        		});
			});
		},
		
		// Capture quartile events
		progressEvent: function(widget)	{
			var quartile = [25,50,75];
			var eventFired = [false, false, false];
			widget.bind(SC.Widget.Events.PLAY_PROGRESS, function(progress)	{
				var percent = Math.floor(progress.relativePosition * 100);
				for (x = 0; x < quartile.length; x++)	{
					if ((percent >= quartile[x]) && (!eventFired[x]))	{
						var q = quartile[x];
						eventFired[x] = true;
						widget.getCurrentSound(function(currentSound) {
							var sound = wtSC.soundInfo(currentSound);
							sound.push(
								"WT.clip_ev", q
							);
							wtSC.fireEvent(sound);
        				});
					}
				}
			});
		},
		
		// Capture finish event
		completeEvent: function(widget)	{
			widget.bind(SC.Widget.Events.FINISH, function()	{
				widget.getCurrentSound(function(currentSound) {
 					var sound = wtSC.soundInfo(currentSound);
					sound.push(
						"WT.clip_ev", "F"
					);
					wtSC.fireEvent(sound);
        		});
			});
		},
		
		// Capture pause event
		pauseEvent: function(widget)	{
			widget.bind(SC.Widget.Events.PAUSE, function()	{
				widget.getCurrentSound(function(currentSound) {
 					var sound = wtSC.soundInfo(currentSound);
					sound.push(
						"WT.clip_ev", "Pause"
					);
					wtSC.fireEvent(sound);
        		});
			});
		},
		
		// Capture seek events
		seekEvent: function(widget)	{
			widget.bind(SC.Widget.Events.SEEK, function()	{
				widget.getCurrentSound(function(currentSound) {
 					var sound = wtSC.soundInfo(currentSound);
					sound.push(
						"WT.clip_ev", "Seek"
					);
					wtSC.fireEvent(sound);
        		});
			});
		},
		
		// Capture download button clicks
		downloadEvent: function(widget)	{
			widget.bind(SC.Widget.Events.CLICK_DOWNLOAD, function()	{
				widget.getCurrentSound(function(currentSound) {
 					var sound = wtSC.soundInfo(currentSound);
					sound.push(
						"WT.clip_ev", "Download"
					);
					wtSC.fireEvent(sound);
        		});
			});
		},
		
		// Capture event when share panel opens
		shareEvent: function(widget)	{
			widget.bind(SC.Widget.Events.OPEN_SHARE_PANEL, function()	{
				widget.getCurrentSound(function(currentSound) {
 					var sound = wtSC.soundInfo(currentSound);
					sound.push(
						"WT.clip_ev", "Share"
					);
					wtSC.fireEvent(sound);
        		});
			});
		},
		
		// Capture buy button clicks
		buyEvent: function(widget)	{
			widget.bind(SC.Widget.Events.CLICK_BUY, function()	{
				widget.getCurrentSound(function(currentSound) {
 					var sound = wtSC.soundInfo(currentSound);
					sound.push(
						"WT.clip_ev", "Buy"
					);
					wtSC.fireEvent(sound);
        		});
			});
		},
		
		// Converts all parameter values to strings and fires Webtrends tracking event
		fireEvent: function(sound)	{
			var params = [];
	        for (var param in sound) {
            	if (typeof sound[param] == 'number')	{
             	   params.push(sound[param].toString());
             	}
            	else	{
            		params.push(sound[param]);
            	}
        	}
			Webtrends.multiTrack({
            	argsa: params
        	});
		}
	}
})(document);

Webtrends.registerPlugin("wtSoundCloud",wtSC.init);