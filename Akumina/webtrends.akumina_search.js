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
 * Example of plugin options:
 *  async: false,
 *  waitForCallback: true,
 *  timeout: 7500,
 *  searchPage: "akuminasearch.aspx"
 * 
 * @author      Nick M.
 * @version     0.9.12
 */

// Limitations:
// Don't know number of results or page number for People
// Passing oss_r = 1 for successful search. Page num is always 1.

// Results perPage, used to calculate the page number, can be inaccurate if user is on the last page.


(function (document, undefined) {
    let wt;

    window.wt_sp_globals.akuminaSearch = {
        listenersAttached: false,
        akuminaEventsSubscribed: false,

        init: function (dcs, options) {
            const waitForSpPlugin = setInterval(function () {
                if (window.wt_sp_globals) {
                    clearInterval(waitForSpPlugin);
                    wt = window.wt_sp_globals;

                    console.log("WT - init");
                    wt.akuminaSearch.initTime = Date.now();

                    // IE is not supported
                    if (wt.akuminaSearch.isIE()) {
                        wt.akuminaSearch.registerPlugin();
                        return;
                    }

                    // jQuery is required
                    if (!wt.akuminaSearch.isjQueryLoaded()) {
                        wt.akuminaSearch.registerPlugin();
                        return;
                    }

                    wt.akuminaSearch.search = wt.akuminaSearch.initializeSearchObj();
                    wt.akuminaSearch.readOptions(options);

                    $(window).on("load", function () {
                        wt.akuminaSearch.searchTracking();
                    });
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
                refiners: "",
                results: {
                    count: "",
                    pagination: "",
                    perPage: ""
                },
                scope: "",
                term: {
                    current: "",
                    previous: "",
                    original: ""
                },
                type: "",
                action: "",
                resultItem: {
                    item: "",
                    action: "",
                    type: "",
                    position: ""
                },
                people: {
                    name: "",
                    title: "",
                    department: "",
                    action: ""
                },
                document: {
                    name: "",
                    type: "",
                    action: ""
                },
                flags: {
                    search: false,
                    pagination: false,
                    refine: false,
                    scope: false,
                    type: false
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
                "WT.oss_count", wt.akuminaSearch.search.count.toString(),
                "WT.oss_scope", wt.akuminaSearch.search.scope.toString(),
                "WT.oss_type", wt.akuminaSearch.search.type.toString(),
                "WT.oss_visits", "Visits With Search",
                "WT.ti", "Search Results",
                "WT.shp_srch_col", wt.spPageContextInfo.siteAbsoluteUrl || "",
                "WT.shp_srch_site", wt.spPageContextInfo.webAbsoluteUrl || "",
                "WT.dl", "SRCH"
            ];
            return searchData;
        },

        /**
         * Array of result click data
         * @returns {Array} Parameter-value pairs sent with result clicks
         */
        getResultClickData: function () {
            const resultData = [
                "WT.shp_doc_a", wt.akuminaSearch.search.document.action,
                "WT.shp_doc", wt.akuminaSearch.search.document.name,
                "WT.shp_doc_type", wt.akuminaSearch.search.document.type,
                "WT.shp_srch_people_name", wt.akuminaSearch.search.people.name.toString(),
                "WT.shp_srch_people_title", wt.akuminaSearch.search.people.title.toString(),
                "WT.shp_srch_people_dept", wt.akuminaSearch.search.people.department.toString(),
                "WT.shp_srch_people_action", wt.akuminaSearch.search.people.action.toString(),
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
                "WT.shp_srch_site", wt.spPageContextInfo.webAbsoluteUrl || "",
                "WT.dl", "SRCH"
            ];
            return resultData;
        },

        getEventData: function (eventType) {
            let data = [];
            if (wt.akuminaSearch.isSearchPage()) {
                if (eventType === "result") {
                    data.push(...wt.akuminaSearch.getResultClickData());
                    return data;
                }
                data.push(...wt.akuminaSearch.getSearchData());
                return data;
            }

            if (eventType === "result") {
                let search = wt.akuminaSearch.getSearchData();
                let result = wt.akuminaSearch.getResultClickData();
                data = [...search, ...result];
                return data;
            }

            data.push(...wt.akuminaSearch.getSearchData());
            return data;
        },

        timeSinceInit: function () {
            return Date.now() - wt.akuminaSearch.initTime;
        },

        /**
         * Checks if the IE browser is being used.
         * @returns {boolean} True if browser is IE. Otherwise false.
         */
        isIE: function () {
            const agent = window.navigator.userAgent;
            if (agent.indexOf("MSIE") >= 0 || agent.indexOf("Trident") >= 0) {
                return true;
            }
            return false;
        },

        /**
         * Checks if jQuery has been loaded.
         * @returns {boolean} True is jQuery is availble. Otherwise false.
         */
        isjQueryLoaded: function () {
            if (typeof jQuery !== "undefined") {
                return true;
            }
            console.error("Webtrends Akumina Search Plugin: jQuery is not loaded.");
            return false;
        },

        /**
         * Determines if the current URL is an Akumina search page.
         * @returns {boolean} True if a search page. Otherwise false.
         */
        isSearchPage: function () {
            const url = new URL(document.location);
            const pathname = url.pathname;
            const hash = url.hash;
            if (wt.akuminaSearch.searchPage && (pathname.includes(wt.akuminaSearch.searchPage) || hash.includes(wt.akuminaSearch.searchPage))) {
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
            console.log("WT - bindAkuminaEvents", wt.akuminaSearch.timeSinceInit());
            if (typeof Akumina !== "undefined" && !wt.akuminaSearch.akuminaEventsSubscribed) {
                Akumina.Digispace.AppPart.Eventing.Subscribe('/genericsearchlist/loaded/', function (data) {wt.akuminaSearch.handleGeneralSearchEvent(data);});
                Akumina.Digispace.AppPart.Eventing.Subscribe('/peopledirectory/searchcompleted/', function (data) {wt.akuminaSearch.handlePeopleSearchEvent(data);});
                // Akumina.Digispace.AppPart.Eventing.Subscribe('/loader/completed/', function (data) {wt.akuminaSearch.handleLoaderCompleteEvent(data);});
                // Akumina.Digispace.AppPart.Eventing.Subscribe('/dashboardcontainer/render/', function (data) {wt.akuminaSearch.handleDashboardRenderEvent(data);});
                wt.akuminaSearch.akuminaEventsSubscribed = true;
            }
        },

        /**
         * Adds event listeners on the Akumina search page
         */
        bindClickEvents: function () {
            console.log("WT - bindClickEvents", wt.akuminaSearch.timeSinceInit());
            if (!wt.akuminaSearch.isjQueryLoaded()) {
                return;
            }

            // Hash Change
            $(window).on("hashchange", function (event) {
                wt.akuminaSearch.handleHashChange(event);
            });

            // Result Clicks
            $(document).on("mousedown", ".ia-search-results a.ak-spalink", function () {
                wt.akuminaSearch.handleResultClick(this);
            });
            $(document).on("mousedown", ".ia-people-results a", function () {
                wt.akuminaSearch.handleResultClick(this);
            });
            $(document).on("mousedown", "#user-popup a", function () {
                wt.akuminaSearch.handleResultClick(this);
            });

            // Pagination
            $(document).on("mousedown", "div.showMoreResults a", function () {
                wt.akuminaSearch.handlePagination(this);
            });
            $(document).on("mousedown", "a.ak-search-paging-forwardbutton, a.ak-search-paging-backbutton", function () {
                wt.akuminaSearch.handlePagination(this);
            });

            // Refiners
            $(document).on("mousedown", ".ia-search-refiner-results-container a.ak-search-refiner", function () {
                wt.akuminaSearch.handleRefinement(this);
            });

            // Type Change
            $(document).on("mousedown", "nav.ia-transformer-tab-nav li", function () {
                wt.akuminaSearch.handleTypeChange(this);
            });

            // Search
            $(document).on("keydown", "#siteSearch", function (event) {
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
         * Clears values from search object that are no longer needed.
         */
        cleanupSearchObj: function () {            
            const search = wt.akuminaSearch.search;
            search.people.name = "";
            search.people.title = "";
            search.people.department = "";
            search.people.action = "";
            search.document.name = "";
            search.document.type = "";
            search.document.action = "";
        },

        resetFlags: function () {
            const search = wt.akuminaSearch.search;
            Object.keys(search.flags).forEach(function (key) {
                search.flags[key] = false;
            });
        },

        setFlag: function (event) {
            wt.akuminaSearch.resetFlags();
            wt.akuminaSearch.search.flags[event] = true;
        },

        handleHashChange: function (event) {
            if (!wt.akuminaSearch.isSearchPage()) {
                wt.akuminaSearch.search.count = 0;
                wt.akuminaSearch.search.isSearchPage = false;
            }
            console.log("WT - Hash Change. Search page =", wt.akuminaSearch.isSearchPage(), wt.akuminaSearch.timeSinceInit());
        },

        // handleLoaderCompleteEvent: function (data) {
        //     console.log("WT - Akumina Loader Complete Event:", data, wt.akuminaSearch.timeSinceInit());
        // },

        // handleDashboardRenderEvent: function (data) {
        //     console.log("WT - Akumina Dashboard Render Event:", data, wt.akuminaSearch.timeSinceInit());
        // },

        /**
         * Event handler for the Akumina /genericsearchlist/loaded/ event
         * @param {Object} data - Data object returned from the Akumina /genericsearchlist/loaded/ event
         */
        handleGeneralSearchEvent: function (data) {
            console.log("WT - Akumina General Search Event:", data, wt.akuminaSearch.timeSinceInit());
            wt.akuminaSearch.currentGeneralSearchData = data;

            // Grab the current search term from the Akumina data
            if (wt.akuminaSearch.currentGeneralSearchData.Term) {
                wt.akuminaSearch.search.term.current = wt.akuminaSearch.currentGeneralSearchData.Term;
            }

            const flag = wt.akuminaSearch.getActiveFlag();
            if (flag) {
                wt.akuminaSearch.resetFlags();
                switch (flag) {
                    case "search":
                        wt.akuminaSearch.incrementCount();
                        wt.akuminaSearch.setSearchData("Search");
                        wt.akuminaSearch.track();
                        break;
                    default:
                }
            }

            wt.akuminaSearch.attachListeners();
        },

        /**
         * Event handler for the Akumina /peopledirectory/searchcompleted/ event
         * @param {Object} data - Data object returned from the Akumina /peopledirectory/searchcompleted/ event
         */
        handlePeopleSearchEvent: function (data) {
            console.log("WT - Akumina People Search Event:", data, wt.akuminaSearch.timeSinceInit());
            wt.akuminaSearch.currentPeopleSearchData = data;
            wt.akuminaSearch.search.type = "People";
            wt.akuminaSearch.attachListeners();
        },

        /**
         * Event handler for search result clicks
         * @param {Object} el - DOM element that was clicked
         */
        handleResultClick: function (el) {
            console.log("WT - handleResultClick:", el, wt.akuminaSearch.timeSinceInit());
            if (wt.akuminaSearch.isSearchPage()) {
                wt.akuminaSearch.setSearchData("");
            }
            else {
                wt.akuminaSearch.setSearchData("Suggested Item");
            }
            wt.akuminaSearch.setResultClickData(el);
            wt.akuminaSearch.track("result");
        },

        /**
         * Event handler for pagination events
         */
        handlePagination: function (el) {
            console.log("WT - handlePagination", wt.akuminaSearch.timeSinceInit());
            wt.akuminaSearch.setSearchData("Pagination", el);
            wt.akuminaSearch.track();
        },

        /**
         * Event handler for refinement events
         * @param {Object} el - DOM element that was clicked
         */
        handleRefinement: function (el) {
            console.log("WT - handleRefinement:", el, wt.akuminaSearch.timeSinceInit());
            wt.akuminaSearch.setSearchData("Refinement", el);
            wt.akuminaSearch.track();
            wt.akuminaSearch.search.refiners = "";
        },

        /**
         * Event handler for type change events
         */
        handleTypeChange: function (el) {
            console.log("WT - handleTypeChange", wt.akuminaSearch.timeSinceInit());
            wt.akuminaSearch.incrementCount();
            wt.akuminaSearch.setSearchData("Type Change", el);
            wt.akuminaSearch.track();
        },

        /**
         * Event handler for search events
         */
        handleSearch: function () {
            console.log("WT - handleSearch", "Results div:", document.querySelector("div.ia-search-results"), wt.akuminaSearch.timeSinceInit());
            wt.akuminaSearch.setFlag("search");
            // wt.akuminaSearch.incrementCount();
            // wt.akuminaSearch.setSearchData("Search");
            // wt.akuminaSearch.track();
        },

        getActiveFlag: function () {
            let activeFlag;
            Object.keys(search.flags).forEach(function (key) {
                if (search.flags[key] === true) {
                    activeFlag = key;
                }
            });
            return activeFlag;
        },

        /**
         * Returns the filename portion of a URL
         * @param {Object} url - URL object
         * @returns {string} The filename from the url if it exists. Otherwise, empty string.
         */
        getFilename: function (url) {
            const filename = decodeURI(url.pathname).replace(/^.*[\\\/]/, '');
            return filename || "";
        },

        /**
         * Returns the link title
         * @param {Object} el - Dom element containing a link title
         * @returns {string} The link title if it exists. Otherwise, empty string.
         */
        getLinkTitle: function (el) {
            const title = el.textContent.trim();
            return title || "";
        },

        /**
         * Returns the text from the paging element on result pages
         * @returns {string} Text from the paging element
         */
        getPagingText: function () {
            const pagingDiv = document.querySelector("span.ak-search-paging-display");
            if (pagingDiv) {
                return pagingDiv.textContent.trim();
            }
            return "";
        },

        /**
         * Returns the total number of search results found in the paging text
         * @returns {string} Total number of results
         */
        getResultCount: function () {
            const pagingText = wt.akuminaSearch.getPagingText();
            const totalResults = pagingText ? pagingText.match(/of (\d+)/i).pop() : "";
            return totalResults;
        },

        /**
         * Returns the position of the first result on the current page
         * @returns {string} Position of first result
         */
        getFirstResultNum: function () {
            const pagingText = wt.akuminaSearch.getPagingText();
            const firstResult = pagingText ? pagingText.match(/^[^\d]+(\d+)/i).pop() : "";
            return firstResult;
        },

        /**
         * Returns the position of the last result on the current page
         * @returns {string} Position of last result
         */
        getLastResultNum: function () {
            const pagingText = wt.akuminaSearch.getPagingText();
            const lastResult = pagingText ? pagingText.match(/^[^-]+- (\d+)/i).pop() : "";
            return lastResult;
        },

        getPositionInList: function (el) {
            const li = el.closest("li");
            return $(li).index() + 1;
        },

        /**
         * Stores the current search term
         */
        setCurrentTerm: function () {
            const searchBox = document.querySelector("#siteSearch");
            const term = searchBox ? searchBox.value : "";
            wt.akuminaSearch.search.term.current = term;
            console.log("WT - setCurrentTerm complete:", wt.akuminaSearch.search.term.current, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Stores the original search term
         */
        setOriginalTerm: function () {
            const search = wt.akuminaSearch.search;
            search.term.original = search.term.original ? search.term.original : search.term.current;
            // if (search.action === "Suggested Item" || search.action === "Search") {
            //     search.term.original = search.term.original ? search.term.original : search.term.current;
            //     console.log("WT - setOriginalTerm complete:", wt.akuminaSearch.search.term.original, wt.akuminaSearch.timeSinceInit());
            //     return;
            // }

            const SEARCH_TERM_PARAM = "term";
            const url = new URL(document.location);
            const queryStr = url.search;
            const hash = url.hash;
            const regex = new RegExp(`${SEARCH_TERM_PARAM}=([^&]+)`, "i");
            // let term = "";

            // Read "term" param from query string, which may actually be part of the hash
            if (queryStr && queryStr.toLowerCase().includes(`${SEARCH_TERM_PARAM}=`)) {
                // term = queryStr.match(regex)[1];
                wt.akuminaSearch.search.term.original = queryStr.match(regex)[1];
            }
            else if (hash && hash.toLowerCase().includes(`${SEARCH_TERM_PARAM}=`)) {
                // term = hash.match(regex)[1];
                wt.akuminaSearch.search.term.original = hash.match(regex)[1];
            }
            // wt.akuminaSearch.search.term.original = term;
            console.log("WT - setOriginalTerm complete:", wt.akuminaSearch.search.term.original, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Stores the total number of search results
         */
        setResultCount: function () {
            // wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                if (wt.akuminaSearch.currentPeopleSearchData && wt.akuminaSearch.currentPeopleSearchData.searchResults.length === 0) {
                    wt.akuminaSearch.search.results.count = 0;
                }
                else {
                    wt.akuminaSearch.search.results.count = 1;
                }
            }
            // The number of results after a type change isn't known when the button is clicked
            else if (wt.akuminaSearch.search.action === "Type Change") {
                wt.akuminaSearch.search.results.count = "";
            }
            else {
                const resultsDiv = document.querySelector("div.ia-search-results");
                if (resultsDiv && resultsDiv.textContent.includes("No results")) {
                    wt.akuminaSearch.search.results.count = 0;
                }
                else {
                    wt.akuminaSearch.search.results.count = wt.akuminaSearch.getResultCount();
                }
            }
            console.log("WT - setResultCount complete:", wt.akuminaSearch.search.results.count, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Stores the refinement that was performed
         * @param {Object} el - DOM element for refiner that was clicked
         */
        setRefiners: function (el) {
            if (el) {
                const refineType = el.textContent;
                const refineValue = el.dataset.name;
                if (refineType && refineValue) {
                    wt.akuminaSearch.search.refiners = `${refineType}:${refineValue}`;
                }
            }
            else {
                wt.akuminaSearch.search.refiners = "";
            }
            console.log("WT - setRefiners complete:", wt.akuminaSearch.search.refiners, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Stores the search action type
         * @param {string} eventType - The type of search event that occurred
         */
        setAction: function (eventType) {
            wt.akuminaSearch.search.action = eventType ? eventType : "";
            console.log("WT - setAction complete:", wt.akuminaSearch.search.action, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Stores the current search result page number
         */
        setResultPage: function (el) {
            // wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.search.results.pagination = 1;
            }
            else {
                const firstResultNum = wt.akuminaSearch.getFirstResultNum();
                const lastResultNum = wt.akuminaSearch.getLastResultNum();
                let perPage = lastResultNum - firstResultNum + 1;
                // The perPage calculation can be wrong on the last results page.
                // If we already have a perPage value that is larger, use it instead.
                perPage = wt.akuminaSearch.search.results.perPage > perPage ? wt.akuminaSearch.search.results.perPage : perPage;
                const previousPages = Math.trunc(firstResultNum / perPage);
                // wt.akuminaSearch.search.results.pagination = previousPages + 1;
                const currentPage = previousPages + 1;
                const nextPage = currentPage + 1;

                if (el && el.className.includes("forwardbutton")) {
                    wt.akuminaSearch.search.results.pagination = nextPage;
                }
                else if (el && el.className.includes("backbutton")) {
                    wt.akuminaSearch.search.results.pagination = previousPages;
                }
                else {
                    wt.akuminaSearch.search.results.pagination = currentPage;
                }

                wt.akuminaSearch.search.results.perPage = perPage;
            }
            console.log("WT - setResultPage complete:", wt.akuminaSearch.search.results.pagination, wt.akuminaSearch.timeSinceInit());
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
         * @param {Object} el - The DOM element that was clicked.
         */
        setSearchType: function (el) {
            // This will capture the tab that was just clicked
            if (el) {
                wt.akuminaSearch.search.type = el.textContent.trim();
                console.log("WT - setSearchType complete:", wt.akuminaSearch.search.type, wt.akuminaSearch.timeSinceInit());
                return;
            }

            // This will capture the currently active tab
            const searchNav = document.querySelector("nav.ia-transformer-tab-nav");
            if (searchNav) {
                const selectedTab = searchNav.querySelector("li[class*='active']");
                const searchType = selectedTab.querySelector("a").textContent || "";
                wt.akuminaSearch.search.type = searchType;
            }
            else {
                wt.akuminaSearch.search.type = "";
            }
            console.log("WT - setSearchType complete:", wt.akuminaSearch.search.type, wt.akuminaSearch.timeSinceInit());
        },

        setDocInfo: function (filename) {
            wt.akuminaSearch.search.document.action = "Open";   // Currently always Open
            wt.akuminaSearch.search.document.name = filename;
            wt.akuminaSearch.search.document.type = filename.split('.').pop();
        },

        /**
         * Stores the result item, either the link title or filename
         * @param {Object} el - DOM element of result that was clicked
         */
        setItem: function (el) {
            // wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.setPeopledata(el);
                wt.akuminaSearch.search.resultItem.item = wt.akuminaSearch.search.people.name;
            }
            else {
                const plugin = window.wt_sp_globals.pluginObj;
                const url = new URL(el.href);
                const isDoc = plugin.isDoc(url.href, plugin.types);
                // wt.akuminaSearch.search.resultItem.item = plugin.isDoc(url.href, plugin.types) ? wt.akuminaSearch.getFilename(url) : wt.akuminaSearch.getLinkTitle(el);
                if (isDoc) {
                    const filename = wt.akuminaSearch.getFilename(url);
                    wt.akuminaSearch.search.resultItem.item = filename;
                    wt.akuminaSearch.setDocInfo(filename);
                }
                else {
                    wt.akuminaSearch.search.resultItem.item = wt.akuminaSearch.getLinkTitle(el);
                }
            }
            console.log("WT - setItem complete:", wt.akuminaSearch.search.resultItem.item, wt.akuminaSearch.timeSinceInit());
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
            // wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.search.resultItem.type = "People";
            }
            else {
                const plugin = window.wt_sp_globals.pluginObj;
                const url = new URL(el.href);
                wt.akuminaSearch.search.resultItem.type = plugin.isDoc(url.href, plugin.types) ? "Document" : "URL";
            }
            console.log("WT - setItemType complete:", wt.akuminaSearch.search.resultItem.type, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Stores the position of the result that was clicked
         * @param {Object} el - DOM element of result that was clicked
         */
        setPosition: function (el) {
            // wt.akuminaSearch.setSearchType();
            if (wt.akuminaSearch.search.type === "People") {
                const row = el.closest("tr");
                const profile = el.closest("div.ia-profile-container");
                if (row) {
                    wt.akuminaSearch.search.resultItem.position = Number(row.querySelector("[data-id]").dataset.id) + 1 || "";
                }
                else if (profile) {
                    wt.akuminaSearch.search.resultItem.position = Number(profile.querySelector("[data-id]").dataset.id) + 1 || "";
                }
            }
            else {
                wt.akuminaSearch.setResultPage();
                const perPage = wt.akuminaSearch.search.results.perPage;
                const previousPages = wt.akuminaSearch.search.results.pagination - 1;
                //const list = document.querySelector("div.ia-search-results ul");
                // wt.akuminaSearch.search.resultItem.position = (previousPages * perPage) + wt.akuminaSearch.countListItems(list) || "";
                wt.akuminaSearch.search.resultItem.position = (previousPages * perPage) + wt.akuminaSearch.getPositionInList(el) || "";
            }
            console.log("WT - setPosition complete:", wt.akuminaSearch.search.resultItem.position, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Determines the type of element clicked in the People results
         * @param {Object} el DOM element of result that was clicked
         */
        setPeopleAction: function (el) {
            if (el.className.includes("ia-profile-detail-link")) {
                wt.akuminaSearch.search.people.action = "Details";
                console.log("WT - Details Click", wt.akuminaSearch.timeSinceInit());
                return;
            }
            if (el.href.includes("tel:")) {
                wt.akuminaSearch.search.people.action = "Call";
                console.log("WT - Call Click", wt.akuminaSearch.timeSinceInit());
                return;
            }
            if (el.href.includes("mailto:")) {
                wt.akuminaSearch.search.people.action = "Email";
                console.log("WT - Email Click", wt.akuminaSearch.timeSinceInit());
                return;
            }
            if (el.className.includes("ia-ms-team-icon")) {
                wt.akuminaSearch.search.people.action = "Teams";
                console.log("WT - Teams Click", wt.akuminaSearch.timeSinceInit());
                return;
            }
            if (el.className.includes("enc-emp-link")) {
                wt.akuminaSearch.search.people.action = "View Full Profile";
                console.log("WT - View Full Profile", wt.akuminaSearch.timeSinceInit());
                return;
            }
        },

        /**
         * Stores details about the People result that was clicked
         * @param {Object} el - DOM element of result that was clicked
         */
        setPeopledata: function (el) {
            const modal = el.closest("#user-popup");
            const row = el.closest("tr");
            
            if (modal) {
                wt.akuminaSearch.search.people.name = modal.querySelector(".ia-profile-name").textContent.trim();
                wt.akuminaSearch.search.people.title = modal.querySelector(".ia-profile-title").textContent.trim();
                wt.akuminaSearch.search.people.department = modal.querySelector(".ia-profile-full > p").textContent.replace("Department:", "").trim();
            }

            // const modal = el.closest("div.ia-profile-container");
            // const row = el.closest("tr");
            
            // if (modal) {
            //     wt.akuminaSearch.search.people.name = modal.querySelector(".ia-profile-name").textContent.trim();
            //     wt.akuminaSearch.search.people.title = modal.querySelector(".ia-profile-title").textContent.trim();
            //     wt.akuminaSearch.search.people.department = modal.querySelector(".ia-profile-dept").textContent.replace("Department:", "").trim();
            // }
            else if (row) {
                wt.akuminaSearch.search.people.name = row.querySelector("a.ia-profile-detail-link").textContent.trim();
            }

            wt.akuminaSearch.setPeopleAction(el);

            console.log("WT - setPeopledata complete:", wt.akuminaSearch.search.people.name, wt.akuminaSearch.search.people.title, wt.akuminaSearch.search.people.department, wt.akuminaSearch.timeSinceInit());
        },

        /**
         * Stores all information collected for search events
         * @param {string} eventType - The type of search event that occurred
         * @param {Object} el - DOM element of the search component that was clicked
         */
        setSearchData: function (eventType, el) {
            console.log("WT - setSearchData started", wt.akuminaSearch.timeSinceInit());
            // The order of these function calls matters, as some expect current data to already be set.
            wt.akuminaSearch.setSearchType(el);
            wt.akuminaSearch.setAction(eventType);
            wt.akuminaSearch.setScope();
            wt.akuminaSearch.setResultCount();
            wt.akuminaSearch.setCurrentTerm();
            wt.akuminaSearch.setOriginalTerm();
            wt.akuminaSearch.setRefiners(el);
            wt.akuminaSearch.setResultPage(el);

            console.log("WT - setSearchData finished:", wt.akuminaSearch.getSearchData(), wt.akuminaSearch.timeSinceInit());
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

            console.log("WT - setResultClickData finished:", wt.akuminaSearch.getResultClickData(), wt.akuminaSearch.timeSinceInit());
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
            // TODO: Verify if this function is needed anymore
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
            // let data = [];
            // if (wt.akuminaSearch.isSearchPage()) {
            //     if (eventType === "result") {
            //         data.push(...wt.akuminaSearch.getResultClickData());
            //     }
            //     else {
            //         data.push(...wt.akuminaSearch.getSearchData());
            //     }
            // }
            // else {
            //     if (eventType === "result") {
            //         let search = wt.akuminaSearch.getSearchData();
            //         let result = wt.akuminaSearch.getResultClickData();
            //         // data = [...new Set([...search, ...result])];
            //         data = [...search, ...result];
            //     }
            //     else {
            //         data.push(...wt.akuminaSearch.getSearchData());
            //     }
            // }
    
            console.log("WT - transform:", wt.akuminaSearch.getEventData(eventType), wt.akuminaSearch.timeSinceInit());

            // TODO: Sort this out. Temporarily firing multitrack for testing purposes.
            const plugin = window.wt_sp_globals.pluginObj;
            plugin.tagObj.addTransform(function (dcsObject, multiTrackObject) {
                multiTrackObject.argsa.push(wt.akuminaSearch.getEventData(eventType));
            }, "multitrack");
        },

        /**
         * Sends a multiTrack event containing the search data
         * @param {string} eventType - The type of search event that occurred
         */
        track: function (eventType) {
            console.log("WT - track:", wt.akuminaSearch.getEventData(eventType), wt.akuminaSearch.timeSinceInit());

            const plugin = window.wt_sp_globals.pluginObj;
            Webtrends.multiTrack({
                argsa: wt.akuminaSearch.getEventData(eventType),
                finish: function (dcsObject, multiTrackObject) {
                    plugin.finishCleanup(dcsObject, multiTrackObject);
                    wt.akuminaSearch.cleanupSearchObj();
                }
            });
        },

        /**
         * Attaches listeners on search page and adds search data to the page load event
         */
        searchTracking: function () {
                console.log("WT - searchTracking page loaded", wt.akuminaSearch.timeSinceInit());

                wt.akuminaSearch.bindAkuminaEvents();

                if (wt.akuminaSearch.isSearchPage()) {
                    wt.akuminaSearch.setSearchData("Search");
                    wt.akuminaSearch.incrementCount();
                    wt.akuminaSearch.attachListeners();

                    // Track search page load
                    console.log("WT - searchTracking transform:", wt.akuminaSearch.getSearchData(), wt.akuminaSearch.timeSinceInit());
                    // const plugin = window.wt_sp_globals.pluginObj;
                    // plugin.tagObj.addTransform(function (dcsObject, multiTrackObject) {
                    //     multiTrackObject.argsa.push(wt.akuminaSearch.getSearchData());
                    // }, "collect");

                    wt.akuminaSearch.track();
                }
        }
    }
})(window.document);

Webtrends.registerPlugin("akuminaSearch", window.wt_sp_globals.akuminaSearch.init);