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

console.time("Finished running data loader");

var loadNextBatch = function() {
    currentBatch++;
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
        telemetry.stopTelemetry();
        console.timeEnd('Loading Batches');
        console.log('*****************************');
        console.log('Finished generating ' + BATCHES + ' batches');
        console.timeEnd("Finished running data loader");
        console.log('Requests made: ' + general.requests);
        console.log('Request errors: ' + general.errors);
    }
};

var finishBatch = function() {
    console.log('Finished Loading Batch ' + currentBatch);
    console.log('=================================');
    loadNextBatch();
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
        console.log('  Finished Loading User ' + (currentUser + 1) + ' of ' + usersToLoad.length);
        currentUser++;
        if (currentUser < usersToLoad.length) {
            var nextUser = usersToLoad[currentUser];
            userAPI.loadUser(nextUser, SERVER_URL, loadNextUser);
        } else {
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
        console.log('  Finished Loading Group ' + (currentGroup + 1) + ' of ' + groupsToLoad.length);
        currentGroup++;
        if (currentGroup < groupsToLoad.length) {
            var nextGroup = groupsToLoad[currentGroup];
            groupAPI.loadGroup(nextGroup, users, SERVER_URL, loadNextGroup);
        } else {
            loadGroupMemberships(users, groups, content);
        }
    };
    loadNextGroup();
};

var loadGroupMemberships = function(users, groups, content) {
    var currentGroupMembership = -1;
    var groupsToLoad = _.values(groups);
    var loadNextGroupMembership = function() {
        console.log('  Finished Loading Group Memberships ' + (currentGroupMembership + 1) + ' of ' + groupsToLoad.length);
        currentGroupMembership++;
        if (currentGroupMembership < groupsToLoad.length) {
            var nextGroup = groupsToLoad[currentGroupMembership];
            groupAPI.loadGroupMembership(nextGroup, users, SERVER_URL, loadNextGroupMembership);
        } else {
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
        console.log('  Finished Loading Content ' + (currentContent + 1) + ' of ' + contentToLoad.length);
        currentContent++;
        if (currentContent < contentToLoad.length) {
            var nextContent = contentToLoad[currentContent];
            contentAPI.loadContent(nextContent, users, groups, SERVER_URL, loadNextContent);
        } else {
            checkRunSuites();
        }
    };
    loadNextContent();
};

///////////
// START //
///////////

for (var b = 0; b < CONCURRENT_BATCHES; b++) {
    loadNextBatch();
}

telemetry.startTelemetry();
console.time('Loading Batches');