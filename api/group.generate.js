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

var _ = require('underscore');

var general = require('./general.js');

/////////////////////
// USER PARAMETERS //
/////////////////////

var DISTRIBUTIONS = {
    'group': {
        'TITLE': [2, 1, 1, 15],
        'HAS_METADATA': [[0.5, true], [0.5, false]],
        'HAS_DESCRIPTION': [[0.7, true], [0.3, false]],
        'DESCRIPTION': [2, 2, 1, 25],
        'VISIBILITY': [[0.4, 'public'], [0.2, 'loggedin'], [0.4, 'private']],
        'JOINABLE': [[0.4, 'yes'], [0.2, 'request'], [0.4, 'no']],
        'LIBRARY_SIZE': [[0.6, 'few'], [0.3, 'medium'], [0.1, 'lots']],
        'CREATOR': [[0.35, 'student'], [0.2, 'lecturer'], [0.45, 'researcher']],
        'CREATOR_ROLE': 'manager',
        'ROLES': {
            'manager': {
                'TOTAL_USERS': [5, 2, 0, 50],
                'TOTAL_GROUPS': [0, 0.05, 0, 3],
                'DISTRIBUTION': [[0.35, 'student'], [0.2, 'lecturer'], [0.45, 'researcher']]
            },
            'member': {
                'TOTAL_USERS': [10, 10, 0, 1000],
                'TOTAL_GROUPS': [0, 0.05, 0, 5],
                'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
            }
        },
        'CONTENT_WEIGHTING': [[0.2, 1], [0.6, 3], [0.2, 9]],
        'HAS_PICTURE': [[0.7, true], [0.3, false]]
    }
};

////////////////
// USER MODEL //
////////////////

exports.Group = function(batchid, users, TENANT_ALIAS) {
    var that = {};

    that.template = general.randomize([[1, 'group']]);
    that.name = general.generateKeywords(general.ASM(DISTRIBUTIONS[that.template].TITLE)).join(' ');
    that.name = that.name[0].toUpperCase() + that.name.substring(1);
    that.groupid = general.generateId(batchid, [that.name.toLowerCase().split(' ')]).replace(/[^a-zA-Z 0-9]+/g,'-');
    that.id = 'g:' + TENANT_ALIAS + ':' + that.groupid;

    that.visibility = general.randomize(DISTRIBUTIONS[that.template].VISIBILITY);
    that.joinable = general.randomize(DISTRIBUTIONS[that.template].JOINABLE);

    that.librarySize = general.randomize(DISTRIBUTIONS[that.template].LIBRARY_SIZE);

    // Fill up the creator role
    var creatorRole = general.randomize(DISTRIBUTIONS[that.template].CREATOR);
    var allmembers = [];
    var distribution = [];
    for (var u in users) {
        var user = users[u];
        if (user.userType === creatorRole) {
            distribution.push([user.groupWeighting, user.id]);
        }
    }
    if (distribution.length) {
        that.creator = general.randomize(distribution);
    } else {
        for (var u in users) {
            that.creator = users[u].id;
        }
    }
    allmembers.push(that.creator);

    // Generate the user distributions
    var userDistributions = {};
    for (var t in users) {
        var user = users[t];
        if (user.id !== that.creator) {
            userDistributions[user.userType] = userDistributions[user.userType] || [];
            userDistributions[user.userType].push([user.contentWeighting, user.id]);
        }
    }

    // Fill up the other roles
    that.roles = {};
    for (var i in DISTRIBUTIONS[that.template].ROLES) {
        that.roles[i] = {
            totalUsers: general.ASM(DISTRIBUTIONS[that.template].ROLES[i].TOTAL_USERS),
            totalGroups: general.ASM(DISTRIBUTIONS[that.template].ROLES[i].TOTAL_GROUPS),
            users: [],
            groups: []
        };
        for (var m = 0; m < that.roles[i].totalUsers; m++) {
            var type = general.randomize(DISTRIBUTIONS[that.template].ROLES[i].DISTRIBUTION);
            // Generate probability distribution
            var dist = userDistributions[type];
            if (dist.length === 0) {
                break;
            } else {
                // Select the user to add
                var userToAdd = general.randomize(dist);
                that.roles[i].users.push(userToAdd);
                allmembers.push(userToAdd);
                // Remove from the distributions
                for (var d = 0; d < userDistributions[type].length; d++) {
                    if (userDistributions[type][d] === userToAdd) {
                        userDistributions.splice(d, 1);
                        break;
                    }
                }
            }
        }
    }

    that.hasDescription = general.randomize(DISTRIBUTIONS[that.template].HAS_DESCRIPTION);
    that.description = general.generateSentence(general.ASM(DISTRIBUTIONS[that.template].DESCRIPTION));

    that.contentWeighting = general.randomize(DISTRIBUTIONS[that.template].CONTENT_WEIGHTING);


    that.picture = {
        hasPicture: general.randomize(DISTRIBUTIONS[that.template].HAS_PICTURE),
        picture: general.generateGroupPicture()
    };

    return that;
};

exports.setGroupMemberships = function(batchid, groups, users) {
    // For now, only add non-private groups as group members
    var nonPrivateGroups = [];
    for (var g in groups) {
        if (groups[g].visibility !== 'private') {
            nonPrivateGroups.push(g);
        }
    }

    for (var g in groups) {
        var group = groups[g];
        var availableGroups = nonPrivateGroups.slice(0);
        // Remove the current group from the list of available groups
        availableGroups = _.without(availableGroups, group.id);
        for (var r in group.roles) {
            for (var g = 0; g < group.roles[r].totalGroups; g++) {
                var randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
                // Make sure that this is no longer available for adding to the group
                availableGroups = _.without(availableGroups, randomGroup);
                group.roles[r].groups.push(randomGroup);
            }
        }
    }
    return groups;
};
