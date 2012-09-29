var fs = require("fs");

var general = require("./general.js");
var userAPI = require("./user.dataload.js");

//////////////
// USER API //
//////////////

exports.loadWorld = function(world, users, SERVER_URL, callback){
    createWorld(world, users, SERVER_URL, function(){
        callback();
    });
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


/*exports.loadGroupMembership = function(world, users, SERVER_URL, callback){
    //addGroupMembers(world, users, SERVER_URL, ADMIN_PASSWORD, function(){
    //    sendGroupInvite(world, users, SERVER_URL, ADMIN_PASSWORD, function(){
            callback();
    //    });
    //});
};*/

/*

var addGroupMembers = function(world, users, SERVER_URL, ADMIN_PASSWORD, callback){
    var creator = userAPI.getUser(world.creator, users);
    var auth = creator.userid + ":" + creator.password;
    var requests = [];
    for (var r in world.roles){
        for (var g = 0; g < world.roles[r].groups.length; g++){
            requests.push({
                "url": "/system/userManager/group/" + world.id + "-" + r + ".update.json",
                "method":"POST",
                "parameters":{
                    ":member": world.roles[r].groups[g],
                    ":viewer": world.roles[r].groups[g],
                    "_charset_":"utf-8"
                },
                "_charset_":"utf-8"
            });
        }
    }
    if (requests.length){
        general.urlReq(SERVER_URL + "/system/batch", {
            method: 'POST',
            params: {"_charset_": "utf-8", "requests": JSON.stringify(requests)},
            auth: auth
        }, callback);
    } else {
        callback();
    }
};

*/
