var general = require("./general.js");

exports.Suite = function(id, title, threshold, target, elements, runs){
    var that = {};

    that.id = id;
    that.title = title;
    that.threshold = threshold;
    that.target = target;
    that.elements = elements;
    that.runs = runs;

    that.run = function(callback){
        var results = [];
        var currentRun = -1;
        var runTest = function(){
            currentRun++;
            console.log(" Running request " + (currentRun + 1) + " of " + that.runs.length);
            if (currentRun < that.runs.length){
                var run = that.runs[currentRun];
                var auth = run.user.userid + ":" + run.user.password;
                var startTime = new Date().getTime();
                general.urlReq(run.url, {
                    method: run.method || "GET",
                    params: run.params || {},
                    auth: auth
                }, function(res, success){
                    var endTime = new Date().getTime();
                    results.push({
                        "type": run.type,
                        "user": run.user.userid,
                        "result": endTime - startTime
                    });
                    runTest();
                });
            } else {
                callback(results);
            }
        };
        runTest();
    };

    return that;
};

exports.SuiteElement = function(id, title, targetAverage, upperLimitAverage, tolerance, weight){
    var that = {};

    that.id = id;
    that.title = title;
    that.targetAverage = targetAverage;
    that.upperLimitAverage = upperLimitAverage;
    that.tolerance = tolerance;
    that.weight = weight;

    return that;
};
