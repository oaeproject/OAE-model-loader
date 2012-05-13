var general = require("./api/general.js");

var getAvailableSuites = function(){
    return general.getFileListForFolder("./suites");
}

exports.runSuites = function(datamodel, runid, SERVER_URL, callback){
    runid = runid || 0;
    var registeredSuites = getAvailableSuites();
    var suites = [];
    var suitesToWrite = {};
    for (var s = 0; s < registeredSuites.length; s++){
        var suite = require("./suites/" + registeredSuites[s]).Suite(datamodel, SERVER_URL);
        suites.push(suite);
        suitesToWrite[suite.id] = {
            "title": suite.title,
            "threshold": suite.threshold,
            "target": suite.target,
            "elements": []
        }
        for (var e = 0; e < suite.elements.length; e++){
            var element = suite.elements[e];
            suitesToWrite[suite.id].elements.push({
                "id": element.id,
                "title": element.title,
                "targetAverage": element.targetAverage,
                "upperLimitAverage": element.upperLimitAverage,
                "tolerance": element.tolerance,
                "weight": element.weight
            });            
        }
    }
    // Write the suites.json file
    general.writeFile("./results/suites.json", JSON.stringify(suitesToWrite));

    // Run the suite
    var run = {};
    run.users = 0;
    for (var b = 0; b < datamodel.length; b++){
        run.users += datamodel[b].users.length;
    }
    run.results = {};
    var currentSuite = -1;
    var runSuite = function(){
        currentSuite++;
        if (currentSuite < suites.length){
            var suite = suites[currentSuite];
            suite.run(function(results){
                run.results[suite.id] = results;
                runSuite();
            });
        } else {
            // Write the run file
            general.writeFile("./results/run" + runid + ".json", JSON.stringify(run));
            callback();
        }
    }
    runSuite();
}

exports.clearResults = function(){
    general.removeFilesInFolder("./results");
}
