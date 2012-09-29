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

var general = require("./api/general.js");
var userAPI = require("./api/user.dataload.js");
var worldAPI = require("./api/world.dataload.js");
var runSuites = require("./run_suites.js");

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = "scripts";

var BATCHES = argv['end-batch'];
var SERVER_URL = argv['server-url'];
var ADMIN_PASSWORD = argv['admin-pw'];
var CONCURRENT_BATCHES = argv['concurrent-batches']
var RUN_SUITES = argv['test-batch-interval'];
if (RUN_SUITES){
    runSuites.clearResults();
}

//////////////////////
// CLEAN PARAMETERS //
//////////////////////

// clear trailing slashes from server url
SERVER_URL = SERVER_URL.replace(/^(.*?)\/+$/, "$1");

////////////////////
// KICK OFF BATCH //
////////////////////

var currentBatch = argv.start - 1;
var batches = [];

var loadNextBatch = function(){
    currentBatch++;
    if (currentBatch < BATCHES){
        console.log("Loading Batch " + currentBatch);
        // Load the data from the model
        var users = general.loadJSONFileIntoObject("./scripts/users/" + currentBatch + ".txt");
        var worlds = general.loadJSONFileIntoObject("./scripts/worlds/" + currentBatch + ".txt");
        batches.push({
            "users": users,
            "worlds": worlds
        });
        loadUsers(users, worlds);
    } else {
        console.timeEnd("Loading Batches");
        console.log("*****************************");
        console.log("Finished generating " + BATCHES + " batches");
        console.log("Requests made: " + general.requests);
        console.log("Request errors: " + general.errors);
    }
};

var finishBatch = function(){
    console.log("Finished Loading Batch " + currentBatch);
    console.log("=================================");
    loadNextBatch();
};

var checkRunSuites = function(){
    if (RUN_SUITES && currentBatch % RUN_SUITES === 0){
        // run the test suite before continuing
        runSuites.runSuites(batches, currentBatch - 1, SERVER_URL, finishBatch);
    } else {
        finishBatch();
    }
};

///////////
// USERS //
///////////

var loadUsers = function(users, worlds){
    var currentUser = -1;
    var usersToLoad = _.values(users);
    var loadNextUser = function(){
        console.log("  Finished Loading User " + (currentUser + 1) + " of " + usersToLoad.length);
        currentUser++;
        if (currentUser < usersToLoad.length) {
            var nextUser = usersToLoad[currentUser];
            userAPI.loadUser(nextUser, SERVER_URL, loadNextUser);
        } else {
            loadWorlds(users, worlds);
        }
    };
    loadNextUser();
};

////////////
// WORLDS //
////////////

var loadWorlds = function(users, worlds){
    var currentWorld = -1;
    var worldsToLoad = _.values(worlds);
    var loadNextWorld = function(){
        console.log("  Finished Loading World " + (currentWorld + 1) + " of " + worldsToLoad.length);
        currentWorld++;
        if (currentWorld < worldsToLoad.length){
            var nextWorld = worldsToLoad[currentWorld];
            worldAPI.loadWorld(nextWorld, users, SERVER_URL, loadNextWorld);
        } else {
            checkRunSuites();
            //loadWorldGroupMemberships(users, worlds);
        }
    };
    loadNextWorld();
};

var loadWorldGroupMemberships = function(users, worlds){
    var currentWorldGroupMembership = -1;
    var loadNextWorldGroupMembership = function(){
        console.log("  Finished Loading Group Memberships " + (currentWorldGroupMembership + 1) + " of " + worlds.length);
        currentWorldGroupMembership++;
        if (currentWorldGroupMembership < worlds.length){
            var nextWorld = worlds[currentWorldGroupMembership];
            worldAPI.loadGroupMembership(nextWorld, users, SERVER_URL, loadNextWorldGroupMembership);
        } else {
            checkRunSuites();
        }
    };
    loadNextWorldGroupMembership();
};

///////////
// START //
///////////

for (var b = 0; b < CONCURRENT_BATCHES && b < BATCHES; b++){
    loadNextBatch();
}

console.time("Loading Batches");