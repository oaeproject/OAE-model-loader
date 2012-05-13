var http = require('http');
var fs = require('fs');
var general = require('./api/general.js');

var readFile = function(file) {
    fs.readFile(file, 'ascii', function(err,data){

    if(err) {
        console.error("Could not open file: %s", err);
        process.exit(1);
    }
    
    console.log(data);
    var obj = JSON.parse(data);

    //var testObj = JSON.parse('{"key":"value"}');
    //console.log(testObj.key);
});
}

var readFiles = function(results) {
    for (var i=0, len=results.length; i<len; i++) {
        readFile(results[i]);
    }
}

http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });

    var results = general.getFileListForFolder('./results');

    res.end(readFiles(results) + '\n');
    
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
