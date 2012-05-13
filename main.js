var http = require('http');
var general = require('./api/general.js');


http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });

    var results = general.getFileListForFolder('./results');

    res.end(results + '\n');
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');