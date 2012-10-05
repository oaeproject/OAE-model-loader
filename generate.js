var argv = require('optimist')
    .usage('Usage: $0 -b <number of batches to generate> [-u <number of users>] [-g <number of groupss>]')
    
    .demand('b')
    .alias('b', 'batches')
    .describe('b', 'Number of batches to generate')
    
    .demand('t')
    .alias('t', 'tenant')
    .describe('t', 'Tenant alias')
    
    .alias('u', 'users')
    .describe('u', 'Number of users per batch')
    .default('u', 500)
    
    .alias('g', 'groups')
    .describe('g', 'Number of groups per batch')
    .default('g', 250)

    .alias('c', 'content')
    .describe('c', 'Number of content items per batch')
    .default('c', 1000)
    .argv;


var fs = require('fs');

var general = require('./api/general.js');
var user = require('./api/user.generate.js');
var group = require('./api/group.generate.js');
var content = require('./api/content.generate.js');

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = 'scripts';

var TOTAL_BATCHES = argv.batches;
var TENANT_ALIAS = argv.tenant;
var USERS_PER_BATCH = argv.users;
var GROUPS_PER_BATCH = argv.groups;
var CONTENT_PER_BATCH = argv.content;

////////////////////
// KICK OFF BATCH //
////////////////////

var batches = [];

var run = function() {
    for (var i = 0; i < TOTAL_BATCHES; i++) {
        var batch = generateBatch(i);

        // Write users to file
        general.writeObjectToFile('./' + SCRIPT_FOLDER + '/users/' + i + '.txt', batch.users);
        // Write groups to file
        general.writeObjectToFile('./' + SCRIPT_FOLDER + '/groups/' + i + '.txt', batch.groups);
        // Write content to file
        general.writeObjectToFile('./' + SCRIPT_FOLDER + '/content/' + i + '.txt', batch.content);

        batches.push(batch);
    }
};

var generateBatch = function(id) {
    console.time('Finished Generating Batch ' + id);
    console.log('Generating Batch ' + id);
    var batch = {
        users: {},
        groups: {},
        content: {}
    };
    // Generate users
    for (var u = 0; u < USERS_PER_BATCH; u++) {
        var newUser = new user.User(id, TENANT_ALIAS);
        batch.users[newUser.id] = newUser;
    }
    // Generate groups
    for (var g = 0; g < GROUPS_PER_BATCH; g++) {
        var newGroup = new group.Group(id, batch.users, TENANT_ALIAS);
        batch.groups[newGroup.id] = newGroup;
    }
    batch.groups = group.setGroupMemberships(id, batch.groups, batch.users);
    // Generate content
    for (var c = 0; c < CONTENT_PER_BATCH; c++) {
        var newContent = new content.Content(id, batch.users, batch.groups);
        batch.content[newContent.id] = newContent;
    }
    console.timeEnd('Finished Generating Batch ' + id);
    console.log('=================================');
    return batch;
};

var checkDirectories = function() {
    general.createFolder('scripts');
    general.createFolder('scripts/users');
    general.createFolder('scripts/groups');
    general.createFolder('scripts/content');
    general.createFolder('results');
};

var init = function() {
    checkDirectories();
    run();
};

init();
