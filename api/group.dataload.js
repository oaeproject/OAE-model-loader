/*
 * Copyright 2012 Sakai Foundation (SF) Licensed under the
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
var Canvas = require('canvas');
var fs = require('fs');

var general = require('./general.js');

//////////////
// USER API //
//////////////

exports.loadGroup = function(group, users, SERVER_URL, callback) {
    createGroup(group, users, SERVER_URL, function() {
        uploadProfilePicture(group, users, SERVER_URL, callback);
    });
};

exports.loadGroupMembership = function(group, users, SERVER_URL, callback) {
    addGroupMembers(group, users, SERVER_URL, callback);
};

var createGroup = function(group, users, SERVER_URL, callback) {
    var groupObj = {
        'alias': group.groupid,
        'name': group.name,
        'visibility': group.visibility,
        'joinable': group.joinable
    }
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
    };
    for (var m = 0; m < group.roles['manager'].groups.length; m++) {
        groupMembers[group.roles['manager'].groups[m]] = 'manager';
    };
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
        // Upload the pic.
        var filename = group.picture.picture;
        var path = './data/pictures/groups/' + filename;
        general.filePost(SERVER_URL + '/api/group/' + group.id + '/picture', path, filename, {
                'auth': users[group.creator],
                'telemetry': 'Upload group profile picture',
                'params': {}
            }, function(body, success) {
                // Crop the pic.
                var pic = fs.readFileSync(path);
                var img = new Canvas.Image();
                img.src = pic;
                var dimension = img.width > img.height ? img.height : img.width;
                general.urlReq(SERVER_URL + '/api/crop', {
                    'method': 'POST',
                    'params': {
                        'principalId': group.id,
                        'x': 0,
                        'y': 0,
                        'width': dimension
                    },
                    'auth': users[group.creator],
                    'telemetry': 'Crop group profile picture'
                }, function(body, success) {
                    callback();
                });
            });
    } else {
        callback();
    }
};
