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

var general = require("./api/general.js");
var userAPI = require("./api/user.api.js");
var contactAPI = require("./api/contacts.api.js");
var worldAPI = require("./api/world.api.js");
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
        var users = general.loadJSONFileIntoArray("./scripts/users/" + currentBatch + ".txt");
        var contacts = general.loadJSONFileIntoArray("./scripts/contacts/" + currentBatch + ".txt");
        var worlds = general.loadJSONFileIntoArray("./scripts/worlds/" + currentBatch + ".txt");
        batches.push({
            "users": users,
            "contacts": contacts,
            "worlds": worlds
        });
        loadUsers(users, contacts, worlds);
    } else {
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

var loadUsers = function(users, contacts, worlds){
    var currentUser = -1;
    var loadNextUser = function(){
        console.log("  Finished Loading User " + (currentUser + 1) + " of " + users.length);
        currentUser++;
        if (currentUser < users.length){
            var nextUser = users[currentUser];
            userAPI.loadUser(nextUser, SERVER_URL, ADMIN_PASSWORD, loadNextUser);
        } else {
            loadContacts(users, contacts, worlds);
        }
    };
    loadNextUser();
};

//////////////
// CONTACTS //
//////////////

var loadContacts = function(users, contacts, worlds){
    var currentContact = -1;
    var loadNextContact = function(){
        console.log("  Finished Loading Contact " + (currentContact + 1) + " of " + contacts.length);
        currentContact++;
        if (currentContact < contacts.length){
            var nextContact = contacts[currentContact];
            contactAPI.loadContact(nextContact, users, SERVER_URL, ADMIN_PASSWORD, loadNextContact);
        } else {
            loadWorlds(users, worlds);
        }
    };
    loadNextContact();
};

////////////
// WORLDS //
////////////

var loadWorlds = function(users, worlds){
    var currentWorld = -1;
    var loadNextWorld = function(){
        console.log("  Finished Loading World " + (currentWorld + 1) + " of " + worlds.length);
        currentWorld++;
        if (currentWorld < worlds.length){
            var nextWorld = worlds[currentWorld];
            worldAPI.loadWorld(nextWorld, users, SERVER_URL, ADMIN_PASSWORD, loadNextWorld);
        } else {
            loadWorldGroupMemberships(users, worlds);
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
            worldAPI.loadGroupMembership(nextWorld, users, SERVER_URL, ADMIN_PASSWORD, loadNextWorldGroupMembership);
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