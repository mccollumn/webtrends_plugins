This Vimeo JS plugin will capture play, 25%, 50%, 75%, and complete events for videos embedded on the site.


===================
Parameter Reference
===================

The plugin collects the following values needed to identify and report on the videos, and it can accept custom WT.z_eng parameter values.

DCS.dcsuri
-URL path of the page containing the Vimeo video plus the video ID and the video title.

WT.clip_ev
-The media event (e.g. V, 25, 50, 75, F)

WT.clip_n
-The clip name.  This value can be provided or otherwise the media file name is used by default.

WT.clip_t
-The clip type (Vimeo).

WT.dl
-The event type (110).

WT.ti
-The page title.  This is the clip name or video ID.

WT.z_eng
-The engagement action value.  The content and/or method can be specified (see below), otherwise the default will be “2_2_0_0_31”.


=========================================
Using the Engagement Parameter (WT.z_eng)
=========================================

The engagement content and/or method values can be specified by including the following custom data attributes for the Vimeo iframe.

Custom Data Attribute		Possible Values		Value Definitions
---------------------		---------------		-----------------
data-eng_content				3									Full Program
												4									Program Preview
												10								Section/Story
data-eng_method					16								Live Stream
												17								Play

For example, the iframe for a Vimeo video that is a recording of a full program would be configured like this.

<iframe id="player1" src="http://player.vimeo.com/video/21127608?api=1&amp;player_id=player1" data-eng_content="3" data-eng_method="17" width="540" height="304" frameborder="0"></iframe>


============
Requirements
============

•	The plugin is implemented by including wt_vimeo.js on the page with the embedded player.
•	The page must also include the Webtrends tracking code, as well as the jquery and froogaloop (http://a.vimeocdn.com/js/froogaloop2.js) libraries.
•	The Vimeo API must be turned on by adding “api=1” to the URL of the iframe.
•	Each player must be given a “player_id” and the value must match the id of the iframe.


More information about the Vimeo API is here:

http://developer.vimeo.com/player/js-api
