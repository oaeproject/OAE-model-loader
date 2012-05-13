(function() {
    var express = require('express');
    var app = express.createServer();
    var fs = require('fs');
    var general = require('./api/general.js');

    var RESULTS_DIR = './results/';
    var REPORTING_DIR = './reporting/';
    
    var counter = 0;
    var files = [];
    var runs = [];
    var suites = {};

    var closeRequest = function(res) {
        res.end('\n');
    }
    
    var calculateResults = function(dataObject) {
        var elementDetails = {};

        for (var i = 0, l = dataObject.elements.length; i < l; i++) {
            elementDetails[dataObject.elements[i].id] = dataObject.elements[i];
            dataObject.elements[i].resultAverage = {};
        }

        for (var i1 = 0, l1 = dataObject.runs.length; i1 < l1; i1++) {
            averageArrays = {};

            for (var elementId in elementDetails) {
                averageArrays[elementId] = [];

                
                for (var i3 = 0, l3 = dataObject.runs[i1].results.length; i3 < l3; i3++) {
                    //console.log(dataObject.runs[i1].results[i3].type);
                    if (dataObject.runs[i1].results[i3].type === elementId) {
                        //console.log('Populating...');
                        averageArrays[elementId].push(
                            parseInt(dataObject.runs[i1].results[i3].result, 10));
                    }
                }
            }
            //console.log(averageArrays);
            for (var elementId in averageArrays) {
                var upperLimitAverage = elementDetails[elementId].upperLimitAverage;
                var weight = elementDetails[elementId].weight;
                var total = 0;
                var average = 0;

                for (var i3 = 0, l = averageArrays[elementId].length; i3 < l; i3++) {
                    total += parseInt(averageArrays[elementId][i3], 10);
                }

                //console.log('Total: '+total);
                //console.log('Average Arrays: '+averageArrays[elementId]);
                
                average = total / averageArrays[elementId].length;

                for (var i3 = 0, l3 = dataObject.elements.length; i3 < l3; i3++) {
                    if (dataObject.elements[i3].id === elementId) {
                        //console.log('\n---------------------------');
                        //console.log('Run ID: '+dataObject.runs[i1].id);
                        //console.log('Average: '+average);
                        dataObject.elements[i3].resultAverage[dataObject.runs[i1].id] = {
                            "users": dataObject.runs[i1].users,
                            "result": average
                        }
                        //dataObject.elements[i3].resultAverage[dataObject.runs[i1].id].result = average;
                    }
                }
            }
        }

        
        for (var i1 = 0, l1 = dataObject.runs.length; i1 < l1; i1++) {
            //dataObject.runs[i1].weightedScore = {};
            var counts = {};
            var passed = {};
            var testScores = [];
            for (var elementId in elementDetails) {
                counts[elementId] = 0;
                passed[elementId] = 0;
                for (var i2 = 0, l2 = dataObject.runs[i1].results.length; i2 < l2; i2++) {
                    if (dataObject.runs[i1].results[i2].type === elementId) {
                        counts[elementId]++;
                        if (dataObject.runs[i1].results[i2].result < elementDetails[elementId].upperLimitAverage) {
                            passed[elementId]++;
                        }
                    }
                }
                
                //dataObject.runs[i1].weightedScore[elementId] = passed[elementId] / counts[elementId] * elementDetails[elementId].weight;
                testScores.push({
                    "passed": passed[elementId] * elementDetails[elementId].weight,
                    "total": counts[elementId] * elementDetails[elementId].weight
                });
                
                //dataObject.runs[i1].weightedScore[elementId]
            }
            
            var passed = 0;
            var total = 0;
            var passedPercent = 0;
            
            console.log('\nTest Scores:');
            console.log(testScores);
            for (var j=0; j<testScores.length; j++) {
                console.log('\n----------');
                console.log('Passed: '+testScores[j].passed);
                console.log('Total: '+testScores[j].total);
                
                passed += testScores[j].passed;
                total += testScores[j].total;
            }
            passedPercent = (passed / total) * 100;
            
            dataObject.runs[i1].weightedPercentage = passedPercent;
            
            
        }
        /*
        var passed = 0;
        var total = 0;
        var passedPercent = 0;
        
        
        for (var j=0; j<testScores.length; j++) {
            console.log('\n----------');
            console.log('Passed: '+testScores[j].passed);
            console.log('Total: '+testScores[j].total);
            
            passed += testScores[j].passed;
            total += testScores[j].total;
        }
        passedPercent = (passed / total) * 100;
        
        dataObject.weightPercentage = passedPercent;*/
        
        return dataObject;
    }

    var getRuns = function(suiteid) {
        var localRuns = [];
        for (var i = 0; i < runs.length; i++) {
            if(runs[i].results[suiteid]) {
                localRuns.push({
                    users: runs[i].users,
                    id: runs[i].id
                });
            }
        }
        return localRuns;
    };

    var buildJsonString = function(res) {

        var reponseJSON = {
            results: []
        };

        for (var i in suites) {
            var responseSuite = suites[i];
            responseSuite.runs = getRuns(i);
            reponseJSON.results.push(responseSuite);
        };

        res.write(JSON.stringify(reponseJSON));
        closeRequest(res);
    }

    var readFile = function(options) {
        fs.readFile(RESULTS_DIR + options.file, 'ascii', function(err,data) {
            if(err) {
                console.error("Could not open file: %s", err);
                process.exit(1);
            }

            // Parse JSON Object and modify one of its properties
            var dataObject = JSON.parse(data);

            //dataObject = calculateResults(dataObject);
            
            // Convert modified JSON back to string.
            dataObject.id = options.file.replace('.json', '');
            runs.push(dataObject);
            counter--;
            
            if (counter === 0) {
                buildJsonString(options.response);
            }
        });
    }

    var readRunFiles = function(options) {
        counter = options.results.length - 1;
        
        for (var i=0, len=options.results.length; i<len; i++) {
            if (options.results[i] !== 'suites.json') {
                readFile({
                    file: options.results[i],
                    response: options.response
                });
            }
        }
        console.log('Out of loop');
    }
    
    var readSuites = function(options) {
        fs.readFile(RESULTS_DIR + 'suites.json', 'ascii', function(err,data) {
            suites = JSON.parse(data);

            for (var i in suites) {
                suites[i].id = i;
            }

            readRunFiles(options);
        });
    }

    app.get('/results.json', function(req, res){
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        files = [];
        counter = 0;
        runs = [];
        suites = {};
        var results = general.getFileListForFolder(RESULTS_DIR);
        
        readSuites({
            results: results, 
            response: res
        });
    });

    app.configure(function() {
        app.use(express.static(REPORTING_DIR));
        app.use(express.directory(REPORTING_DIR));
        app.use(express.errorHandler());
    });

    app.listen(1337);

    console.log('Server running at http://127.0.0.1:1337/');
})();
