/*
 * Copyright 2013 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 * 
 *     http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var general = require('./api/general.js');

var getAvailableSuites = function() {
    return general.getFileListForFolder('./suites');
};

exports.runSuites = function(datamodel, runid, SERVER_URL, callback) {
    runid = runid || 0;
    var registeredSuites = getAvailableSuites();
    var suites = [];
    var suitesToWrite = {};
    for (var s = 0; s < registeredSuites.length; s++) {
        var suite = require('./suites/' + registeredSuites[s]).Suite(datamodel, SERVER_URL);
        suites.push(suite);
        suitesToWrite[suite.id] = {
            'title': suite.title,
            'threshold': suite.threshold,
            'target': suite.target,
            'elements': []
        };
        for (var e = 0; e < suite.elements.length; e++) {
            var element = suite.elements[e];
            suitesToWrite[suite.id].elements.push({
                'id': element.id,
                'title': element.title,
                'targetAverage': element.targetAverage,
                'upperLimitAverage': element.upperLimitAverage,
                'tolerance': element.tolerance,
                'weight': element.weight
            });            
        }
    }
    // Write the suites.json file
    general.writeFile('./results/suites.json', JSON.stringify(suitesToWrite));

    // Run the suite
    var run = {};
    run.users = 0;
    for (var b = 0; b < datamodel.length; b++) {
        run.users += datamodel[b].users.length;
    }
    run.results = {};
    var currentSuite = -1;
    var runSuite = function() {
        currentSuite++;
        if (currentSuite < suites.length) {
            var suite = suites[currentSuite];
            suite.run(function(results) {
                run.results[suite.id] = results;
                runSuite();
            });
        } else {
            // Write the run file
            general.writeFile('./results/run' + runid + '.json', JSON.stringify(run));
            callback();
        }
    };
    runSuite();
};

exports.clearResults = function() {
    general.removeFilesInFolder('./results');
};
