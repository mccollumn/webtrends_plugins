/**
 * This plugin captures interactions with Akumina search.
 * It works in conjunction with the standard SharePoint tracking.
 * 
 * Usage:
 *  See external documentation.
 * 
 * Notes:
 *  Internet Explorer is not supported.
 * 
 * Example of plugin options:
 *  async: false,
 *  waitForCallback: true,
 *  timeout: 7500,
 *  searchPage: "akuminasearch.aspx"
 * 
 * @author      Nick M.
 * @version     0.9.15
 */

// Limitations:
// Don't know number of results or page number for People
// Passing oss_r = 1 for successful search. Page num is always 1.

// Results perPage, used to calculate the page number, can potentially be inaccurate if user is on the last page.


(function (document, undefined) {
    const SEARCH_BOX = typeof Akumina !== "undefined" ? Akumina.Digispace.ConfigurationContext.SearchBox : "#siteSearch";
    const SEARCH_BUTTON = typeof Akumina !== "undefined" ? Akumina.Digispace.ConfigurationContext.SearchButton : ".ia-search-combo .ia-search-site-btn";
    const GENERAL_RESULT_LINKS = ".ia-search-results a.ak-spalink";
    const PEOPLE_RESULT_LINKS = ".ia-people-results a.ia-profile-detail-link, .ia-contact-links a";
    const PEOPLE_POPUP_LINKS = "#user-popup a";
    const PAGINATION_SHOW_MORE = "div.showMoreResults a";
    const PAGINATION_BUTTONS = "a.ak-search-paging-forwardbutton, a.ak-search-paging-backbutton";
    const REFINER_LINKS = ".ia-search-refiner-results-container a.ak-search-refiner, .ia-people-filters li";
    const SEARCH_TYPES = "nav.ia-transformer-tab-nav li";
    
    let wt;
    window.wt_sp_globals.akuminaSearch = {
        listenersAttached: false,
        akuminaEventsSubscribed: false,

        init: function (dcs, options) {
            const waitForSpPlugin = setInterval(function () {
                if (window.wt_sp_globals) {
                    clearInterval(waitForSpPlugin);
                    wt = window.wt_sp_globals;

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
                    wt.akuminaSearch.initTime = Date.now();
                    wt.akuminaSearch.log("init");
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
            return [
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
        },

        /**
         * Array of result click data
         * @returns {Array} Parameter-value pairs sent with result clicks
         */
        getResultClickData: function () {
            return [
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
                "WT.ti", wt.akuminaSearch.search.resultItem.item || "Search Results",
                "WT.dl", "SRCH"
            ];
        },

        /**
         * Determines what data needs to be tracked based on the type of search event.
         * @param {String} eventType The type of search event that occurred.
         * @returns {Array} Data that will be included in the search event.
         */
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

        /**
         * Returns the time in milliseconds since the plugin initialized.
         * @returns {Number} Time in milliseconds.
         */
        timeSinceInit: function () {
            return Date.now() - wt.akuminaSearch.initTime;
        },

        /**
         * Outputs information to the console for debugging purposes.
         * @param {String} message Text to be included in the logging.
         * @param {*} data Any additional data to output.
         */
        log: function (message, data = "") {
            if (wt.akuminaSearch.logging) {
                console.log(`WT - Akumina Search - ${message}`, data, wt.akuminaSearch.timeSinceInit());
            }
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
         * Returns true if the provided path is to a document. Otherwise false.
         * @param {String} path The document path.
         * @param {Array} types Array of document file extensions.
         * @returns 
         */
        isDoc: function (path, types) {
            const extension = path.toLowerCase().substring(path.lastIndexOf(".") + 1).trim();
            if (types.includes(extension)) {
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
            wt.akuminaSearch.logging = options.logging || false;
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
            wt.akuminaSearch.log("bindAkuminaEvents");
            if (typeof Akumina !== "undefined" && !wt.akuminaSearch.akuminaEventsSubscribed) {
                Akumina.Digispace.AppPart.Eventing.Subscribe('/genericsearchlist/loaded/', function (data) {wt.akuminaSearch.handleGeneralSearchEvent(data);});
                Akumina.Digispace.AppPart.Eventing.Subscribe('/peopledirectory/searchcompleted/', function (data) {wt.akuminaSearch.handlePeopleSearchEvent(data);});
                Akumina.Digispace.AppPart.Eventing.Subscribe('/widget/loaded/', function (data) {wt.akuminaSearch.handleWidgetLoadedEvent(data);});
                wt.akuminaSearch.akuminaEventsSubscribed = true;
            }
        },

        /**
         * Adds event listeners on the Akumina search page
         */
        bindClickEvents: function () {
            wt.akuminaSearch.log("bindClickEvents");
            if (!wt.akuminaSearch.isjQueryLoaded()) return;

            // Hash Change
            $(window).on("hashchange", function (event) {
                wt.akuminaSearch.handleHashChange(event);
            });

            // Result Clicks
            $(document).on("mousedown", GENERAL_RESULT_LINKS, function () {
                wt.akuminaSearch.handleResultClick(this);
            });
            $(document).on("mousedown", PEOPLE_RESULT_LINKS, function () {
                wt.akuminaSearch.handleResultClick(this);
            });
            $(document).on("mousedown", PEOPLE_POPUP_LINKS, function () {
                wt.akuminaSearch.handleResultClick(this);
            });

            // Pagination
            $(document).on("mousedown", PAGINATION_SHOW_MORE, function () {
                wt.akuminaSearch.handlePagination(this);
            });
            $(document).on("mousedown", PAGINATION_BUTTONS, function () {
                wt.akuminaSearch.handlePagination(this);
            });

            // Refiners
            $(document).on("mousedown", REFINER_LINKS, function () {
                wt.akuminaSearch.handleRefinement(this);
            });

            // Type Change
            $(document).on("mousedown", SEARCH_TYPES, function () {
                wt.akuminaSearch.handleTypeChange(this);
            });

            // Search
            $(document).on("keydown", SEARCH_BOX, function (event) {
                if (event.keyCode === 13) {
                    wt.akuminaSearch.handleSearch();
                }
            });
            // $(document).on("mousedown", SEARCH_BUTTON, function () {
            //     wt.akuminaSearch.handleSearch();
            // });

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

        /**
         * Resets all search flags to false.
         */
        resetFlags: function () {
            const search = wt.akuminaSearch.search;
            Object.keys(search.flags).forEach(function (key) {
                search.flags[key] = false;
            });
        },

        /**
         * Sets the specified flag to true.
         * @param {String} event Name of flag to set.
         */
        setFlag: function (event) {
            wt.akuminaSearch.log("setFlag", event);
            wt.akuminaSearch.resetFlags();
            wt.akuminaSearch.search.flags[event] = true;
        },

        /**
         * Takes the appropriate actions based on the currently active search flag.
         */
        processFlag: function () {
            const flag = wt.akuminaSearch.getActiveFlag();
            if (!flag) return;
            wt.akuminaSearch.resetFlags();
            switch (flag) {
                case "search":
                    wt.akuminaSearch.waitForResults(function () {
                        wt.akuminaSearch.incrementCount();
                        wt.akuminaSearch.setSearchData("Search");
                        wt.akuminaSearch.track();
                    });
                    break;
                case "refine":
                    wt.akuminaSearch.setResultCount();
                    wt.akuminaSearch.track();
                    wt.akuminaSearch.search.refiners = "";
                    break;
                case "type":
                    wt.akuminaSearch.setResultCount();
                    wt.akuminaSearch.track();
                    break;
                default:
            }
        },

        /**
         * Waits for the search results to finish loading or 5 seconds, whichever occurs first.
         * @param {Function} callback Function to run when done waiting.
         */
        waitForResults: function (callback) {
            wt.akuminaSearch.log("waitForResults");
            const widgetEl = document.querySelector("div.ak-widget");
            const widgetObserver = new MutationObserver(function (mutations) {
                const mutation = mutations.find(({ target }) => target.className.includes("ak-widget"));
                if (!mutation) return;
                for (const node of mutation.addedNodes) {
                    if (node.classList && node.classList.contains("ia-search-tiles")) {
                        widgetObserver.disconnect();
                        callback();
                        return;
                    }
                }
            });
            widgetObserver.observe(widgetEl, {characterData: false, attributes: false, childList: true, subtree: true});

            // Stop waiting after 5 seconds
            setTimeout(function () {
                widgetObserver.disconnect();
                callback();
                return;
            }, 5000);
        },

        /**
         * Event handler for hash changes.
         * @param {Object} event Data received from the hash change event.
         */
        handleHashChange: function (event) {
            if (!wt.akuminaSearch.isSearchPage()) {
                wt.akuminaSearch.search.count = 0;
                wt.akuminaSearch.search.term.original = "";
                wt.akuminaSearch.search.isSearchPage = false;
            }
            wt.akuminaSearch.log("Hash Change. Search page =", wt.akuminaSearch.isSearchPage());
        },

        /**
         * Event handler for the Akumina /widget/loaded/ event.
         * The event is primarily used to signal when the search page is done loading.
         * @param {Object} data Data object returned from the Akumina /widget/loaded/ event.
         */
        handleWidgetLoadedEvent: function (data) {
            wt.akuminaSearch.log("Akumina Widget Loaded Event:", data);

            if (!data) {
                return;
            }
            wt.akuminaSearch.currentWidgetLoadedData = data;

            if (data.properties.widgetname === "GenericSearchListWidget") {
                wt.akuminaSearch.processFlag();
            }
            // handlePeopleSearchEvent() should catch this, but including here as a fall back
            if (data.properties.widgetname === "PeopleDirectoryWidget") {
                wt.akuminaSearch.processFlag();
            }

            wt.akuminaSearch.attachListeners();
        },

        /**
         * Event handler for the Akumina /genericsearchlist/loaded/ event
         * @param {Object} data - Data object returned from the Akumina /genericsearchlist/loaded/ event
         */
        handleGeneralSearchEvent: function (data) {
            wt.akuminaSearch.log("Akumina General Search Event:", data);

            if (!data) {
                return;
            }

            wt.akuminaSearch.currentGeneralSearchData = data;

            // Grab the current search term from the Akumina data
            if (wt.akuminaSearch.currentGeneralSearchData && wt.akuminaSearch.currentGeneralSearchData.Term) {
                wt.akuminaSearch.search.term.current = wt.akuminaSearch.currentGeneralSearchData.Term;
            }

            wt.akuminaSearch.attachListeners();
        },

        /**
         * Event handler for the Akumina /peopledirectory/searchcompleted/ event
         * @param {Object} data - Data object returned from the Akumina /peopledirectory/searchcompleted/ event
         */
        handlePeopleSearchEvent: function (data) {
            if (!data) return;

            wt.akuminaSearch.log("Akumina People Search Event:", data);
            wt.akuminaSearch.currentPeopleSearchData = data;
            wt.akuminaSearch.search.type = "People";

            if (data.caller === "search" || data.caller === "facets") {
                wt.akuminaSearch.processFlag();
            }

            wt.akuminaSearch.attachListeners();
        },

        /**
         * Event handler for search result clicks
         * @param {Object} el - DOM element that was clicked
         */
        handleResultClick: function (el) {
            wt.akuminaSearch.log("handleResultClick:", el);
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
            wt.akuminaSearch.log("handlePagination");
            wt.akuminaSearch.setSearchData("Pagination", el);
            wt.akuminaSearch.track();
        },

        /**
         * Event handler for refinement events
         * @param {Object} el - DOM element that was clicked
         */
        handleRefinement: function (el) {
            wt.akuminaSearch.log("handleRefinement:", el);
            wt.akuminaSearch.setSearchData("Refinement", el);
            wt.akuminaSearch.setFlag("refine");
        },

        /**
         * Event handler for type change events
         */
        handleTypeChange: function (el) {
            wt.akuminaSearch.log("handleTypeChange");
            wt.akuminaSearch.incrementCount();
            wt.akuminaSearch.setSearchData("Type Change", el);
            wt.akuminaSearch.setFlag("type");
        },

        /**
         * Event handler for search events
         */
        handleSearch: function () {
            wt.akuminaSearch.log("handleSearch");
            wt.akuminaSearch.setFlag("search");
        },

        /**
         * Gets the currently active search flag.
         * @returns {String} The currently active search flag.
         */
        getActiveFlag: function () {
            const search = wt.akuminaSearch.search;
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

        /**
         * Returns the position of a list item within a list.
         * @param {Object} el DOM element of the list item.
         * @returns {Number} The position of the element in the list.
         */
        getPositionInList: function (el) {
            const li = el.closest("li");
            return $(li).index() + 1;
        },

        /**
         * Stores the current search term
         */
        setCurrentTerm: function () {
            // Get search term from the Akumina object
            let term = Akumina.Digispace.PageContext.SearchContext ? Akumina.Digispace.PageContext.SearchContext.Term : "";

            // Fall back to looking for the term in search box
            if (!term) {
                const searchBox = document.querySelector(SEARCH_BOX);
                term = searchBox ? searchBox.value : "";
            }
            wt.akuminaSearch.search.term.current = term;
            wt.akuminaSearch.log("setCurrentTerm complete:", wt.akuminaSearch.search.term.current);
        },

        /**
         * Stores the original search term
         */
        setOriginalTerm: function () {
            const search = wt.akuminaSearch.search;
            search.term.original = search.term.original ? search.term.original : search.term.current;

            const SEARCH_TERM_PARAM = "term";
            const url = new URL(document.location);
            const queryStr = url.search;
            const hash = url.hash;
            const regex = new RegExp(`${SEARCH_TERM_PARAM}=([^&]+)`, "i");

            // Read "term" param from query string, which may actually be part of the hash
            if (queryStr && queryStr.toLowerCase().includes(`${SEARCH_TERM_PARAM}=`)) {
                wt.akuminaSearch.search.term.original = queryStr.match(regex)[1];
            }
            else if (hash && hash.toLowerCase().includes(`${SEARCH_TERM_PARAM}=`)) {
                wt.akuminaSearch.search.term.original = hash.match(regex)[1];
            }
            wt.akuminaSearch.log("setOriginalTerm complete:", wt.akuminaSearch.search.term.original);
        },

        /**
         * Stores the total number of search results
         */
        setResultCount: function () {
            // If this is a people search then just check whether there were any results.
            if (wt.akuminaSearch.search.type === "People") {
                if (wt.akuminaSearch.currentPeopleSearchData && wt.akuminaSearch.currentPeopleSearchData.searchResults.length === 0) {
                    wt.akuminaSearch.search.results.count = 0;
                }
                else {
                    wt.akuminaSearch.search.results.count = 1;
                }
            }

            // Determine number of results by parsing text at the bottom of the search results.
            else {
                const resultsDiv = document.querySelector("div.ia-search-results");
                if (resultsDiv && resultsDiv.textContent.includes("No results")) {
                    wt.akuminaSearch.search.results.count = 0;
                }
                else {
                    wt.akuminaSearch.search.results.count = wt.akuminaSearch.getResultCount();
                }
            }
            wt.akuminaSearch.log("setResultCount complete:", wt.akuminaSearch.search.results.count);
        },

        /**
         * Stores the refinement that was performed
         * @param {Object} el - DOM element for refiner that was clicked
         */
        setRefiners: function (el) {
            if (!el) {
                wt.akuminaSearch.search.refiners = "";
                return;
            }

            let refineType;
            let refineValue;
            if (wt.akuminaSearch.search.type === "People") {
                const section = el.closest(".ia-people-filter");
                refineType = section.querySelector(".ia-people-filter-header").textContent || "";
                refineValue = el.innerText || "";
            }
            else {
                refineType = el.textContent || "";
                refineValue = el.dataset.name || "";
            }
            if (refineType && refineValue) {
                wt.akuminaSearch.search.refiners = `${refineType}:${refineValue}`;
            }
            wt.akuminaSearch.log("setRefiners complete:", wt.akuminaSearch.search.refiners);
        },

        /**
         * Stores the search action type
         * @param {string} eventType - The type of search event that occurred
         */
        setAction: function (eventType) {
            wt.akuminaSearch.search.action = eventType ? eventType : "";
            wt.akuminaSearch.log("setAction complete:", wt.akuminaSearch.search.action);
        },

        /**
         * Stores the current search result page number
         */
        setResultPage: function (el) {
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.search.results.pagination = 1;
            }
            else {
                const firstResultNum = wt.akuminaSearch.getFirstResultNum();

                let perPage;
                // This will provide the most reliable number of results per page, so use it if it's available.
                if (wt.akuminaSearch.currentWidgetLoadedData && wt.akuminaSearch.currentWidgetLoadedData.pageSize) {
                    perPage = wt.akuminaSearch.currentWidgetLoadedData.pageSize;
                }
                // Calculate results per page by parsing the text at the bottom of the search results page.
                else {
                    const lastResultNum = wt.akuminaSearch.getLastResultNum();
                    perPage = lastResultNum - firstResultNum + 1;
                    // The perPage calculation can be wrong on the last results page.
                    // If we already have a perPage value that is larger, use it instead.
                    perPage = wt.akuminaSearch.search.results.perPage > perPage ? wt.akuminaSearch.search.results.perPage : perPage;
                }

                const previousPages = Math.trunc(firstResultNum / perPage);
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
            wt.akuminaSearch.log("setResultPage complete:", wt.akuminaSearch.search.results.pagination);
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
            if (el && el.closest("li[role='tab']")) {
                wt.akuminaSearch.search.type = el.textContent.trim();
                wt.akuminaSearch.log("setSearchType complete:", wt.akuminaSearch.search.type);
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
            wt.akuminaSearch.log("setSearchType complete:", wt.akuminaSearch.search.type);
        },

        /**
         * Stores document information based on the filename.
         * @param {String} filename A filename including the extension.
         */
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
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.setPeopledata(el);
                wt.akuminaSearch.search.resultItem.item = wt.akuminaSearch.search.people.name;
            }
            else {
                const plugin = window.wt_sp_globals.pluginObj;
                const url = new URL(el.href);
                const isDoc = wt.akuminaSearch.isDoc(url.pathname, plugin.types);
                if (isDoc) {
                    const filename = wt.akuminaSearch.getFilename(url);
                    wt.akuminaSearch.search.resultItem.item = filename;
                    wt.akuminaSearch.setDocInfo(filename);
                }
                else {
                    wt.akuminaSearch.search.resultItem.item = wt.akuminaSearch.getLinkTitle(el);
                }
            }
            wt.akuminaSearch.log("setItem complete:", wt.akuminaSearch.search.resultItem.item);
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
            if (wt.akuminaSearch.search.type === "People") {
                wt.akuminaSearch.search.resultItem.type = "People";
            }
            else {
                const plugin = window.wt_sp_globals.pluginObj;
                const url = new URL(el.href);
                wt.akuminaSearch.search.resultItem.type = wt.akuminaSearch.isDoc(url.pathname, plugin.types) ? "Document" : "URL";
            }
            wt.akuminaSearch.log("setItemType complete:", wt.akuminaSearch.search.resultItem.type);
        },

        /**
         * Stores the position of the result that was clicked
         * @param {Object} el - DOM element of result that was clicked
         */
        setPosition: function (el) {
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
                wt.akuminaSearch.search.resultItem.position = (previousPages * perPage) + wt.akuminaSearch.getPositionInList(el) || "";
            }
            wt.akuminaSearch.log("setPosition complete:", wt.akuminaSearch.search.resultItem.position);
        },

        /**
         * Determines the type of element clicked in the People results
         * @param {Object} el DOM element of result that was clicked
         */
        setPeopleAction: function (el) {
            if (el.className.includes("ia-profile-detail-link")) {
                wt.akuminaSearch.search.people.action = "Details";
                wt.akuminaSearch.log("Details Click");
                return;
            }
            if (el.href.includes("tel:")) {
                wt.akuminaSearch.search.people.action = "Call";
                wt.akuminaSearch.log("Call Click");
                return;
            }
            if (el.href.includes("mailto:")) {
                wt.akuminaSearch.search.people.action = "Email";
                wt.akuminaSearch.log("Email Click");
                return;
            }
            if (el.className.includes("ia-ms-team-icon")) {
                wt.akuminaSearch.search.people.action = "Teams";
                wt.akuminaSearch.log("Teams Click");
                return;
            }
            if (el.className.includes("enc-emp-link")) {
                wt.akuminaSearch.search.people.action = "View Full Profile";
                wt.akuminaSearch.log("View Full Profile");
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
            else if (row) {
                wt.akuminaSearch.search.people.name = row.querySelector("a.ia-profile-detail-link").textContent.trim();
            }

            wt.akuminaSearch.setPeopleAction(el);
            wt.akuminaSearch.log("setPeopledata complete:", wt.akuminaSearch.search.people.name + " - " + wt.akuminaSearch.search.people.title + " - " + wt.akuminaSearch.search.people.department);
        },

        /**
         * Stores all information collected for search events
         * @param {string} eventType - The type of search event that occurred
         * @param {Object} el - DOM element of the search component that was clicked
         */
        setSearchData: function (eventType, el) {
            wt.akuminaSearch.log("setSearchData started");
            // The order of these function calls matters, as some expect current data to already be set.
            wt.akuminaSearch.setSearchType(el);
            wt.akuminaSearch.setAction(eventType);
            wt.akuminaSearch.setScope();
            wt.akuminaSearch.setResultCount();
            wt.akuminaSearch.setCurrentTerm();
            wt.akuminaSearch.setOriginalTerm();
            wt.akuminaSearch.setRefiners(el);
            wt.akuminaSearch.setResultPage(el);

            wt.akuminaSearch.log("setSearchData finished:", wt.akuminaSearch.getSearchData());
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

            wt.akuminaSearch.log("setResultClickData finished:", wt.akuminaSearch.getResultClickData());
        },

        /**
         * Increments the number of search events
         */
        incrementCount: function () {
            wt.akuminaSearch.search.count++;
        },

        /**
         * Adds a transform containing the search information to be added to the click event
         * @param {string} eventType - The type of search event that occurred
         */
        transform: function (eventType) {
            wt.akuminaSearch.log("transform:", wt.akuminaSearch.getEventData(eventType));

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
            wt.akuminaSearch.log("track:", wt.akuminaSearch.getEventData(eventType));

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
                wt.akuminaSearch.log("searchTracking start");
                wt.akuminaSearch.bindAkuminaEvents();

                // If we're already on a search page then go ahead and send a search event now.
                if (wt.akuminaSearch.isSearchPage()) {
                    wt.akuminaSearch.setSearchData("Search");
                    wt.akuminaSearch.incrementCount();
                    wt.akuminaSearch.attachListeners();
                    wt.akuminaSearch.track();
                }
        }
    }
})(window.document);

Webtrends.registerPlugin("akuminaSearch", window.wt_sp_globals.akuminaSearch.init);