/*
 * Copyright 2012 Sakai Foundation (SF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 * 
 *     http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

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
    // First process the telemetry for the current second
    var currentSecond = requestsPerSecond[requestsPerSecond.length - 1];
    if (currentSecond) {
        var avgLatency = new Stats();
        for (var f in currentSecond.feed) {
            var feedObject = {};
            // Calculate total per feed
            feedObject.total = currentSecond.feed[f].length;
            // Calculate average latency per feed, as well as 10th and 95th percentile
            var s = new Stats();
            for (var j = 0; j < currentSecond.feed[f].length; j++) {
                s.push(currentSecond.feed[f][j]);
                avgLatency.push(currentSecond.feed[f][j]);
            }
            feedObject.avg = s.amean();
            feedObject.avg10 = s.percentile(10);
            feedObject.avg95 = s.percentile(95);
            // Replace the full telemetry
            currentSecond.feed[f] = feedObject;
        }
        currentSecond.avg = avgLatency.amean();
        currentSecond.avg10 = avgLatency.percentile(10);
        currentSecond.avg95 = avgLatency.percentile(95);
    }
    
    // Prepare the next second
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
            if (requestsPerSecond[i].feed[uniqueFeeds[f]]) {
                totalRequests.push(requestsPerSecond[i].feed[uniqueFeeds[f]].total);
            } else {
                totalRequests.push(null);
            }
        }
        var Serie = {
            name:'Total requests for ' + uniqueFeeds[f],
            data: totalRequests
        }
        // This serie will have all totals per feed in one chart
        cumulativeSerie.push(Serie);
        allSeries.push([Serie]);
    }
    
    /////////////////////////////
    // Overall average latency //
    /////////////////////////////
    
    var averageLatency = []; var averageLatency10 = []; var averageLatency95 = [];
    for (var i = 0; i < requestsPerSecond.length; i++) {
        averageLatency.push(requestsPerSecond[i].avg);
        averageLatency10.push(requestsPerSecond[i].avg10);
        averageLatency95.push(requestsPerSecond[i].avg95);
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
        var averageLatency = []; var averageLatency10 = []; var averageLatency95 = [];
        for (var i = 0; i < requestsPerSecond.length; i++) {
            if (requestsPerSecond[i].feed[uniqueFeeds[f]]) {
                averageLatency.push(requestsPerSecond[i].feed[uniqueFeeds[f]].avg);
                averageLatency10.push(requestsPerSecond[i].feed[uniqueFeeds[f]].avg10);
                averageLatency95.push(requestsPerSecond[i].feed[uniqueFeeds[f]].avg95);
            } else {
                averageLatency.push(null);
                averageLatency10.push(null);
                averageLatency95.push(null);
            }
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
