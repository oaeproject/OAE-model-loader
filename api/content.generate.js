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


// Read the content directory here once,
// so we don't need to read it for every piece of content.
var DIR = './data/content/';
var FILES = fs.readdirSync(DIR);

// Remove any files that start with a '.'
FILES = _.reject(FILES, function(file) { return file.indexOf('.') === 0; });


////////////////////////
// CONTENT PARAMETERS //
////////////////////////

var DISTRIBUTIONS = {
    'link': {
        'NAME': [2, 1, 1, 15],
        'HAS_DESCRIPTION': [[0.6, true], [0.4, false]],
        'DESCRIPTION': [2, 2, 1, 25],
        'VISIBILITY': [[0.7, 'public'], [0.2, 'loggedin'], [0.1, 'private']],
        'TYPE': [[0.30, 'youtube'], [0.70, 'other']],
        'CREATOR': [[0.3, 'student'], [0.35, 'lecturer'], [0.35, 'researcher']],
        'ROLES': {
            'manager': {
                'TOTAL_USERS': [3, 2, 0, 25],
                'TOTAL_GROUPS': [1, 3, 0, 5],
                'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
            },
            'viewer': {
                'TOTAL_USERS': [5, 10, 0, 500],
                'TOTAL_GROUPS': [0, 5, 0, 15],
                'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
            }
        },
        'HAS_MESSAGES': [[0.6, true], [0.4, false]],
        'NR_OF_MESSAGES': [2, 1, 1, 20],
        'MESSAGE_LENGTH': [8, 1, 1, 200]
    },
    'file': {
        'NAME': [2, 1, 1, 15],
        'HAS_DESCRIPTION': [[0.6, true], [0.4, false]],
        'DESCRIPTION': [2, 2, 1, 25],
        'VISIBILITY': [[0.3, 'public'], [0.3, 'loggedin'], [0.4, 'private']],
        'CREATOR': [[0.3, 'student'], [0.35, 'lecturer'], [0.35, 'researcher']],
        'ROLES': {
            'manager': {
                'TOTAL_USERS': [3, 2, 0, 25],
                'TOTAL_GROUPS': [1, 3, 0, 5],
                'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
            },
            'viewer': {
                'TOTAL_USERS': [5, 3, 0, 500],
                'TOTAL_GROUPS': [0, 5, 0, 15],
                'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
            }
        },
        'HAS_MESSAGES': [[0.7, true], [0.3, false]],
        'NR_OF_MESSAGES': [3, 1, 1, 25],
        'MESSAGE_LENGTH': [8, 1, 1, 200]
    },
    'collabdoc': {
        'NAME': [2, 1, 1, 15],
        'HAS_DESCRIPTION': [[0.6, true], [0.4, false]],
        'DESCRIPTION': [2, 2, 1, 25],
        'VISIBILITY': [[0.3, 'public'], [0.3, 'loggedin'], [0.4, 'private']],
        'CREATOR': [[0.3, 'student'], [0.35, 'lecturer'], [0.35, 'researcher']],
        'ROLES': {
            'manager': {
                'TOTAL_USERS': [3, 2, 0, 25],
                'TOTAL_GROUPS': [1, 3, 0, 5],
                'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
            },
            'viewer': {
                'TOTAL_USERS': [5, 3, 0, 500],
                'TOTAL_GROUPS': [0, 5, 0, 15],
                'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
            }
        },
        'HAS_MESSAGES': [[0.5, true], [0.5, false]],
        'NR_OF_MESSAGES': [4, 2, 1, 50],
        'MESSAGE_LENGTH': [8, 1, 1, 200]
    }
};

///////////////////
// Content Model //
///////////////////

exports.Content = function(batchid, users, groups) {
    var that = {};

    that.resourceSubType = general.randomize([[0.45, 'link'], [0.4, 'file'], [0.15, 'collabdoc']]);

    that.name = general.generateKeywords(general.ASM(DISTRIBUTIONS[that.resourceSubType].NAME)).join(' ');
    that.name = that.name[0].toUpperCase() + that.name.substring(1);
    that.id = general.generateId(batchid, [that.name.toLowerCase().split(' ')]).replace(/[^a-zA-Z 0-9]+/g,'-');

    that.hasDescription = general.randomize(DISTRIBUTIONS[that.resourceSubType].HAS_DESCRIPTION);
    if (that.hasDescription) {
        that.description = general.generateSentence(general.ASM(DISTRIBUTIONS[that.resourceSubType].DESCRIPTION));
    }

    that.visibility = general.randomize(DISTRIBUTIONS[that.resourceSubType].VISIBILITY);

    if (that.resourceSubType === 'link') {
        var type = general.randomize(DISTRIBUTIONS[that.resourceSubType].TYPE);
        that.link = general.generateUrl(type);
    } else if (that.resourceSubType === 'file') {
        var file = getFile();
        that.path = file.path;
        that.filename = file.name;
    }

    // Fill up the creator role
    var creatorRole = general.randomize(DISTRIBUTIONS[that.resourceSubType].CREATOR);
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

    // Generate the user distributions. As we cannot share a piece of content with private users, we filter them out
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

    // Fill up the managers and viewers
    that.roles = {};
    for (var i in DISTRIBUTIONS[that.resourceSubType].ROLES) {
        that.roles[i] = {
            totalUsers: general.ASM(DISTRIBUTIONS[that.resourceSubType].ROLES[i].TOTAL_USERS),
            totalGroups: general.ASM(DISTRIBUTIONS[that.resourceSubType].ROLES[i].TOTAL_GROUPS),
            users: [],
            groups: []
        };

        // Take a copy of the potential shareable groups so we can pluck them out as we add groups
        // as members of the discussion
        var currentShareableGroups = shareableGroups.slice();

        // Fill up the users
        for (var m = 0; m < that.roles[i].totalUsers; m++) {
            var type = general.randomize(DISTRIBUTIONS[that.resourceSubType].ROLES[i].DISTRIBUTION);
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
        for (m = 0; m < that.roles[i].totalGroups; m++) {
            var randomGroup = currentShareableGroups[Math.floor(Math.random() * currentShareableGroups.length)];
            if (randomGroup) {
                currentShareableGroups = _.without(currentShareableGroups, randomGroup);
                that.roles[i].groups.push(randomGroup);
                allmembers.push(randomGroup);
            }
        }
    }

    that.hasMessages = general.randomize(DISTRIBUTIONS[that.resourceSubType].HAS_MESSAGES);
    if (that.hasMessages) {
        that.messages = messageGenerator.generateMessages(DISTRIBUTIONS[that.resourceSubType].NR_OF_MESSAGES, DISTRIBUTIONS[that.resourceSubType].MESSAGE_LENGTH);
    } else {
        that.messages = [];
    }

    return that;
};

var getFile = function() {
    // Don't use the filename, but generate a random title
    var filename = FILES[Math.floor(Math.random() * FILES.length)];
    var title = general.generateKeywords(general.ASM([3, 1, 1, 5])).join(' ');
    return {'path': DIR + "/" + filename, 'name': title};
};

var generateComments = function(nrOfComments, commentLength) {
    var allComments = [];

    while (nrOfComments > 0) {
        var comment = generateComment(commentLength);

        // Find a comment to attach it to.
        // If the index === the length (ie: a non-existing comment), we stick it in the root.
        comment.replyTo = Math.floor(Math.random() * (allComments.length + 1));
        if (comment.replyTo === allComments.length) {
            comment.replyTo = 'root';
        }

        allComments.push(comment);
        nrOfComments--;
    }
    return allComments;
};

var generateComment = function(commentLength) {
    return {
        'message': general.generateSentence(general.ASM(commentLength))
    };
};
