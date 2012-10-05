var _ = require('underscore');
var fs = require('fs');

var general = require('./general.js');

//////////////
// USER API //
//////////////

exports.loadGroup = function(group, users, SERVER_URL, callback) {
    createGroup(group, users, SERVER_URL, callback);
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
