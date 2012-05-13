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

var readFile = function(file, res) {
    fs.readFile(RESULTS_DIR+file, 'ascii', function(err,data) {
        if(err) {
            console.error("Could not open file: %s", err);
            process.exit(1);
        }

        // Parse JSON Object and modify one of its properties
        var obj = JSON.parse(data);
        obj.elements[0].weight = 999;

        // Convert modified JSON back to string.
        data = JSON.stringify(obj);

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

