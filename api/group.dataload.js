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

exports.loadGroup = function(group, users, SERVER_URL, callback) {
    createGroup(group, users, SERVER_URL, function(body, success, res) {
        if (success) {
            try {
                group.originalid = group.id;
                group.id = group.generatedid = JSON.parse(body).id;
            } catch (ex) {
                console.error('Error parsing create group HTTP response:');
                console.error(body);

                // Rethrowing since missing users will cascade wildfire through the rest of the data-load process
                throw ex;
            }
        }
        uploadProfilePicture(group, users, SERVER_URL, callback);
    });
};

exports.loadGroupMembership = function(group, users, SERVER_URL, callback) {
    addGroupMembers(group, users, SERVER_URL, callback);
};

var createGroup = function(group, users, SERVER_URL, callback) {
    var groupObj = {
        'displayName': group.name,
        'visibility': group.visibility,
        'joinable': group.joinable
    };
    if (group.hasDescription) {
        groupObj['description'] = group.description;
    }
    if (group.roles['member'].users.length) {
        groupObj['members'] = group.roles['member'].users;
    }
    if (group.roles['manager'].users.length) {
        groupObj['managers'] = group.roles['manager'].users;
    }
    general.urlReq(SERVER_URL + '/api/group/create', {
        method: 'POST',
        params: groupObj,
        auth: users[group.creator],
        telemetry: 'Create group'
    }, callback);
};

var addGroupMembers = function(group, users, SERVER_URL, callback) {
    var groupMembers = {};

    for (var m = 0; m < group.roles['member'].groups.length; m++) {
        groupMembers[group.roles['member'].groups[m]] = 'member';
    }

    for (var m = 0; m < group.roles['manager'].groups.length; m++) {
        groupMembers[group.roles['manager'].groups[m]] = 'manager';
    }

    if (_.keys(groupMembers).length > 0) {
        general.urlReq(SERVER_URL + '/api/group/' + group.id + '/members', {
            method: 'POST',
            params: groupMembers,
            auth: users[group.creator],
            telemetry: 'Add group members'
        }, callback);
    } else {
        callback();
    }
};

var uploadProfilePicture = function(group, users, SERVER_URL, callback) {
    if (group.picture.hasPicture) {
        var filename = group.picture.picture;
        general.uploadProfilePicture('group', group.id, users[group.creator], filename, SERVER_URL, callback);
    } else {
        callback();
    }
};
