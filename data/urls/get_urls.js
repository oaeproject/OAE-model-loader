var general = require("./api/general.js");

var done = [];
var toDo = 1000;

var getUrl = function(){
    if (done.length < toDo){
        general.urlReq("http://random.yahoo.com/bin/ryl", {
            method: 'GET'
        }, function(body, success, res){
            var url = res.headers.location;
            if (done.indexOf(url) === -1){
                console.log("Done " + done.length + " of " + toDo);
                done.push(url);
            } 
            getUrl();
        });
    } else {
        general.writeFileIntoArray("data/urls/random.txt", done);
        done = [];
        toDo = 1000;
        getYouTubeUrl();
    }
};

var getYouTubeUrl = function(){
    if (done.length < toDo){
        general.urlReq("http://www.youtuberandomvideo.com/", {
            method: 'GET'
        }, function(body, success, res){
            body = body.substring(body.indexOf("http://www.youtube.com/e/") + "http://www.youtube.com/e/".length);
            body = "http://www.youtube.com/watch?v=" + body.substring(0, body.indexOf("?enablejsapi=1&"));
            console.log(body);
            if (done.indexOf(body) === -1){
                console.log("Done " + done.length + " of " + toDo);
                done.push(body);
            }
            getYouTubeUrl();
        });
    } else {
        general.writeFileIntoArray("data/urls/youtube.txt", done);
    }
};

getUrl();
