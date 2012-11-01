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

var argv = require('optimist')
    .usage('Usage: $0 -b 9 [-s 0] [-h "http://localhost:8080"] [-p admin] [-c 1] [-i 0]')
    
    .demand('b')
    .alias('b', 'end-batch')
    .describe('b', 'The last batch to load (exclusive, so "-s 0 -b 1" will only load the 0th batch)')
    
    .alias('s', 'start')
    .describe('s', 'The batch to start at (0-based, so the first batch is "0")')
    .default('s', 0)
    
    .alias('h', 'server-url')
    .describe('h', 'Server URL')
    .default('h', 'http://localhost:8080')
    
    .alias('p', 'admin-pw')
    .describe('p', 'Admin Password')
    .default('p', 'admin')
    
    .alias('c', 'concurrent-batches')
    .describe('c', 'Number of concurrent batches')
    .default('c', 1)
    
    .alias('i', 'test-batch-interval')
    .describe('i', 'Batch interval for test suites (0 for no test suites)')
    .default('i', 0)    
    .argv;

var _ = require('underscore');

var telemetry = require('./api/telemetry.js');

var general = require('./api/general.js');
var userAPI = require('./api/user.dataload.js');
var groupAPI = require('./api/group.dataload.js');
var contentAPI = require('./api/content.dataload.js');
var runSuites = require('./run_suites.js');

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = 'scripts';

var BATCHES = argv['end-batch'];
var SERVER_URL = argv['server-url'];
var ADMIN_PASSWORD = argv['admin-pw'];
var CONCURRENT_BATCHES = argv['concurrent-batches']
var RUN_SUITES = argv['test-batch-interval'];
if (RUN_SUITES) {
    runSuites.clearResults();
}

//////////////////////
// CLEAN PARAMETERS //
//////////////////////

// clear trailing slashes from server url
SERVER_URL = SERVER_URL.replace(/^(.*?)\/+$/, '$1');

////////////////////
// KICK OFF BATCH //
////////////////////

var currentBatch = argv.start - 1;
var batches = [];

// holds the mappings of local ids to server-generated ids
var idMappings = {
    'users': {},
    'content': {}
};

console.time("Finished running data loader");

var loadNextBatch = function() {
    currentBatch++;

    idMappings['users'][currentBatch] = {};
    idMappings['content'][currentBatch] = {};

    if (currentBatch < BATCHES) {
        console.log('Loading Batch ' + currentBatch);
        // Load the data from the model
        var users = general.loadJSONFileIntoObject('./scripts/users/' + currentBatch + '.txt');
        var groups = general.loadJSONFileIntoObject('./scripts/groups/' + currentBatch + '.txt');
        var content = general.loadJSONFileIntoObject('./scripts/content/' + currentBatch + '.txt');
        batches.push({
            'users': users,
            'groups': groups,
            'content': content
        });
        loadUsers(users, groups, content);
    } else {
        finishedAllBatches();
    }
};

var finishBatch = function() {
    console.log('Finished Loading Batch ' + currentBatch);
    console.log('=================================');
    loadNextBatch();
};

var finishedAllBatches = function() {
    telemetry.stopTelemetry();
    console.timeEnd('Loading Batches');
    console.log('*****************************');
    if (general.errors.length) {
        console.log('Error details:');
        console.log(general.errors);
    }
    console.log('Requests made: ' + general.requests);
    console.log('Request errors: ' + general.errors.length);
    console.log('Finished generating ' + BATCHES + ' batches');
    console.timeEnd("Finished running data loader");
    console.log('*****************************');
};

var checkRunSuites = function() {
    if (RUN_SUITES && currentBatch % RUN_SUITES === 0) {
        // run the test suite before continuing
        runSuites.runSuites(batches, currentBatch - 1, SERVER_URL, finishBatch);
    } else {
        finishBatch();
    }
};

///////////
// USERS //
///////////

var loadUsers = function(users, groups, content) {
    var currentUser = -1;
    var usersToLoad = _.values(users);
    var loadNextUser = function() {
        currentUser++;
        if (currentUser < usersToLoad.length) {
            var nextUser = usersToLoad[currentUser];
            userAPI.loadUser(nextUser, SERVER_URL, function() {
                idMappings['users'][currentBatch][nextUser.originalid] = {
                    id: nextUser.originalid,
                    generatedId: nextUser.generatedid
                };

                loadNextUser();
            });
            if (currentUser % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading User ' + currentUser + ' of ' + usersToLoad.length);
            }
        } else {

            general.writeObjectToFile('./scripts/generatedIds/users-' + currentBatch + '.txt', idMappings['users'][currentBatch]);

            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + usersToLoad.length + ' Users');
            loadGroups(users, groups, content);
        }
    };
    loadNextUser();
};

////////////
// GROUPS //
////////////

var loadGroups = function(users, groups, content) {
    var currentGroup = -1;
    var groupsToLoad = _.values(groups);
    var loadNextGroup = function() {
        currentGroup++;
        if (currentGroup < groupsToLoad.length) {
            var nextGroup = groupsToLoad[currentGroup];

            // convert all group membership ids to the generated user ids
            for (var role in nextGroup.roles) {
                nextGroup.roles[role].users = _.map(nextGroup.roles[role].users, function(originalUserId) {
                    return idMappings['users'][currentBatch][originalUserId].generatedId;
                });
            }

            groupAPI.loadGroup(nextGroup, users, SERVER_URL, loadNextGroup);
            if (currentGroup % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading Group ' + currentGroup + ' of ' + groupsToLoad.length);
            }    
        } else {
            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + groupsToLoad.length + ' Groups');
            loadGroupMemberships(users, groups, content);
        }
    };
    loadNextGroup();
};

var loadGroupMemberships = function(users, groups, content) {
    var currentGroupMembership = -1;
    var groupsToLoad = _.values(groups);
    var loadNextGroupMembership = function() {
        currentGroupMembership++;
        if (currentGroupMembership < groupsToLoad.length) {
            var nextGroup = groupsToLoad[currentGroupMembership];
            groupAPI.loadGroupMembership(nextGroup, users, SERVER_URL, loadNextGroupMembership);
            if (currentGroupMembership % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading Group Memberships ' + currentGroupMembership + ' of ' + groupsToLoad.length);
            }
        } else {
            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + groupsToLoad.length + 'Group Memberships');
            loadContent(users, groups, content);
        }
    };
    loadNextGroupMembership();
};

/////////////
// CONTENT //
/////////////

var loadContent = function(users, groups, content) {
    var currentContent = -1;
    var contentToLoad = _.values(content);
    var loadNextContent = function() {
        currentContent++;
        if (currentContent < contentToLoad.length) {
            var nextContent = contentToLoad[currentContent];

            // convert all content membership ids to the generated user ids
            for (var role in nextContent.roles) {
                nextContent.roles[role].users = _.map(nextContent.roles[role].users, function(originalUserId) {
                    return idMappings['users'][currentBatch][originalUserId].generatedId;
                });
            }

            contentAPI.loadContent(nextContent, users, groups, SERVER_URL, function() {
                idMappings['content'][currentBatch][nextContent.originalid] = {
                    id: nextContent.originalid,
                    generatedId: nextContent.generatedid
                };

                loadNextContent();
            });
            if (currentContent % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading Content Item ' + currentContent + ' of ' + contentToLoad.length);
            }
        } else {

            general.writeObjectToFile('./scripts/generatedIds/content-' + currentBatch + '.txt', idMappings['content'][currentBatch]);

            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + contentToLoad.length + ' Content Items');
            checkRunSuites();
        }
    };
    loadNextContent();
};

///////////
// START //
///////////

general.createFolder('./scripts/generatedIds');

console.time('Loading Batches');
telemetry.startTelemetry();

for (var b = 0; b < CONCURRENT_BATCHES; b++) {
    loadNextBatch();
}
