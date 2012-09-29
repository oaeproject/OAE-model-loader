var argv = require('optimist')
    .usage('Usage: $0 -b <number of batches to generate> [-u <number of users>] [-w <number of worlds>]')
    
    .demand('b')
    .alias('b', 'batches')
    .describe('b', 'Number of batches to generate')
    
    .demand('t')
    .alias('t', 'tenant')
    .describe('t', 'Tenant alias')
    
    .alias('u', 'users')
    .describe('u', 'Number of users per batch')
    .default('u', 500)
    
    .alias('w', 'worlds')
    .describe('w', 'Number of worlds per batch')
    .default('w', 250)

    .alias('c', 'content')
    .describe('c', 'Number of content items per batch')
    .default('c', 1000)
    .argv;


var fs = require("fs");

var general = require("./api/general.js");
var user = require("./api/user.generate.js");
var world = require("./api/world.generate.js");
var content = require('./api/content.generate.js');

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = "scripts";

var TOTAL_BATCHES = argv.batches;
var TENANT_ALIAS = argv.tenant;
var USERS_PER_BATCH = argv.users;
var WORLDS_PER_BATCH = argv.worlds;
var CONTENT_PER_BATCH = argv.content;

////////////////////
// KICK OFF BATCH //
////////////////////

var batches = [];

var run = function(){
    for (var i = 0; i < TOTAL_BATCHES; i++){
        var batch = generateBatch(i);

        // Write users to file
        general.writeObjectToFile("./" + SCRIPT_FOLDER + "/users/" + i + ".txt", batch.users);
        // Write worlds to file
        general.writeObjectToFile("./" + SCRIPT_FOLDER + "/worlds/" + i + ".txt", batch.worlds);
        // Write content to file
        general.writeObjectToFile("./" + SCRIPT_FOLDER + "/content/" + i + ".txt", batch.content);

        batches.push(batch);
    }
};

var generateBatch = function(id){
    console.log("Generating Batch " + id);
    var batch = {
        users: {},
        worlds: {},
        content: {}
    };
    // Generate users
    for (var u = 0; u < USERS_PER_BATCH; u++) {
        var newUser = new user.User(id, TENANT_ALIAS)
        batch.users[newUser.id] = newUser;
    }
    // Generate worlds
    for (var w = 0; w < WORLDS_PER_BATCH; w++) {
        var newWorld = new world.World(id, batch.users, TENANT_ALIAS);
        batch.worlds[newWorld.id] = newWorld;
    }
    batch.worlds = world.setWorldMemberships(id, batch.worlds, batch.users);
    // Generate content
    for (var c = 0; c < CONTENT_PER_BATCH; c++) {
        var newContent = new content.Content(id, batch.users, batch.worlds);
        batch.content[newContent.id] = newContent;
    }
    console.log("Finished Generating Batch " + id);
    console.log("=================================");
    return batch;
};

var checkDirectories = function() {
    general.createFolder("scripts");
    general.createFolder("scripts/users");
    general.createFolder("scripts/worlds");
    general.createFolder("scripts/content");
};

var init = function() {
    checkDirectories();
    run();
};

init();
