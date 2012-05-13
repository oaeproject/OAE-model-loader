var general = require("./api/general.js");

var done = 0;
var toDo = 100;
var getUrl = function(){
    done++;
}
getUrl();
for (var i = 0; i < 5; i++){
    general.urlReq("http://random.yahoo.com/bin/ryl?_=" + Math.random(), {
        method: 'GET'
    }, function(body, success, res){
        console.log(res.headers.location);
    });
}
