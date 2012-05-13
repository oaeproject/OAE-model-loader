var general = require("./api/general.js");

var getAvailableSuites = function(){
    return general.getFileListForFolder("./suites");
}

var runSuites = function(datamodel, runid, SERVER_URL, callback){
    runid = runid || 0;
    var registeredSuites = getAvailableSuites();
    var suites = [];
    for (var s = 0; s < registeredSuites.length; s++){
        var suite = require("./suites/" + registeredSuites[s]);
        suites.push(new suite.Suite(datamodel, SERVER_URL));
    }
    var run = {};
    run.numberOfUsers = 0;
    for (var b = 0; b < datamodel.length; b++){
        run.numberOfUsers += datamodel[b].users.length;
    }
    run.results = [];
    var currentSuite = -1;
    var runSuite = function(){
        currentSuite++;
        if (currentSuite < suites.length){
            var suite = suites[currentSuite];
            suite.run(function(results){
                run.results.push(results);
                runSuite();
            });
        } else {
            // Write the results to a file
            console.log(JSON.stringify(run));
            callback();
        }
    }
    runSuite();
}

/*
 * runSuite();
    var run = {};
    run.numberOfUsers = 0;
    for (var b = 0; b < datamodel.length; b++){
        run.numberOfUsers += datamodel[b].users.length;
    }
    run.results = [];
    for (var s = 0; s < suites.length; s++){
        suites[s].run(function(results){
            run.results.push(results)
            callback(results);
        });
    }
 */

/////////////////
// TEST SCRIPT //
/////////////////

var batches = [];
var users = general.loadJSONFileIntoArray("./scripts/users/0.txt");
var contacts = general.loadJSONFileIntoArray("./scripts/contacts/0.txt");
var worlds = general.loadJSONFileIntoArray("./scripts/worlds/0.txt");
batches.push({
    "users": users,
    "contacts": contacts,
    "worlds": worlds
});
runSuites(batches, 0, "http://localhost:8080", function(results){
    console.log(results);
});
