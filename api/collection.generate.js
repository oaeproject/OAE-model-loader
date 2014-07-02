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

///////////////////////////
// DISCUSSION PARAMETERS //
///////////////////////////

var DISTRIBUTIONS = {
    'NAME': [2, 1, 1, 5],
    'DESCRIPTION': [2, 2, 1, 25],
    'VISIBILITY': [[0.3, 'public'], [0.3, 'loggedin'], [0.4, 'private']],
    'CREATOR': [[0.3, 'student'], [0.35, 'lecturer'], [0.35, 'researcher']],
    'ROLES': {
        'manager': {
            'TOTAL_USERS': [1, 1, 0, 3],
            'TOTAL_GROUPS': [1, 1, 0, 1],
            'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
        },
        'member': {
            'TOTAL_USERS': [2, 2, 0, 150],
            'TOTAL_GROUPS': [0, 5, 0, 15],
            'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
        }
    },
    'CONTENT': {
        'NUMBER_OF_ITEMS': [12, 8, 4, 150],     // Determines how many content items per collection
        'DISTRIBUTION': [50, 25, 0, 99]         // Determines the distribution of collection->content associations across all content items. Applies a normal distribution with 50% of content items accounting for 68% of collection->content associations
    }
};

/*!
 * Generates an ASM distribution that distributes how many collections a given content item will be
 * associated to. This is an arbitrary **secondary distribution**, in that that its result specifies
 * a distribution, however the concrete number of collection associations is determined primarily by
 * the average number of content items that belong to a collection (it is the inverse of this
 * distribution).
 *
 *  * 50% of the available content items consume 68% (1 stddev) of collection the associations
 *  * 5% of the available content items consume 8% (.1 stddev) of collection associations
 */
var _selectDistributedContentId = function(contentIds) {
    // Get a distribution of (avg: 50%; stddev: 25%; min: 0%; max: 100%) that is normalized to pick
    // an index between 0 and `numOfContentItems - 1`
    var avg = Math.floor(contentIds.length/2);
    var stddev = Math.floor(contentIds.length/12);
    var floor = 0;
    var cieling = contentIds.length - 1;

    // The result is the ASM selection from that distribution
    return contentIds[general.ASM([avg, stddev, floor, cieling])];
};

exports.Collection = function(batchid, users, groups, contentItems) {
    var that = {};

    that.name = general.generateKeywords(general.ASM(DISTRIBUTIONS.NAME)).join(' ');
    that.name = that.name[0].toUpperCase() + that.name.substring(1);
    that.id = general.generateId(batchid, [that.name.toLowerCase().split(' ')]).replace(/[^a-zA-Z 0-9]+/g,'-');

    that.description = general.generateSentence(general.ASM(DISTRIBUTIONS.DESCRIPTION));
    that.visibility = general.randomize(DISTRIBUTIONS.VISIBILITY);

    // Determine what role (student, lecturer, researcher) the creator of this collection should be
    var creatorRole = general.randomize(DISTRIBUTIONS.CREATOR);
    var distribution = _.chain(users)
        .filter(function(user, userId) {
            return (user.userType === creatorRole);
        })
        .map(function(user) {
            return [user.contentWeighting, user.id];
        })
        .value();

    if (_.isEmpty(distribution)) {
        // If there were no users of the creator role, simply pick the first user available
        that.creator =_.chain(users).values().first().value().id;
    } else {
        // Otherwise, use the distribution to find a user
        that.creator = general.randomize(distribution);
    }

    var allMembers = [that.creator];

    // Generate the user distributions with which collections will be shared. As we cannot share a
    // collection with private users, we filter them out
    var userDistributions = {};
    _.chain(users)
        .filter(function(user) {
            return (user.visibility !== 'private');
        })
        .filter(function(user) {
            return (user.id !== that.creator);
        })
        .each(function(user) {
            userDistributions[user.userType] = userDistributions[user.userType] || [];
            userDistributions[user.userType].push([user.contentWeighting, user.id]);
        });

    // For now, only add groups that are either non-private or of which the creator is a direct
    // member
    var shareableGroupIds = _.chain(groups)
        .filter(function(group) {
            return (
                (group.visibility !== 'private') ||
                (_.contains(group.roles.member.users, that.creator)) ||
                (_.contains(group.roles.manager.users, that.creator))
            );
        })
        .pluck('id')
        .value();

    // For now, only allow content items into the collection that are either non-private, or of
    // which the collection creator is a manager
    var addableContentIds = _.chain(contentItems)
        .filter(function(contentItem) {
            return (
                (contentItem.visibility !== 'private') ||
                (_.contains(contentItem.roles.manager.users, that.creator))
            );
        })
        .pluck('id')
        .value();

    // Fill up the managers and members
    that.roles = {};
    _.each(DISTRIBUTIONS.ROLES, function(roleDistributions, role) {
        that.roles[role] = {
            'totalUsers': general.ASM(roleDistributions.TOTAL_USERS),
            'totalGroups': general.ASM(roleDistributions.TOTAL_GROUPS),
            'users': [],
            'groups': []
        };

        // Take a copy of the potential shareable groups so we can pluck them out as we add groups
        // as members of the collection
        var currentShareableGroupIds = shareableGroupIds.slice();

        // Populate the user memberships by their weighted membership distribution
        for (var m = 0; m < that.roles[role].totalUsers; m++) {
            // Pick what type of user this user should be (student, lecturer or researcher), then
            // get a random user from the distribution specific to that type
            var type = general.randomize(roleDistributions.DISTRIBUTION);

            // Ensure we don't exceed the limit of users we have available for the collection
            if (_.isEmpty(userDistributions[type])) {
                console.warn('    Warning: Not sufficient users available to fill collection membership (%s wanted %s users)', that.id, that.roles[role].totalUsers);
                break;
            }

            var userId = general.randomize(userDistributions[type]);

            // Add the user to the list of users for the current role for the collection, as well as
            // the full list of members
            that.roles[role].users.push(userId);
            allMembers.push(userId);

            // Remove them from the list of potential users to choose from
            for (var i = 0; i < userDistributions[type].length; i++) {
                if (userDistributions[type][i][1] === userId) {
                    userDistributions[type].splice(i, 1);
                    break;
                }
            }
        }

        // Populate the group memberships by their weighted membership distribution
        for (m = 0; m < that.roles[role].totalGroups; m++) {
            var groupId = currentShareableGroupIds[Math.floor(Math.random() * currentShareableGroupIds.length)];
            that.roles[role].groups.push(groupId);
            allMembers.push(groupId);

            // Remove the group we just added from the potential list of shareable groups
            currentShareableGroupIds = _.without(currentShareableGroupIds, groupId);
        }
    });

    // Populate the content items into the collection
    that.contentIds = [];
    var numberOfContentItems = general.ASM(DISTRIBUTIONS.CONTENT.NUMBER_OF_ITEMS);
    var contentItemIds = _.keys(contentItems);
    for (var i = 0; i < numberOfContentItems; i++) {
        var contentId = _selectDistributedContentId(addableContentIds);
        that.contentIds.push(contentId);

        // Remove this content item from the list of content ids we can choose from for this
        // collection
        addableContentIds = _.without(addableContentIds, contentId);
    }

    return that;
};
