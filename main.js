var express = require('express');
var app = express.createServer();
var fs = require('fs');
var general = require('./api/general.js');

var RESULTS_DIR = './results/';
var REPORTING_DIR = './reporting/';

var counter = 0;
var files = [];

var closeRequest = function(res) {
    res.end('\n');
}

var buildJsonString = function(res) {
    var arr = files.join(',');
    var results = '{ "results" : ['+arr+']}';
    res.write(results);
    closeRequest(res);
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
console.log(averageArrays);
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
                    console.log('\n---------------------------');
                    console.log('Run ID: '+dataObject.runs[i1].id);
                    console.log('Average: '+average);
                    dataObject.elements[i3].resultAverage[dataObject.runs[i1].id] = {
                        "users": dataObject.runs[i1].users,
                        "result": average
                    }
                    //dataObject.elements[i3].resultAverage[dataObject.runs[i1].id].result = average;
                }
            }
        }
    }

    var testScores = [];
    
    for (var i1 = 0, l1 = dataObject.runs.length; i1 < l1; i1++) {
        dataObject.runs[i1].weightedScore = {};
        var counts = {};
        var passed = {};
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
            
            dataObject.runs[i1].weightedScore[elementId] = passed[elementId] / counts[elementId] * elementDetails[elementId].weight;
            //testScores.push({
            //    p:
        }
    }
    
    return dataObject;
}

var readFile = function(file, res) {
    fs.readFile(RESULTS_DIR+file, 'ascii', function(err,data) {
        if(err) {
            console.error("Could not open file: %s", err);
            process.exit(1);
        }

        // Parse JSON Object and modify one of its properties
        var dataObject = JSON.parse(data);

        dataObject = calculateResults(dataObject);
        
        // Convert modified JSON back to string.
        data = JSON.stringify(dataObject);
        
        files.push(data);
        counter--;
        
        if (counter === 0) {
            buildJsonString(res);
        }
    });
}

var readFiles = function(results, res) {
    counter = results.length;
    
    for (var i=0, len=results.length; i<len; i++) {
        readFile(results[i], res);
    }
}

app.get('/results.json', function(req, res){
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    var results = general.getFileListForFolder(RESULTS_DIR);
    readFiles(results, res); 
});

app.configure(function() {
  app.use(express.static(REPORTING_DIR));
  app.use(express.directory(REPORTING_DIR));
  app.use(express.errorHandler());
});
/*
app.get('/', function(req, res){
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    var results = general.getFileListForFolder(RESULTS_DIR);
    readFiles(results, res); 
});*/

app.listen(1337);

console.log('Server running at http://127.0.0.1:1337/');

