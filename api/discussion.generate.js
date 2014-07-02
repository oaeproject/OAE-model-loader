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
var fs = require('fs');

var general = require('./general.js');
var messageGenerator = require('./message.generate.js');

///////////////////////////
// DISCUSSION PARAMETERS //
///////////////////////////

var DISTRIBUTIONS = {
    'NAME': [2, 1, 1, 15],
    'DESCRIPTION': [2, 2, 1, 25],
    'VISIBILITY': [[0.3, 'public'], [0.3, 'loggedin'], [0.4, 'private']],
    'CREATOR': [[0.3, 'student'], [0.35, 'lecturer'], [0.35, 'researcher']],
    'ROLES': {
        'manager': {
            'TOTAL_USERS': [3, 2, 0, 25],
            'TOTAL_GROUPS': [1, 3, 0, 5],
            'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
        },
        'member': {
            'TOTAL_USERS': [5, 3, 0, 500],
            'TOTAL_GROUPS': [0, 5, 0, 15],
            'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
        }
    },
    'HAS_MESSAGES': [[0.5, true], [0.5, false]],
    'NR_OF_MESSAGES': [4, 2, 1, 50],
    'MESSAGE_LENGTH': [8, 1, 1, 200]
};

//////////////////////
// Discussion Model //
//////////////////////

exports.Discussion = function(batchid, users, groups) {
    var that = {};

    that.name = general.generateKeywords(general.ASM(DISTRIBUTIONS.NAME)).join(' ');
    that.name = that.name[0].toUpperCase() + that.name.substring(1);
    that.id = general.generateId(batchid, [that.name.toLowerCase().split(' ')]).replace(/[^a-zA-Z 0-9]+/g,'-');

    that.description = general.generateSentence(general.ASM(DISTRIBUTIONS.DESCRIPTION));
    that.visibility = general.randomize(DISTRIBUTIONS.VISIBILITY);

    // Fill up the creator role
    var creatorRole = general.randomize(DISTRIBUTIONS.CREATOR);
    var allmembers = [];
    var distribution = [];
    for (var u in users) {
        var user = users[u];
        if (user.userType === creatorRole) {
            distribution.push([user.contentWeighting, user.id]);
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

    // Generate the user distributions. As we cannot share a discussion with private users, we filter them out
    var userDistributions = {};
    _.chain(users).filter(function(user) {
        return (user.visibility !== 'private');
    }).each(function(user) {
        if (user.id !== that.creator) {
            userDistributions[user.userType] = userDistributions[user.userType] || [];
            userDistributions[user.userType].push([user.contentWeighting, user.id]);
        }
    });

    // For now, only add groups that are either non-private or that the creator is a direct member of
    var shareableGroups = _.chain(groups).filter(function(group) {
        return ((group.visibility !== 'private') || (_.contains(group.roles['member'].users, that.creator)) || (_.contains(group.roles['manager'].users, that.creator)));
    }).pluck('id').value();

    // Fill up the managers and members
    that.roles = {};
    for (var i in DISTRIBUTIONS.ROLES) {
        that.roles[i] = {
            totalUsers: general.ASM(DISTRIBUTIONS.ROLES[i].TOTAL_USERS),
            totalGroups: general.ASM(DISTRIBUTIONS.ROLES[i].TOTAL_GROUPS),
            users: [],
            groups: []
        };

        // Take a copy of the potential shareable groups so we can pluck them out as we add groups
        // as members of the discussion
        var currentShareableGroups = shareableGroups.slice();

        // Fill up the users
        for (var m = 0; m < that.roles[i].totalUsers; m++) {
            var type = general.randomize(DISTRIBUTIONS.ROLES[i].DISTRIBUTION);
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
                    if (userDistributions[type][d][1] === userToAdd) {
                        userDistributions[type].splice(d, 1);
                        break;
                    }
                }
            }
        }
        // Fill up the groups
        for (var m = 0; m < that.roles[i].totalGroups; m++) {
            var randomGroup = currentShareableGroups[Math.floor(Math.random() * currentShareableGroups.length)];
            if (randomGroup) {
                currentShareableGroups = _.without(currentShareableGroups, randomGroup);
                that.roles[i].groups.push(randomGroup);
                allmembers.push(randomGroup);
            }
        }
    }

    that.hasMessages = general.randomize(DISTRIBUTIONS.HAS_MESSAGES);
    if (that.hasMessages) {
        that.messages = messageGenerator.generateMessages(DISTRIBUTIONS.NR_OF_MESSAGES, DISTRIBUTIONS.MESSAGE_LENGTH);
    } else {
        that.messages = [];
    }

    return that;
};


var getFile = function(type, size) {
    var dir = "./data/content/" + size + "/" + type;
    var files = fs.readdirSync(dir);

    // Remove any files that start with a '.'
    files = _.reject(files, function(file) { return file.indexOf('.') === 0; });

    // Don't use the filename, but generate a random title
    var filename = files[Math.floor(Math.random() * files.length)];
    var title = general.generateKeywords(general.ASM([3, 1, 1, 5])).join(' ');
    return {'path': dir + "/" + filename, 'name': title};
};
