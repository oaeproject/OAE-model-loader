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
    .usage('Usage: $0 -b 9 [-s 0] [-h "http://localhost:8080"] [-p admin] [-c 1]')

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
    .argv;

var _ = require('underscore');

var general = require('./api/general.js');
var userAPI = require('./api/user.dataload.js');
var groupAPI = require('./api/group.dataload.js');
var collectionAPI = require('./api/collection.dataload.js');
var contentAPI = require('./api/content.dataload.js');
var discussionsAPI = require('./api/discussion.dataload.js');

//////////////////////////////////////
// OVERALL CONFIGURATION PARAMETERS //
//////////////////////////////////////

var SCRIPT_FOLDER = 'scripts';

var BATCHES = argv['end-batch'];
var SERVER_URL = argv['server-url'];
var ADMIN_PASSWORD = argv['admin-pw'];
var CONCURRENT_BATCHES = argv['concurrent-batches'];

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
    'groups': {},
    'collections': {},
    'content': {},
    'discussions': {}
};

console.time("Finished running data loader");

var loadNextBatch = function() {
    currentBatch++;

    idMappings['users'][currentBatch] = {};
    idMappings['groups'][currentBatch] = {};
    idMappings['collections'][currentBatch] = {};
    idMappings['content'][currentBatch] = {};
    idMappings['discussions'][currentBatch] = {};

    if (currentBatch < BATCHES) {
        console.log('Loading Batch ' + currentBatch);
        // Load the data from the model
        var users = general.loadJSONFileIntoObject('./scripts/users/' + currentBatch + '.txt');
        var groups = general.loadJSONFileIntoObject('./scripts/groups/' + currentBatch + '.txt');
        var collections = general.loadJSONFileIntoObject('./scripts/collections/' + currentBatch + '.txt');
        var content = general.loadJSONFileIntoObject('./scripts/content/' + currentBatch + '.txt');
        var discussions = general.loadJSONFileIntoObject('./scripts/discussions/' + currentBatch + '.txt');

        batches.push({
            'users': users,
            'groups': groups,
            'collections': collections,
            'content': content,
            'discussions': discussions
        });
        loadUsers(users, groups, content, discussions, collections, currentBatch);
    } else {
        finishedAllBatches();
    }
};

var finishBatch = function(currentBatch) {
    console.log('Finished Loading Batch ' + currentBatch);
    console.log('=================================');
    loadNextBatch();
};

var finishedAllBatches = function() {
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

///////////
// USERS //
///////////

var loadUsers = function(users, groups, content, discussions, collections, currentBatch) {
    var currentUser = -1;
    var usersToLoad = _.values(users);
    var loadNextUser = function() {
        currentUser++;
        if (currentUser < usersToLoad.length) {
            var nextUser = usersToLoad[currentUser];
            userAPI.loadUser(nextUser, SERVER_URL, function() {
                if (!nextUser.originalid || !nextUser.generatedid) {
                    console.log('    Warning: User "%s" was not assigned a generated id.', nextUser.id);
                } else {
                    idMappings['users'][currentBatch][nextUser.originalid] = {
                        id: nextUser.originalid,
                        generatedId: nextUser.generatedid
                    };
                }

                loadNextUser();
            });
            if (currentUser % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading User ' + currentUser + ' of ' + usersToLoad.length);
            }
        } else {
            general.writeObjectToFile('./scripts/generatedIds/users-' + currentBatch + '.txt', idMappings['users'][currentBatch]);
            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + usersToLoad.length + ' Users');
            return loadFollowing(users, groups, content, discussions, collections, currentBatch);
        }
    };
    loadNextUser();
};

var loadFollowing = function(users, groups, content, discussions, collections, currentBatch) {
    var currentUser = -1;
    var usersFollowingToLoad = _.values(users);
    var loadNextUserFollowing = function() {
        currentUser++;
        if (currentUser >= usersFollowingToLoad.length) {
            console.log('  ' + new Date().toUTCString() + ': Finished Loading Followers for ' + usersFollowingToLoad.length + ' Users');
            return loadGroups(users, groups, content, discussions, collections, currentBatch);
        }

        userAPI.loadFollowing(usersFollowingToLoad[currentUser], users, SERVER_URL, loadNextUserFollowing);
    };
    loadNextUserFollowing();
};

////////////
// GROUPS //
////////////

var loadGroups = function(users, groups, content, discussions, collections, currentBatch) {
    var currentGroup = -1;
    var groupsToLoad = _.values(groups);
    var loadNextGroup = function() {
        currentGroup++;
        if (currentGroup < groupsToLoad.length) {
            var nextGroup = groupsToLoad[currentGroup];

            // convert all group membership ids to the generated user ids
            for (var role in nextGroup.roles) {
                nextGroup.roles[role].users = _.map(nextGroup.roles[role].users, function(originalUserId) {
                    if (idMappings['users'][currentBatch][originalUserId]) {
                        return idMappings['users'][currentBatch][originalUserId].generatedId;
                    } else {
                        console.log('    Warning: Could not map group membership for user "%s"', originalUserId);
                        return originalUserId;
                    }
                });
            }

            groupAPI.loadGroup(nextGroup, users, SERVER_URL, function() {
                if (!nextGroup.originalid || !nextGroup.generatedid) {
                    console.log('    Warning: User "%s" was not assigned a generated id.', nextGroup.id);
                } else {
                    idMappings['groups'][currentBatch][nextGroup.originalid] = {
                        id: nextGroup.originalid,
                        generatedId: nextGroup.generatedid
                    };
                }

                loadNextGroup();
            });
            if (currentGroup % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading Group ' + currentGroup + ' of ' + groupsToLoad.length);
            }
        } else {
            general.writeObjectToFile('./scripts/generatedIds/groups-' + currentBatch + '.txt', idMappings['groups'][currentBatch]);
            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + groupsToLoad.length + ' Groups');
            loadGroupMemberships(users, groups, content, discussions, collections, currentBatch);
        }
    };
    loadNextGroup();
};

var loadGroupMemberships = function(users, groups, content, discussions, collections, currentBatch) {
    var currentGroupMembership = -1;
    var groupsToLoad = _.values(groups);
    var loadNextGroupMembership = function() {
        currentGroupMembership++;
        if (currentGroupMembership < groupsToLoad.length) {
            var nextGroup = groupsToLoad[currentGroupMembership];

            // Map the original group ids to the generated group ids
            nextGroup.roles.member.groups = _.map(nextGroup.roles.member.groups, function(originalGroupId) {
                return idMappings['groups'][currentBatch][originalGroupId].generatedId;
            });

            nextGroup.roles.manager.groups = _.map(nextGroup.roles.manager.groups, function(originalGroupId) {
                return idMappings['groups'][currentBatch][originalGroupId].generatedId;
            });

            groupAPI.loadGroupMembership(nextGroup, users, SERVER_URL, loadNextGroupMembership);
            if (currentGroupMembership % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading Group Memberships ' + currentGroupMembership + ' of ' + groupsToLoad.length);
            }
        } else {
            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + groupsToLoad.length + 'Group Memberships');
            loadContent(users, groups, content, discussions, collections, currentBatch);
        }
    };
    loadNextGroupMembership();
};

/////////////
// CONTENT //
/////////////

var loadContent = function(users, groups, content, discussions, collections, currentBatch) {
    var currentContent = -1;
    var contentToLoad = _.values(content);
    var loadNextContent = function() {
        currentContent++;
        if (currentContent < contentToLoad.length) {
            var nextContent = contentToLoad[currentContent];

            // convert all content membership ids to the generated user ids
            for (var role in nextContent.roles) {
                nextContent.roles[role].users = _.map(nextContent.roles[role].users, function(originalUserId) {
                    if (idMappings['users'][currentBatch][originalUserId]) {
                        return idMappings['users'][currentBatch][originalUserId].generatedId;
                    } else {
                        console.log('    Warning: Could not map content membership for user "%s"', originalUserId);
                        return originalUserId;
                    }
                });
                nextContent.roles[role].groups = _.map(nextContent.roles[role].groups, function(originalGroupId) {
                    if (idMappings['groups'][currentBatch][originalGroupId]) {
                        return idMappings['groups'][currentBatch][originalGroupId].generatedId;
                    } else {
                        console.log('    Warning: Could not map content membership for user "%s"', originalGroupId);
                        return originalGroupId;
                    }
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
            loadDiscussions(users, groups, content, discussions, collections, currentBatch);
        }
    };
    loadNextContent();
};

/////////////////
// DISCUSSIONS //
/////////////////

var loadDiscussions = function(users, groups, content, discussions, collections, currentBatch) {
    var currentDiscussion = -1;
    var discussionsToLoad = _.values(discussions);
    var loadNextDiscussion = function() {
        currentDiscussion++;
        if (currentDiscussion < discussionsToLoad.length) {
            var nextDiscussion = discussionsToLoad[currentDiscussion];

            // convert all discussions membership ids to the generated user ids
            for (var role in nextDiscussion.roles) {
                nextDiscussion.roles[role].users = _.map(nextDiscussion.roles[role].users, function(originalUserId) {
                    if (idMappings['users'][currentBatch][originalUserId]) {
                        return idMappings['users'][currentBatch][originalUserId].generatedId;
                    } else {
                        console.log('    Warning: Could not map discussions membership for user "%s"', originalUserId);
                        return originalUserId;
                    }
                });

                nextDiscussion.roles[role].groups = _.map(nextDiscussion.roles[role].groups, function(originalUserId) {
                    if (idMappings['groups'][currentBatch][originalUserId]) {
                        return idMappings['groups'][currentBatch][originalUserId].generatedId;
                    } else {
                        console.log('    Warning: Could not map discussions membership for group "%s"', originalUserId);
                        return originalUserId;
                    }
                });
            }

            discussionsAPI.loadDiscussion(nextDiscussion, users, groups, SERVER_URL, function() {
                idMappings['discussions'][currentBatch][nextDiscussion.originalid] = {
                    id: nextDiscussion.originalid,
                    generatedId: nextDiscussion.generatedid
                };

                loadNextDiscussion();
            });

            if (currentDiscussion % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading Discussion ' + currentDiscussion + ' of ' + discussionsToLoad.length);
            }
        } else {
            general.writeObjectToFile('./scripts/generatedIds/discussions-' + currentBatch + '.txt', idMappings['discussions'][currentBatch]);

            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + discussionsToLoad.length + ' Discussions');
            return loadCollections(users, groups, content, discussions, collections, currentBatch);
        }
    };
    loadNextDiscussion();
};

/////////////////
// COLLECTIONS //
/////////////////

var loadCollections = function(users, groups, content, discussions, collections, currentBatch) {
    var currentCollectionIndex = -1;
    var collectionsToLoad = _.values(collections);
    var loadNextCollection = function() {
        currentCollectionIndex++;
        if (currentCollectionIndex >= collectionsToLoad.length) {
            general.writeObjectToFile('./scripts/generatedIds/collections-' + currentBatch + '.txt', idMappings['collections'][currentBatch]);

            console.log('  ' + new Date().toUTCString() + ': Finished Loading ' + collectionsToLoad.length + ' Collections');
            return finishBatch(currentBatch);
        }

        var nextCollection = collectionsToLoad[currentCollectionIndex];

        // Convert all collections membership ids to the generated user and group ids
        _.each(nextCollection.roles, function(membership, role) {
            membership.users = _.map(membership.users, function(originalUserId) {
                if (idMappings.users[currentBatch][originalUserId]) {
                    return idMappings.users[currentBatch][originalUserId].generatedId;
                } else {
                    console.log('    Warning: Could not map collection membership for user "%s"', originalUserId);
                    return originalUserId;
                }
            });

            membership.groups = _.map(membership.groups, function(originalGroupId) {
                if (idMappings.groups[currentBatch][originalGroupId]) {
                    return idMappings.groups[currentBatch][originalGroupId].generatedId;
                } else {
                    console.log('    Warning: Could not map collection membership for group "%s"', originalGroupId);
                    return originalGroupId;
                }
            });
        });

        // Convert all content ids to the generated server content ids
        nextCollection.contentIds = _.map(nextCollection.contentIds, function(originalContentId) {
            if (idMappings.content[currentBatch][originalContentId]) {
                return idMappings.content[currentBatch][originalContentId].generatedId;
            } else {
                console.log('    Warning: Could not map content item id for collection "%s"', originalContentId);
            }
        });

        collectionAPI.loadCollection(nextCollection, users, groups, content, SERVER_URL, function() {
            idMappings.collections[currentBatch][nextCollection.originalid] = {
                'id': nextCollection.originalid,
                'generatedId': nextCollection.generatedid
            };

            if (currentCollectionIndex % 10 === 0) {
                console.log('  ' + new Date().toUTCString() + ': Finished Loading Collection ' + currentCollectionIndex + ' of ' + collectionsToLoad.length);
            }

            return loadNextCollection();
        });
    };

    loadNextCollection();
};

///////////
// START //
///////////

general.createFolder('./scripts/generatedIds');

console.time('Loading Batches');

for (var b = 0; b < CONCURRENT_BATCHES; b++) {
    loadNextBatch();
}
