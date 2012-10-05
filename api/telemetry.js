var _ = require('underscore');
var Stats = require('fast-stats').Stats;

/////////////////////////
// PER SECOND TRACKING //
/////////////////////////

var requestsPerSecond = [];
var interval = null;

/**
 * Function that will be called every second. It will move the timeframe so
 * that all requests in the next second are bundled together
 */
var nextSecond = function() {
    requestsPerSecond.push({
        'total': 0,
        'feed': {}
    });
};

/**
 * This function should be called when the telemetry functionality needs to
 * start listening for telemetry information
 */
module.exports.startTelemetry = function() {
    if (!interval) {
        nextSecond();
        interval = setInterval(nextSecond, 1000);
    }
};

/**
 * This needs to be called when the telemetry functionality can stop listening for
 * telemetry information. Not calling this function will cause Node not to quit at
 * the end of the dataloader. The results will also be written out when this function
 * is called
 */
module.exports.stopTelemetry = function() {
    clearInterval(interval);
    interval = null;
    reportChart();
};

/**
 * The main telemetry function that records a request into the data of the current second.
 * @param {String}      type        The request identifier. This will be used to collect all
 *                                  calls to the same service
 * @param {Number}      latency     The total response time of the request
 */
module.exports.Telemetry = function(type, latency) {
    requestsPerSecond[requestsPerSecond.length - 1].total++;
    requestsPerSecond[requestsPerSecond.length - 1].feed[type] = (requestsPerSecond[requestsPerSecond.length - 1].feed[type] || []);
    requestsPerSecond[requestsPerSecond.length - 1].feed[type].push(latency);
};

///////////////
// Reporting //
///////////////

/**
 * Take all of the collected results and process them into a format that allows plotting.
 * The results will include the total number of requests per second, the total number of 
 * requests per second per feed, the overall average latency per second across all requests
 * and the overall average latency per second per feed
 */
var reportChart = function() {
    var allSeries = [];

    /////////////////////////////////////////
    // Total number of requests per second //
    /////////////////////////////////////////

    var totalRequests = [];
    for (var i = 0; i < requestsPerSecond.length; i++) {
        totalRequests.push(requestsPerSecond[i].total);
    }
    allSeries.push([{
        name:'Total requests',
        data: totalRequests
    }]);

    //////////////////////////////////////////////////
    // Total number of requests per second per feed //
    //////////////////////////////////////////////////

    // Get all of the unique feeds that have been used
    var uniqueFeeds = [];
    for (var i = 0; i < requestsPerSecond.length; i++) {
        for (var f in requestsPerSecond[i].feed) {
            if (_.indexOf(uniqueFeeds, f) === -1) {
                uniqueFeeds.push(f);
            }
        }
    }
    
    allSeries.push([]);
    var cumulativeSerie = allSeries[allSeries.length - 1];
    for (var f = 0; f < uniqueFeeds.length; f++) {
        var totalRequests = [];
        for (var i = 0; i < requestsPerSecond.length; i++) {
            totalRequests.push(null);
            for (var feed in requestsPerSecond[i].feed) {
                if (feed === uniqueFeeds[f]) {
                    totalRequests[totalRequests.length - 1] = requestsPerSecond[i].feed[feed].length;
                }
            }
        }
        var Serie = {
            name:'Total requests for ' + uniqueFeeds[f],
            data: totalRequests
        }
        // This serie will have all totals per feed in one chart
        cumulativeSerie.push(Serie);
        // This will be used for a mean, 10th percentile and 95th percentile
        // per feed per chart
        allSeries.push([Serie]);
    }
    
    /////////////////////////////
    // Overall average latency //
    /////////////////////////////
    
    var averageLatency = [];
    var averageLatency10 = [];
    var averageLatency95 = [];
    for (var i = 0; i < requestsPerSecond.length; i++) {
        var s = new Stats();
        var totalLatency = 0; var totalRequests = 0;
        for (var f in requestsPerSecond[i].feed) {
            for (var j = 0; j < requestsPerSecond[i].feed[f].length; j++) {
                s.push(requestsPerSecond[i].feed[f][j]);
            }
        }
        averageLatency.push(s.amean());
        averageLatency10.push(s.percentile(10));
        averageLatency95.push(s.percentile(95));
    }
    allSeries.push([{
        name:'Overall average latency',
        data: averageLatency
    }, {
        name:'Overall average latency 10th percentile',
        data: averageLatency10
    }, {
        name:'Overall average latency 95th percentile',
        data: averageLatency95
    }]);
    
    //////////////////////////////
    // Average latency per feed //
    //////////////////////////////

    allSeries.push([]);
    cumulativeSerie = allSeries[allSeries.length - 1];
    for (var f = 0; f < uniqueFeeds.length; f++) {
        var averageLatency = [];
        var averageLatency10 = [];
        var averageLatency95 = [];
        for (var i = 0; i < requestsPerSecond.length; i++) {
            var s = new Stats();
            var totalLatency = 0; var totalRequests = 0;
            for (var feed in requestsPerSecond[i].feed) {
                if (feed === uniqueFeeds[f]){
                    for (var j = 0; j < requestsPerSecond[i].feed[feed].length; j++) {
                        s.push(requestsPerSecond[i].feed[feed][j]);
                    }
                }
            }
            averageLatency.push(s.amean());
            averageLatency10.push(s.percentile(10));
            averageLatency95.push(s.percentile(95));
        }
        var LatencySerie = {
            name:'Average latency for ' + uniqueFeeds[f],
            data: averageLatency
        };
        var LatencySerie10 = {
            name:'Average latency 10th percentile ' + uniqueFeeds[f],
            data: averageLatency10
        };
        var LatencySerie95 = {
            name:'Average latency 95th percentile ' + uniqueFeeds[f],
            data: averageLatency95
        };
        // This serie will have all means per feed in one chart
        cumulativeSerie.push(LatencySerie);
        // This will be used for a mean, 10th percentile and 95th percentile
        // per feed per chart
        allSeries.push([LatencySerie, LatencySerie10, LatencySerie95]);
    };
    
    // Write the file to disk, so it can be used by the telemetry reporting UI
    require('./general.js').writeFile('results/telemetry.json', JSON.stringify({results: allSeries}));
};
