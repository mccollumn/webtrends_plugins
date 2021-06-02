
const overlay = {
    async: false,
    waitForCallback: true,
    timeout: 7500,
    overlays: {
        allClickTransform: function (dcsObject, multiTrackObject) {
            // Original Definition
            var el = multiTrackObject.element;
            var evt = multiTrackObject.event;
            var res = this.getAllClickURL(el);
            var offsite = this.getAllClickOffSite(el.href, res);
            var ttl = this.getAllClickTitle(el, evt);

            var article = "";
            // Akumina.aspx article Like button
            // el.classList is only supported in IE10 and above
            if (el.href && el.href.indexOf("#!") >= 0 && el.classList && el.classList.contains("likeButton")) {
                ttl = "Like";
                article = "1";
            }
            // /sites/Intranet article Like button
            else if (el.href && el.href.indexOf("#") >= 0 && el.dataset && el.dataset.title === "LIKE") {
                ttl = "Like";
                article = "1";
            }

            // Akumina.aspx article Share button
            if (el.href && el.href.indexOf("#!") >= 0 && el.classList && el.classList.contains("shareButton")) {
                ttl = "Share";
                article = "1";
            }
            // /sites/Intranet article Share button
            else if (el.href && el.href.indexOf("#") >= 0 && el.classList && el.classList.contains("shareButton")) {
                ttl = "Share";
                article = "1";
            }

            // Akumina.aspx and /sites/Intranet article Publish Comment button
            if (el.href && el.href.indexOf("#!") >= 0 && el.classList && el.classList.contains("publish-comment")) {
                ttl = "Post Comment";
                article = "1";
            }

            multiTrackObject.argsa.push(
                "DCS.dcssip", res.dcssip,
                "DCS.dcsuri", res.dcsuri + res.dcshash,
                "DCS.dcsqry", res.dcsqry,
                "DCS.dcsref", res.dcsref,
                "WT.ti", "Link: " + ttl,
                "WT.nv", dcsObject.dcsNavigation(multiTrackObject.event, dcsObject.navigationtag),
                "WT.z_article", article,
                "WT.dl", (offsite === true) ? "24" : "1"
                // Other parameters for the link click here
            );

            // Exit allClickTransform
            return;
        }
    }
}