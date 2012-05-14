var general = require("./api/general.js");
var user = require("./api/user.model.js");
var contacts = require("./api/contacts.model.js");
var world = require("./api/world.model.js");

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = "scripts";

var TOTAL_BATCHES = 5;
var USERS_PER_BATCH = 10; //1000;
var WORLDS_PER_BATCH = 25; //2500;
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
        // Write contacts to file
        general.writeFileIntoArray("./" + SCRIPT_FOLDER + "/contacts/" + i + ".txt", batch.contacts);
        // Write worlds to file
        general.writeFileIntoArray("./" + SCRIPT_FOLDER + "/worlds/" + i + ".txt", batch.worlds);
        // Write content to file
        // TODO
        // Write collections to file
        // TODO
        // Write sharing to file
        // TODO
        // Write areas to file
        // TODO
        // Write messages to file
        // TODO
        batches.push(batch);
    }
};

var generateBatch = function(id){
    console.log("Generating Batch " + id);
    var batch = {};
    batch.users = [];
    for (var u = 0; u < USERS_PER_BATCH; u++){
        try {
            batch.users.push(new user.User(id));
        } catch (err){u--;}
    }
    batch.contacts = contacts.generateContacts(batch.users);
    batch.worlds = [];
    for (var w = 0; w < WORLDS_PER_BATCH; w++){
        try {
            batch.worlds.push(new world.World(id, batch.users));
        } catch (err){w--;}
    }
    batch.worlds = world.setWorldMemberships(id, batch.worlds, batch.users);
    console.log("Finished Generating Batch " + id);
    console.log("=================================");
    return batch;
};

run();
