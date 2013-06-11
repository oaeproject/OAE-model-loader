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

var express = require('express');
var app = express();
var fs = require('fs');
var general = require('./api/general.js');

var RESULTS_DIR = './results/';
var REPORTING_DIR = './reporting/';

var getRuns = function(callback) {
    var toReturn = {};
    var runFiles = general.getFileListForFolder('./results');
    var runs = [];

    var highestNumberOfUsers = 0;
    var supportedNumberOfUsers = -1;

    // Filter out suites.json
    var suitesIndex = 0;
    for (var r = 0; r < runFiles.length; r++) {
        if (runFiles[r] === 'suites.json') {
            suitesIndex = r;
        } else {
            var run = JSON.parse(fs.readFileSync('./results/' + runFiles[r], 'utf8'));
            run.id = runFiles[r];
            runs.push(run);
        }
    }
    runs.splice(suitesIndex, 1);

    // Read the suites file
    fs.readFile('./results/suites.json', 'utf8', function(err,data) {
        var suites = JSON.parse(data);
        for (var s in suites) {
            // Calculate the average for each element
            var weightedPassed = {}; var weightedTotal = {};
            for (var e = 0; e < suites[s].elements.length; e++) {
                suites[s].elements[e].runs = [];
                // Do this for each run
                for (var r = 0; r < runs.length; r++) {
                    if (runs[r].users > highestNumberOfUsers) {
                        highestNumberOfUsers = runs[r].users;
                    }
                    weightedPassed[runs[r].id] = weightedPassed[runs[r].id] || {total: 0, users: runs[r].users};
                    weightedTotal[runs[r].id] = weightedTotal[runs[r].id] || {total: 0, users: runs[r].users};
                    var sum = 0; var total = 0;
                    // Find the occurences from the current element
                    for (var result = 0; result < runs[r].results[s].length; result++) {
                        if (runs[r].results[s][result].type === suites[s].elements[e].id) {
                            total++;
                            sum += runs[r].results[s][result].result;

                            weightedTotal[runs[r].id].total += 1 * suites[s].elements[e].weight;
                            if (runs[r].results[s][result].result < suites[s].elements[e].upperLimitAverage) {
                                weightedPassed[runs[r].id].total += 1 * suites[s].elements[e].weight;
                            }

                        }
                    }
                    // Push the average for this run
                    var average = sum / total;
                    if (average > suites[s].elements[e].upperLimitAverage) {
                        // TODO: upperLimitAverage
                    }
                    suites[s].elements[e].runs.push({
                        'average': average,
                        'users': runs[r].users,
                        'id': runs[r].id
                    });
                }
            }
            // Calculate the overall score
            suites[s].weighted = [];
            for (var run in weightedTotal) {
                suites[s].weighted.push({
                    'run': run,
                    'result': weightedPassed[run].total / weightedTotal[run].total * 100,
                    'users': weightedPassed[run].users
                });
            }
        }
        toReturn['suites'] = suites;
        toReturn['numberOfUsersSupported'] = highestNumberOfUsers;
        callback(toReturn);
    });
};

app.get('/results.json', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    getRuns(function(object) {
        res.write(JSON.stringify(object));
        res.end('\n');
    });

});

app.get('/telemetry.json', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    // Read the telemetry file
    fs.readFile('results/telemetry.json', 'utf8', function(err,data) {
        res.write(data);
        res.end();
    });

});

app.configure(function() {
    app.use(express.static(REPORTING_DIR));
    app.use(express.directory(REPORTING_DIR));
    app.use(express.errorHandler());
});

app.listen(1337);
console.log('Server running at http://127.0.0.1:1337/');
