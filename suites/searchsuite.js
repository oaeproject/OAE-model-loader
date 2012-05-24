var general = require("./../api/general.js");
var suiteAPI = require("./../api/suite.js");

exports.Suite = function(datamodel, SERVER_URL){
    var id = "search";
    var title = "Search";
    var threshold = 90;
    var target = 100;
    var elements = [];
    var runs = [];

    // Search All - No query
    elements.push(new suiteAPI.SuiteElement("searchall-noquery", "Search All - No Query", 500, 2000, 0.05, 1));
    // Search All - Query - Lots of results
    elements.push(new suiteAPI.SuiteElement("searchall-query-lots", "Search All - Query - Lots", 500, 2000, 0.05, 1));
    // Search All - Query - Few results
    elements.push(new suiteAPI.SuiteElement("searchall-query-few", "Search All - Query - Few", 500, 2000, 0.05, 2));

    for (var b = 0; b < datamodel.length; b++){
        for (var u = 0; u < datamodel[b].users.length; u++){
            var user = datamodel[b].users[u];
            runs.push({
                "type": "searchall-noquery",
                "url": SERVER_URL + "/var/search/general.json",
                "user": user,
                "method": "GET",
                "params": {
                    "q": "*",
                    "tags": "",
                    "sortOn": "_lastModified",
                    "sortOrder": "desc",
                    "page": 0,
                    "items": 18,
                    "_charset_": "utf-8",
                    "_": Math.random()
                }
            });
            runs.push({
                "type": "searchall-query-lots",
                "url": SERVER_URL + "/var/search/general.json",
                "user": user,
                "method": "GET",
                "params": {
                    "q": "batch" + b,
                    "tags": "",
                    "sortOn": "_lastModified",
                    "sortOrder": "desc",
                    "page": 0,
                    "items": 18,
                    "_charset_": "utf-8",
                    "_": Math.random()
                }
            });
            runs.push({
                "type": "searchall-query-few",
                "url": SERVER_URL + "/var/search/general.json",
                "user": user,
                "method": "GET",
                "params": {
                    "q": general.generateFirstName().substring(0, 2),
                    "tags": "",
                    "sortOn": "_lastModified",
                    "sortOrder": "desc",
                    "page": 0,
                    "items": 18,
                    "_charset_": "utf-8",
                    "_": Math.random()
                }
            });
        }
    }

    // Define elements
    var suite = new suiteAPI.Suite(id, title, threshold, target, elements, runs);
    return suite;
};
