/**
 * This plugin captures interactions with Akumina search.
 * It works in conjunction with the standard SharePoint tracking.
 * 
 * Usage:
 *  See external documentation.
 * 
 * Notes:
 *  Internet Explorer is not supported.
 *  Requires allClick tracking to be enabled in the SharePoint tracking.
 * 
 * @author      Nick M.
 * @version     0.9
 */

// TODO: 
// May need to add tracking in the People table. Wait for testing to confirm.
// Confirm that doc info is included in result click events.

// Don't know number of results or page number for People
// Passing oss_r = 1 for successful search. Page num is always 1.

// Results perPage, used to calculate the page number, can be inaccurate if user is on the last page.

// May have duplicate search events if search is performed anywhere that isn't the search page


(function (document, undefined) {
    let wt;

    window.wt_sp_globals.akuminaSearch = {
        listenersAttached: false,
        akuminaEventsSubscribed: false,

        init: function (dcs, options) {
            // IE is not supported
            const agent = window.navigator.userAgent;
            if (agent.indexOf("MSIE") >= 0) {
                wt.akuminaSearch.registerPlugin();
                return;
            }

            const waitForSpPlugin = setInterval(function () {
                if (window.wt_sp_globals) {
                    clearInterval(waitForSpPlugin);
                    wt = window.wt_sp_globals;
                    wt.akuminaSearch.search = initializeSearchObj();
                    wt.akuminaSearch.readOptions(options);
                    wt.akuminaSearch.searchTracking();
                    wt.akuminaSearch.registerPlugin();
                }
            }, 100);
        },

        /**
         * This object will be populated as search events occur
         * @returns {Object} Search object with empty values
         */
        initializeSearchObj: function () {
            return {
                count: 0,
                isSearchPage: false,
                refiners: null,
                results: {
                    count: 0,
                    pagination: null,
                    perPage: null
                },
                scope: null,
                term: {
                    current: null,
                    previous: null,
                    original: null
                },
                type: null,
                action: null,
                resultItem: {
                    item: null,
                    action: null,
                    type: null,
                    position: 0
                },
                people: {
                    name: null,
                    title: null,
                    department: null
                }
            };
        },

        /**
         * Array of search data
         * @returns {Array} Parameter-value pairs sent with search events
         */
        getSearchData: function () {
            const searchData = [
                "WT.oss", decodeURIComponent(wt.akuminaSearch.search.term.current.toString()),
                "WT.oss_r", wt.akuminaSearch.search.results.count.toString(),
                "WT.oss_ref", wt.akuminaSearch.search.refiners.toString(),
                "WT.oss_action", wt.akuminaSearch.search.action.toString(),
                "WT.oss_pg", wt.akuminaSearch.search.results.pagination.toString(),
                "WT.oss_orig", wt.akuminaSearch.search.term.original.toString(),
                "WT.oss_count", wt.akuminaSearch.search.results.count.toString(),
                "WT.oss_scope", wt.akuminaSearch.search.scope.toString(),
                "WT.oss_type", wt.akuminaSearch.search.type.toString(),
                "WT.oss_visits", "Visits With Search",
                "WT.ti", "Search Results",
                "WT.shp_srch_col", wt.spPageContextInfo.siteAbsoluteUrl || "",
                "WT.shp_srch_site", wt.spPageContextInfo.webAbsoluteUrl || ""
            ];
            return searchData;
        },

        /**
         * Array of result click data
         * @returns {Array} Parameter-value pairs sent with result clicks
         */
        getResultClickData: function () {
            const resultData = [
                // "WT.shp_doc_a", "Open",
                // "WT.shp_doc", docName,
                // "WT.shp_doc_type", docType,
                "WT.shp_srch_people_name", wt.akuminaSearch.search.people.name.toString(),
                "WT.shp_srch_people_title", wt.akuminaSearch.search.people.title.toString(),
                "WT.shp_srch_people_dept", wt.akuminaSearch.search.people.department.toString(),
                "WT.shp_srch_item", wt.akuminaSearch.search.resultItem.item.toString(),
                "WT.shp_srch_item_action", wt.akuminaSearch.search.resultItem.action.toString(),
                "WT.shp_srch_item_type", wt.akuminaSearch.search.resultItem.type.toString(),
                "WT.shp_srch_term", decodeURIComponent(wt.akuminaSearch.search.term.current.toString()),
                "WT.shp_srch_orig", wt.akuminaSearch.search.term.original.toString(),
                "WT.shp_srch_pos", wt.akuminaSearch.search.resultItem.position.toString(),
                "WT.shp_srch_ref", wt.akuminaSearch.search.refiners.toString(),
                "WT.shp_srch_pg", wt.akuminaSearch.search.results.pagination.toString(),
                "WT.shp_srch_scope", wt.akuminaSearch.search.scope.toString(),
                "WT.shp_srch_type", wt.akuminaSearch.search.type.toString(),
                "WT.shp_srch_count", wt.akuminaSearch.search.count.toString(),
                "WT.shp_srch_col", wt.spPageContextInfo.siteAbsoluteUrl || "",
                "WT.shp_srch_site", wt.spPageContextInfo.webAbsoluteUrl || ""
            ];
            return resultData;
        },

        /**
         * Determines if the current URL is an Akumina search page.
         * @returns {boolean} True if a search page. Otherwise false.
         */
        isSearchPage: function () {
            const pathname = new URL(document.location).pathname;
            if (wt.akuminaSearch.searchPage && pathname.includes(wt.akuminaSearch.searchPage)) {
                wt.akuminaSearch.search.isSearchPage = true;
                return true;
            }
            return false;
        },

        /**
         * Reads and sets plugin options.
         * @param {Object} options - User defined plugin options
         */
        readOptions: function (options) {
            wt.akuminaSearch.searchPage = options.searchPage || null;
        },

        /**
         * Let the WT tag know we're done
         */
        registerPlugin: function () {
            window.wt_sp_globals.pluginObj.tagObj.registerPluginCallback("akuminaSearch");
            window.wt_sp_globals.SPAllowRegister = false;
        },

        /**
         * Subscribes to Akumina search complete events
         */
        bindAkuminaEvents: function () {
            Akumina.Digispace.AppPart.Eventing.Subscribe('/genericsearchlist/loaded/', wt.akuminaSearch.handleGeneralSearchEvent(data));
            Akumina.Digispace.AppPart.Eventing.Subscribe('/peopledirectory/searchcompleted/', wt.akuminaSearch.handlePeopleSearchEvent(data));
            wt.akuminaSearch.akuminaEventsSubscribed = true;
        },

        /**
         * Adds event listeners on the Akumina search page
         */
        bindClickEvents: function () {
            // Result Clicks
            $(".ia-search-results").on("mousedown", "a.ak-spalink", function () {
                wt.akuminaSearch.handleResultClick(this);
            });
            $(".ia-people-results").on("mousedown", "a", function () {
                wt.akuminaSearch.handleResultClick(this);
            });

            // Pagination
            $("div.showMoreResults").on("mousedown", "a", function () {
                wt.akuminaSearch.handlePagination(this);
            });
            $("ak-search-paging").on("mousedown", "a.ak-search-paging-forwardbutton, a.ak-search-paging-backbutton", function () {
                wt.akuminaSearch.handlePagination(this);
            });

            // Refiners
            $(".ia-search-refiner-results-container").on("mousedown", "a.ak-search-refiner", function () {
                wt.akuminaSearch.handleRefinement(this);
            });

            // Type Change
            $("nav.ia-transformer-tab-nav").on("mousedown", "li", function () {
                wt.akuminaSearch.handleTypeChange();
            });

            // Search
            $("#siteSearch").keydown(function (event) {
                if (event.keyCode === 13) {
                    wt.akuminaSearch.handleSearch();
                }
            });

            wt.akuminaSearch.listenersAttached = true;
        },

        /**
         * Attach the listeners if they are not already
         */
        attachListeners: function () {
            if (!wt.akuminaSearch.listenersAttached) {
                wt.akuminaSearch.bindClickEvents();
            }
        },

        /**
         * Event handler for the Akumina /genericsearchlist/loaded/ event
         * @param {Object} data - Data object returned from the Akumina /genericsearchlist/loaded/ event
         */
        handleGeneralSearchEvent: function (data) {
            wt.akuminaSearch.currentGeneralSearchData = data;

            // Grab the current search term from the Akumina data
            if (wt.akuminaSearch.currentGeneralSearchData.Term) {
                wt.akuminaSearch.search.term.current = wt.akuminaSearch.currentGeneralSearchData.Term;
            }

            wt.akuminaSearch.attachListeners();
        },

        /**
         * Event handler for the Akumina /peopledirectory/searchcompleted/ event
         * @param {Object} data - Data object returned from the Akumina /peopledirectory/searchcompleted/ event
         */
        handlePeopleSearchEvent: function (data) {
            wt.akuminaSearch.currentPeopleSearchData = data;
            wt.akuminaSearch.search.type = "People";
            wt.akuminaSearch.attachListeners();
        },

        /**
         * Event handler for search result clicks
         * @param {Object} el - DOM element that was clicked
         */
        handleResultClick: function (el) {
            wt.akuminaSearch.setSearchData("");
            wt.akuminaSearch.setResultClickData(el);
            wt.akuminaSearch.transform("result");
        },

        /**
         * Event handler for pagination events
         */
        handlePagination: function () {
            wt.akuminaSearch.setSearchData("Pagination");
            wt.akuminaSearch.transform();
        },

        /**
         * Event handler for refinement events
         * @param {Object} el - DOM element that was clicked
         */
        handleRefinement: function (el) {
            wt.akuminaSearch.setSearchData("Refinement", el);
            wt.akuminaSearch.transform();
            wt.akuminaSearch.search.refiners = null;
        },

        /**
         * Event handler for type change events
         */
        handleTypeChange: function () {
            wt.akuminaSearch.incrementCount();
            wt.akuminaSearch.setSearchData("Type Change");
            wt.akuminaSearch.transform();
        },

        /**
         * Event handler for search events
         */
        handleSearch: function () {
            wt.akuminaSearch.incrementCount();
            wt.akuminaSearch.setSearchData("Search");
            wt.akuminaSearch.track();
        },

        /**
         * Returns the filename portion of a URL
         * @param {Object} url - URL object
         * @returns {string} The filename from the url if it exists. Otherwise, null.
         */
        getFilename: function (url) {
            const filename = decodeURI(url.pathname).replace(/^.*[\\\/]/, '');
            return filename || null;
        },

        /**
         * Returns the link title
         * @param {Object} el - Dom element containing a link title
         * @returns {string} The link title if it exists. Otherwise, null.
         */
        getLinkTitle: function (el) {
            const title = el.textContent.trim();
            return title || null;
        },

        /**
         * Returns the text from the paging element on result pages
         * @returns {string} Text from the paging element
         */
        getPagingText: function () {
            return document.querySelector("span.ak-search-paging-display").textContent.trim();
        },

        /**
         * Returns the total number of search results found in the paging text
         * @returns {string} Total number of results
         */
        getResultCount: function () {
            const pagingText = wt.akuminaSearch.getPagingText();
            const totalResults = pagingText ? pagingText.match(/of (\d+)/i)[1] : null;
            return totalResults;
        },

        /**
         * Returns the position of the first result on the current page
         * @returns {string} Position of first result
         */
        getFirstResultNum: function () {
            const pagingText = wt.akuminaSearch.getPagingText();
            const firstResult = pagingText ? pagingText.match(/^[^\d]+(\d+)/i)[1] : null;
            return firstResult;
        },

        /**
         * Returns the position of the last result on the current page
         * @returns {string} Position of last result
         */
        getLastResultNum: function () {
            const pagingText = wt.akuminaSearch.getPagingText();
            const lastResult = pagingText ? pagingText.match(/^[^-]+- (\d+)/i)[1] : null;
            return lastResult;
        },

        /**
         * Stores the current search term
         */
        setCurrentTerm: function () {
            const searchBox = document.querySelector("#siteSearch");
            const term = searchBox ? searchBox.value : null;
            wt.akuminaSearch.search.term.current = term;
        },

        /**
         * Stores the original search term
         */
        setOriginalTerm: function () {
            // Read "term" param from query string
            const params = (new URL(document.location)).searchParams;
            const term = params.get("term");
            wt.akuminaSearch.search.term.original = term;
        },

        /**
         * Stores the total number of search results
         */
        setResultCount: function () {
            wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                if (wt.akuminaSearch.currentPeopleSearchData.searchResults.length === 0) {
                    wt.akuminaSearch.search.results.count = 0;
                }
                else {
                    wt.akuminaSearch.search.results.count = 1;
                }
            }
            else {
                if (document.querySelector("div.ia-search-results").textContent.includes("No results")) {
                    wt.akuminaSearch.search.results.count = 0;
                }
                else {
                    wt.akuminaSearch.search.results.count = wt.akuminaSearch.getResultCount();
                }
            }
        },

        /**
         * Stores the refinement that was performed
         * @param {Object} el - DOM element for refiner that was clicked
         */
        setRefiners: function (el) {
            if (el) {
                const refineType = el.textContent;
                const refineValue = el.dataset.name;
                wt.akuminaSearch.search.refiners = `${refineType}:${refineValue}`;
            }
            else {
                wt.akuminaSearch.search.refiners = null;
            }
        },

        /**
         * Stores the search action type
         * @param {string} eventType - The type of search event that occurred
         */
        setAction: function (eventType) {
            wt.akuminaSearch.search.action = eventType ? eventType : null;
        },

        /**
         * Stores the current search result page number
         */
        setResultPage: function () {
            wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.search.results.pagination = 1;
            }
            else {
                const firstResultNum = wt.akuminaSearch.getFirstResultNum();
                const lastResultNum = wt.akuminaSearch.getLastResultNum();
                const perPage = lastResultNum - firstResultNum + 1; // This is best guess
                const previousPages = Math.trunc(firstResultNum / perPage);
                wt.akuminaSearch.search.results.pagination = previousPages + 1;
                wt.akuminaSearch.search.results.perPage = perPage;
            }
        },

        /**
         * Stores the search scope. Currently only "Everything".
         */
        setScope: function () {
            // Not currently used
            wt.akuminaSearch.search.scope = "Everything";
        },

        /**
         * Stores the search type
         */
        setSearchType: function () {
            const searchNav = document.querySelector("nav.ia-transformer-tab-nav");
            if (searchNav) {
                const selectedTab = searchNav.querySelector("li[class*='active']");
                const searchType = selectedTab.querySelector("a").textContent;
                wt.akuminaSearch.search.type = searchType;
            }
            else {
                wt.akuminaSearch.search.type = null;
            }
        },

        /**
         * Stores the result item, either the link title or filename
         * @param {Object} el - DOM element of result that was clicked
         */
        setItem: function (el) {
            wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.setPeopledata(el);
                wt.akuminaSearch.search.resultItem.item = wt.akuminaSearch.search.people.name;
            }
            else {
                const plugin = window.wt_sp_globals.pluginObj;
                const url = new URL(el.href);
                wt.akuminaSearch.search.resultItem.item = isDoc(url.href, plugin.types) ? wt.akuminaSearch.getFilename(url) : wt.akuminaSearch.getLinkTitle(el);
            }
        },

        /**
         * Stores the item action. Currently only "Open".
         */
        setItemAction: function () {
            // Only action is Open
            wt.akuminaSearch.search.resultItem.action = "Open";
        },

        /**
         * Stores the item type
         * @param {Object} el - DOM element of result that was clicked
         */
        setItemType: function (el) {
            wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.search.resultItem.type = "People";
            }
            else {
                const plugin = window.wt_sp_globals.pluginObj;
                const url = new URL(el.href);
                wt.akuminaSearch.search.resultItem.type = isDoc(url.href, plugin.types) ? "Document" : "URL";
            }
        },

        /**
         * Stores the position of the result that was clicked
         * @param {Object} el - DOM element of result that was clicked
         */
        setPosition: function (el) {
            wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                const profile = el.closest("div.ia-profile-container");
                if (profile) {
                    const position = profile.querySelector("[data-id]").dataset.id;
                }
            }
            else {
                wt.akuminaSearch.setResultPage();
                const perPage = wt.akuminaSearch.search.results.perPage;
                const previousPages = wt.akuminaSearch.search.results.pagination - 1;
                const list = document.querySelector("div.ia-search-results ul");
                wt.akuminaSearch.search.resultItem.position = (previousPages * perPage) + wt.akuminaSearch.countListItems(list);
            }
        },

        /**
         * Stores details about the People result that was clicked
         * @param {Object} el - DOM element of result that was clicked
         */
        setPeopledata: function (el) {
            const profile = el.closest("div.ia-profile-container");
            if (profile) {
                wt.akuminaSearch.search.people.name = profile.querySelector("div.ia-profile-details .ia-profile-name").textContent.trim();
                wt.akuminaSearch.search.people.title = profile.querySelector("div.ia-profile-details .ia-profile-title").textContent.trim();
                wt.akuminaSearch.search.people.department = profile.querySelector("div.ia-profile-details .ia-profile-dept").textContent.trim();
            }
        },

        /**
         * Stores all information collected for search events
         * @param {string} eventType - The type of search event that occurred
         * @param {Object} el - DOM element of the search component that was clicked
         */
        setSearchData: function (eventType, el) {
            wt.akuminaSearch.setScope();
            wt.akuminaSearch.setSearchType();
            wt.akuminaSearch.setCurrentTerm();
            wt.akuminaSearch.setOriginalTerm();
            wt.akuminaSearch.setResultCount();
            wt.akuminaSearch.setRefiners(el);
            wt.akuminaSearch.setAction(eventType);
            wt.akuminaSearch.setResultPage();
        },

        /**
         * Stores all information collected for result click events
         * @param {Object} el - DOM element of result that was clicked
         */
        setResultClickData: function (el) {
            wt.akuminaSearch.setItem(el);  // Link title, document filename
            wt.akuminaSearch.setItemAction();  // Always Open
            wt.akuminaSearch.setItemType(el);  // Document, URL, People
            wt.akuminaSearch.setPosition(el);
        },

        /**
         * Increments the number of search events
         */
        incrementCount: function () {
            wt.akuminaSearch.search.count++;
        },

        /**
         * Returns the number of items in an HTML list
         * @param {Object} list - The <ul> element containing search results
         * @returns {number} The number of items (<li> elements) in the list
         */
        countListItems: function (list) {
            let i = 0;
            let itemCount = 0;

            while (list.getElementsByTagName("li")[i++]) {
                itemCount++;
            }
            return itemCount;
        },

        /**
         * Adds a transform containing the search information to be added to the click event
         * @param {string} eventType - The type of search event that occurred
         */
        transform: function (eventType) {
            const data = [];
            if (wt.akuminaSearch.isSearchPage()) {
                if (eventType === "result") {
                    data.push(wt.akuminaSearch.getResultClickData());
                }
                else {
                    data.push(wt.akuminaSearch.getSearchData());
                }
            }
            else {
                if (eventType === "result") {
                    let search = wt.akuminaSearch.getSearchData();
                    let result = wt.akuminaSearch.getResultClickData();
                    //data = search.concat(result);
                    data = [...new Set([...search, ...result])];
                }
                else {
                    data.push(wt.akuminaSearch.getSearchData());
                }
            }
            const plugin = window.wt_sp_globals.pluginObj;
            plugin.addTransform(function (dcsObject, multiTrackObject) {
                multiTrackObject.argsa.push(data);
            }, "multitrack");
        },

        /**
         * Sends a multiTrack event containing the search data
         */
        track: function () {
            const plugin = window.wt_sp_globals.pluginObj;
            Webtrends.multiTrack({
                argsa: wt.akuminaSearch.getSearchData(),
                finish: function (dcsObject, multiTrackObject) {
                    plugin.finishCleanup(dcsObject, multiTrackObject);
                }
            })
        },

        /**
         * Attaches listeners on search page and adds search data to the page load event
         */
        searchTracking: function () {
            if (!wt.akuminaSearch.akuminaEventsSubscribed) {
                wt.akuminaSearch.bindAkuminaEvents();
            }

            if (wt.akuminaSearch.isSearchPage()) {
                wt.akuminaSearch.setSearchData("Search");
                wt.akuminaSearch.incrementCount();
                wt.akuminaSearch.attachListeners();

                // Track search page load
                const plugin = window.wt_sp_globals.pluginObj;
                plugin.addTransform(function (dcsObject, multiTrackObject) {
                    multiTrackObject.argsa.push(wt.akuminaSearch.getSearchData());
                }, "collect");
            }
        }
    }
})(window.document);

Webtrends.registerPlugin("akuminaSearch", window.wt_sp_globals.akuminaSearch.init);