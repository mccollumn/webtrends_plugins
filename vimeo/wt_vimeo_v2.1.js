$(document).ready(function() {

	// Listen for the ready event for any vimeo video players on the page
	var vimeoPlayers = document.querySelectorAll('iframe'),
			player;
	for (var i = 0, length = vimeoPlayers.length; i < length; i++) {
    player = vimeoPlayers[i];
    if (player.src.indexOf("//player.vimeo.com") != -1)	{
    	$f(player).addEvent('ready', ready);
    }
	}

	// Set percent complete points to track
	var tagPoints = [0.250,0.500,0.750];
	var tagSent = [false, false, false];

	// Set path for use with dcsURI
	var uriPath = ((window.location.pathname.indexOf('.')!=-1)||(window.location.pathname.charAt(window.location.pathname.length-1)=='/'))?window.location.pathname.match(/(.*)\//)[1]:window.location.pathname;

	function ready(player_id) {
		var froogaloop = $f(player_id);
			
		// Get the video title
		var vidTitle = '';
		var	vidID = '';
		function getTitle() {
			froogaloop.api('getVideoUrl', function (value, player_id) {
			vidID = value.match(/vimeo.com\/(\d+)/i)[1];
				var vidInfo = "http://vimeo.com/api/v2/video/"+vidID+".json?callback=?";
				$.getJSON(vidInfo, function(data){
					vidTitle = data[0].title;
				});
	 		});
		}

		function onPlay() {

			froogaloop.addEvent('play', function(data) {
				dcsMultiTrack('DCS.dcsuri',uriPath+'/'+vidID+'/'+vidTitle,'WT.ti',vidTitle||vidID,'WT.clip_ev','V','WT.clip_n',vidTitle||vidID,'WT.clip_t','Vimeo','WT.dl','110','WT.z_eng','2_2_'+(froogaloop.element.dataset.eng_content||'0')+'_'+(froogaloop.element.dataset.eng_method||'0')+'_31');
			});
		}

		function onFinish() {
			froogaloop.addEvent('finish', function(data) {
				dcsMultiTrack('DCS.dcsuri',uriPath+'/'+vidID+'/'+vidTitle,'WT.ti',vidTitle||vidID,'WT.clip_ev','F','WT.clip_n',vidTitle||vidID,'WT.clip_t','Vimeo','WT.dl','110');
			});
		}

		function onPlayProgress()	{
			froogaloop.addEvent('playProgress', function(data) {
				for (x = 0; x < tagPoints.length; x++)	{
					if ((data.percent >= tagPoints[x]) && (!tagSent[x]))	{
						dcsMultiTrack('DCS.dcsuri',uriPath+'/'+vidID+'/'+vidTitle,'WT.ti',vidTitle||vidID,'WT.clip_ev',tagPoints[x].toString()*100,'WT.clip_n',vidTitle||vidID[1],'WT.clip_t','Vimeo','WT.dl','110');
					tagSent[x] = true;
					}
				}
			});
		}

		getTitle();
		onPlay();
		onFinish();
		onPlayProgress()
	}
});