var general = require("./../api/general.js");
var suiteAPI = require("./../api/suite.js");

exports.Suite = function(datamodel, SERVER_URL){
    var id = "me";
    var title = "Me";
    var threshold = 90;
    var target = 100;
    var elements = [];
    var runs = [];

    // Me Feed
    elements.push(new suiteAPI.SuiteElement("me-data", "Me Feed", 200, 1000, 0.05, 1));
    elements.push(new suiteAPI.SuiteElement("visibility-overview", "Visibility overview", 200, 1000, 0.05, 1));
    elements.push(new suiteAPI.SuiteElement("all-profile", "All profile", 200, 1000, 0.05, 1));

    for (var b = 0; b < datamodel.length; b++){
        for (var u = 0; u < datamodel[b].users.length; u++){
            var user = datamodel[b].users[u];
            runs.push({
                "type": "me-data",
                "url": SERVER_URL + "/api/me",
                "user": user,
                "method": "GET"
            });
            runs.push({
                "type": "visibility-overview",
                "url": SERVER_URL + "/api/users/" + user.id + "/visibility",
                "user": user,
                "method": "GET"
            }); 
            runs.push({
                "type": "all-profile",
                "url": SERVER_URL + "/api/users/" + user.id + "/profile",
                "user": user,
                "method": "GET"
            });
        }
    }

    // Define elements
    var suite = new suiteAPI.Suite(id, title, threshold, target, elements, runs);
    return suite;
};
