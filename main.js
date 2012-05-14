var express = require('express');
var app = express.createServer();
var fs = require('fs');
var general = require('./api/general.js');

var RESULTS_DIR = './results/';
var REPORTING_DIR = './reporting/';

var oaeTestSuite = function () {
    var counter = 0;
    var files = [];
    var runs = [];
    var suites = {};

    return {
        closeRequest : function(res) {
            res.end('\n');
        },

        calulateAverageRun : function(results, testid) {
            var total = 0;
            var amount = 0;
            for (var i = 0; i < results.length; i++) {
                if (results[i].type === testid) {
                    total += results[i].result;
                    amount++;
                }
            }
            var average = total / amount;
            return Math.round(average * 100)/100;
        },

        calulateAverageTest : function(suite, testid) {
            var that = this;
            var tests = {};
            for (var i = 0; i < suite.runs.length; i++) {
                tests[suite.runs[i].id] = {
                    users: suite.runs[i].users,
                    result: that.calulateAverageRun(suite.runs[i].results, testid)
                }
            }
            return tests;
        },

        calulateAverage : function(suite) {
            var that = this;
            for (var i = 0; i < suite.elements.length; i++) {
                suite.elements[i].resultAverage = that.calulateAverageTest(suite, suite.elements[i].id);
            }
            return suite.elements;
        },

        getRuns : function(suiteid) {
            var localRuns = [];
            for (var i = 0; i < runs.length; i++) {
                if(runs[i].results[suiteid]) {
                    localRuns.push({
                        users: runs[i].users,
                        id: runs[i].id,
                        results: runs[i].results[suiteid]
                    });
                }
            }
            return localRuns;
        },

        buildJsonString : function(res) {
            var that = this;
            var reponseJSON = {
                results: []
            };

            for (var i in suites) {
                var responseSuite = suites[i];
                responseSuite.runs = this.getRuns(i);
                responseSuite.elements = that.calulateAverage(responseSuite);
                reponseJSON.results.push(responseSuite);
            };

            res.write(JSON.stringify(reponseJSON));
            this.closeRequest(res);
        },

        readFile : function(options) {
            var that = this;
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
                    that.buildJsonString(options.response);
                }
            });
        },

        readRunFiles : function(options) {
            counter = options.results.length - 1;
            
            for (var i=0, len=options.results.length; i<len; i++) {
                if (options.results[i] !== 'suites.json') {
                    this.readFile({
                        file: options.results[i],
                        response: options.response
                    });
                }
            }
        },
        
        readSuites : function(options) {
            var that = this;
            fs.readFile(RESULTS_DIR + 'suites.json', 'ascii', function(err,data) {
                suites = JSON.parse(data);

                for (var i in suites) {
                    suites[i].id = i;
                }

                that.readRunFiles(options);
            });
        }
    }
};

app.get('/results.json', function(req, res){
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    files = [];
    counter = 0;
    var results = general.getFileListForFolder(RESULTS_DIR);
    var testSuite = oaeTestSuite();

    testSuite.readSuites({
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