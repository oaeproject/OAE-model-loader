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
    .usage('Usage: $0 -b <number of batches to generate> -t <tenant alias> [-u <number of users>] [-g <number of groups>] [-c <number of content items]')

    .demand('b')
    .alias('b', 'batches')
    .describe('b', 'Number of batches to generate')

    .demand('t')
    .alias('t', 'tenant')
    .describe('t', 'Tenant alias')

    .alias('u', 'users')
    .describe('u', 'Number of users per batch')
    .default('u', 1000)

    .alias('g', 'groups')
    .describe('g', 'Number of groups per batch')
    .default('g', 2000)

    .alias('c', 'content')
    .describe('c', 'Number of content items per batch')
    .default('c', 5000)

    .alias('d', 'discussions')
    .describe('d', 'Number of discussion items per batch')
    .default('d', 5000)
    .argv;


var fs = require('fs');

var general = require('./api/general');
var user = require('./api/user.generate');
var group = require('./api/group.generate');
var content = require('./api/content.generate');
var discussion = require('./api/discussion.generate');

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = 'scripts';

var TOTAL_BATCHES = argv.batches;
var TENANT_ALIAS = argv.tenant;
var USERS_PER_BATCH = argv.users;
var GROUPS_PER_BATCH = argv.groups;
var CONTENT_PER_BATCH = argv.content;
var DISCUSSIONS_PER_BATCH = argv.discussions;

////////////////////
// KICK OFF BATCH //
////////////////////

var run = function() {
    for (var i = 0; i < TOTAL_BATCHES; i++) {
        var batch = generateBatch(i);

        // Write users to file
        general.writeObjectToFile('./' + SCRIPT_FOLDER + '/users/' + i + '.txt', batch.users);
        // Write groups to file
        general.writeObjectToFile('./' + SCRIPT_FOLDER + '/groups/' + i + '.txt', batch.groups);
        // Write content to file
        general.writeObjectToFile('./' + SCRIPT_FOLDER + '/content/' + i + '.txt', batch.content);
        // Write discussions to file
        general.writeObjectToFile('./' + SCRIPT_FOLDER + '/discussions/' + i + '.txt', batch.discussions);
    }
};

var generateBatch = function(id) {
    console.time('Finished Generating Batch ' + id);
    console.log('Generating Batch ' + id);
    var batch = {
        users: {},
        groups: {},
        content: {},
        discussions: {}
    };

    console.log('Generating users');
    for (var u = 0; u < USERS_PER_BATCH; u++) {
        var newUser = new user.User(id, TENANT_ALIAS);
        batch.users[newUser.id] = newUser;
    }

    console.log('Adding following');
    user.setFollowing(batch.users);

    console.log('Generating groups');
    for (var g = 0; g < GROUPS_PER_BATCH; g++) {
        var newGroup = new group.Group(id, batch.users, TENANT_ALIAS);
        batch.groups[newGroup.id] = newGroup;
    }

    console.log('Adding members');
    batch.groups = group.setGroupMemberships(id, batch.groups, batch.users);

    console.log('Generating content');
    for (var c = 0; c < CONTENT_PER_BATCH; c++) {
        var newContent = new content.Content(id, batch.users, batch.groups);
        batch.content[newContent.id] = newContent;
    }

    console.log('Generating discussions');
    for (var d = 0; d < DISCUSSIONS_PER_BATCH; d++) {
        var newDiscussion = new discussion.Discussion(id, batch.users, batch.groups);
        batch.discussions[newDiscussion.id] = newDiscussion;
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
    general.createFolder('scripts/discussions');
    general.createFolder('results');
};

var init = function() {
    checkDirectories();
    run();
};

init();
