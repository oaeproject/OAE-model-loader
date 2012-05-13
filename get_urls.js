var general = require("./api/general.js");

for (var i = 0; i < 5; i++){
    general.urlReq("http://random.yahoo.com/bin/ryl", {
        method: 'GET'
    }, function(res){
        console.log(res);
    });
}
