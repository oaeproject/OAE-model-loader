var argv = require('optimist')
    .usage('Usage: $0 -b <number of batches to generate> [-u <number of users>] [-w <number of worlds>]')
    
    .demand('b')
    .alias('b', 'batches')
    .describe('b', 'Number of batches to generate')
    
    .alias('u', 'users')
    .describe('u', 'Number of users per batch')
    .default('u', 500)
    
    .alias('w', 'worlds')
    .describe('w', 'Number of worlds per batch')
    .default('w', 250)
    .argv;

var fs = require("fs");
var general = require("./api/general.js");
var user = require("./api/user.model.js");
var world = require("./api/world.model.js");

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = "scripts";

var TOTAL_BATCHES = argv.batches;
var USERS_PER_BATCH = argv.users;
var WORLDS_PER_BATCH = argv.worlds;
var CONTENT_PER_BATCH = 0;
var COLLECTIONS_PER_BATCH = 0;

////////////////////
// KICK OFF BATCH //
////////////////////

var batches = [];

var run = function(){
    for (var i = 0; i < TOTAL_BATCHES; i++){
        var batch = generateBatch(i);
        // Write users to file
        general.writeFileIntoArray("./" + SCRIPT_FOLDER + "/users/" + i + ".txt", batch.users);
        // Write worlds to file
        general.writeFileIntoArray("./" + SCRIPT_FOLDER + "/worlds/" + i + ".txt", batch.worlds);

        batches.push(batch);
    }
};

var generateBatch = function(id){
    console.log("Generating Batch " + id);
    var batch = {};
    batch.users = [];
    for (var u = 0; u < USERS_PER_BATCH; u++){
        batch.users.push(new user.User(id));
    }
    batch.worlds = [];
    for (var w = 0; w < WORLDS_PER_BATCH; w++){
        batch.worlds.push(new world.World(id, batch.users));
    }
    batch.worlds = world.setWorldMemberships(id, batch.worlds, batch.users);
    console.log("Finished Generating Batch " + id);
    console.log("=================================");
    return batch;
};

var checkDirectories = function() {
    general.createFolder("scripts");
    general.createFolder("scripts/users");
    general.createFolder("scripts/worlds");
};

var init = function() {
    checkDirectories();
    run();
};

init();
