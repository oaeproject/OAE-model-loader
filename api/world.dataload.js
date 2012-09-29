var _ = require('underscore');
var fs = require("fs");

var general = require("./general.js");
var userAPI = require("./user.dataload.js");

//////////////
// USER API //
//////////////

exports.loadWorld = function(world, users, SERVER_URL, callback){
    createWorld(world, users, SERVER_URL, callback);
};

exports.loadGroupMembership = function(world, users, SERVER_URL, callback){
    addGroupMembers(world, users, SERVER_URL, callback);
};

var createWorld = function(world, users, SERVER_URL, callback) {
    var worldObj = {
        'alias': world.worldid,
        'name': world.name,
        'visibility': world.visibility,
        'joinable': world.joinable
    }
    if (world.hasDescription) {
        worldObj['description'] = world.description;
    }
    if (world.roles['member'].users.length) {
        worldObj['members'] = world.roles['member'].users;
    }
    if (world.roles['manager'].users.length) {
        worldObj['managers'] = world.roles['manager'].users;
    }
    general.urlReq(SERVER_URL + '/api/group/create', {
        method: 'POST',
        params: worldObj,
        auth: users[world.creator]
    }, callback);
};

var addGroupMembers = function(world, users, SERVER_URL, callback) {
    var groupMembers = {};
    for (var m = 0; m < world.roles['member'].groups.length; m++) {
        groupMembers[world.roles['member'].groups[m]] = 'member';
    };
    for (var m = 0; m < world.roles['manager'].groups.length; m++) {
        groupMembers[world.roles['manager'].groups[m]] = 'manager';
    };
    if (_.keys(groupMembers).length > 0) {
        general.urlReq(SERVER_URL + "/api/group/" + world.id + "/members", {
            method: 'POST',
            params: groupMembers,
            auth: users[world.creator]
        }, callback);
    } else {
        callback();
    }
};
