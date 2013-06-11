/*
 * Copyright 2013 Apereo Foundation (AF) Licensed under the
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

var argv = require('optimist')
    .usage('Usage: $0 -c <concurrent users> [-u <number of users>] [-g <number of groupss>]')
    
    .alias('h', 'host')
    .describe('h', 'URL of the Hilary server')
    .default('h', 'http://localhost:2001')
    
    .alias('c', 'concurrent')
    .describe('c', 'Number of concurrent users')
    .default('c', 5)

    .alias('t', 'total')
    .describe('t', 'Total number of request')
    .default('t', 1000)
    .argv;

var _ = require('underscore');

var general = require('./api/general.js');
var telemetry = require('./api/telemetry.js');

// Read the first batch of users, groups and content
var users = general.loadJSONFileIntoObject('./scripts/users/0.txt');
var userIds = _.keys(users);
var groups = general.loadJSONFileIntoObject('./scripts/groups/0.txt');
var groupIds = _.keys(groups);
var content = general.loadJSONFileIntoObject('./scripts/content/0.txt');
var contentIds = _.keys(content);

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SERVER_URL = argv.host;
var TOTAL_REQUESTS = argv.total;
var CONCURRENT_USERS = argv.concurrent;

///////////////////////
// MAKE THE REQUESTS //
///////////////////////

var total = 0;

var durations = {};
var statuscodes = {};

var makeRequests = function(currentRequest) {

    total++;
    currentRequest = (currentRequest || 0) + 1;

    ///////////////////////////////
    // Check if we have finished //
    ///////////////////////////////

    if (total % 10 === 0) {
        console.log('Finished request ' + total + ' of ' + (CONCURRENT_USERS * TOTAL_REQUESTS));
    }

    if (total >= CONCURRENT_USERS * TOTAL_REQUESTS) {
        console.log(durations);
        console.log(statuscodes);
        // Average duration
        var totalDuration = 0; var numberDuration = 0;
        for (var d in durations) {
            totalDuration += durations[d] * parseInt(d, 10);
            numberDuration += durations[d];
        }
        console.log('Average response time: ' + (totalDuration / numberDuration));
        console.timeEnd('Loading content');
        telemetry.stopTelemetry();
    }
    
    // Stop sending requests once we've reached the target number
    if (currentRequest === TOTAL_REQUESTS) {
        return;
    }
    
    //////////////////////////////
    // Select who makes request //
    //////////////////////////////

    // Anonymous or not
    var isAnon = general.randomize([[0.25, true],[0.75, false]]);
    var requestUser = null;
    if (!isAnon) {
        // Select user
        requestUser = userIds[Math.floor(Math.random() * userIds.length)];
    }
    // Profile user
    var profileUser = userIds[Math.floor(Math.random() * userIds.length)];
    // Select content
    var requestContent = contentIds[Math.floor(Math.random() * contentIds.length)];
    // Select group
    var requestGroup = groupIds[Math.floor(Math.random() * groupIds.length)];

    /////////////////////////////
    // Make the actual request //
    /////////////////////////////

    var start = Date.now();
    // Content
    general.urlReq(SERVER_URL + '/api/content/' + content[requestContent].contentid, {
    // Content members
    //general.urlReq(SERVER_URL + '/api/content/' + content[requestContent].contentid + '/members', {
    // Group Profile
    //general.urlReq(SERVER_URL + '/api/group/' + requestGroup, {
    // Group Members
    //general.urlReq(SERVER_URL + '/api/group/' + requestGroup + '/members', {
    // Group Library
    //general.urlReq(SERVER_URL + '/api/content/library/' + requestGroup, {
    // Me Feed
    //general.urlReq(SERVER_URL + '/api/me', {
    // User Memberships
    //general.urlReq(SERVER_URL + '/api/user/' + profileUser + '/memberships', {
    // User Library
    //general.urlReq(SERVER_URL + '/api/content/library/' + profileUser, {
    // User Profile
    //general.urlReq(SERVER_URL + '/api/user/' + profileUser + '/profile', {
        method: 'GET',
        auth: isAnon ? null : users[requestUser]
    }, function(body, success, res) {
        // Durations
        var duration = Date.now() - start;
        durations[duration] = (durations[duration] || 0) + 1;
        // Status code
        statuscodes[res.statusCode] = (statuscodes[res.statusCode] || 0) + 1;
        // Continue
        makeRequests(currentRequest);
    });
};

console.time('Loading content');
telemetry.startTelemetry();

for (var c = 0; c < CONCURRENT_USERS; c++) {
    makeRequests();
}