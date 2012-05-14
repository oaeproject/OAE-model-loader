var general = require("./../api/general.js");
var suiteAPI = require("./../api/suite.js");

exports.Suite = function(datamodel, SERVER_URL){
    var id = "discovery";
    var title = "Discovery";
    var threshold = 90;
    var target = 100;
    var elements = [];
    var runs = [];

    // Recent Activity Feed
    elements.push(new suiteAPI.SuiteElement("recentactivity-data", "Recentactivity Feed", 500, 2000, 0.05, 1));

    elements.push(new suiteAPI.SuiteElement("related-content", "Related Content Feed", 500, 2000, 0.05, 1));

    for (var b = 0; b < datamodel.length; b++){
        for (var u = 0; u < datamodel[b].users.length; u++){
            var user = datamodel[b].users[u];
            runs.push({
                "type": "recentactivity-data",
                "url": SERVER_URL + "/var/search/activity/all.json",
                "user": user,
                "method": "GET",
                "params": {
                    "_charset_": "utf-8",
                    "items": 12,
                    "_": Math.random()
                }
            });

            runs.push({
                "type": "related-content-data",
                "url": SERVER_URL + "/var/search/pool/me/related-content.json",
                "user": user,
                "method": "GET",
                "params": {
                    "_charset_": "utf-8",
                    "_": Math.random()
                }
            });
        }
    }

    // Define elements
    var suite = new suiteAPI.Suite(id, title, threshold, target, elements, runs);
    return suite;
}