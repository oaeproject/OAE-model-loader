var canvas = require('canvas');
var fs = require("fs");

var general = require("./general.js");
var userAPI = require("./user.api.js");

//////////////
// USER API //
//////////////

exports.loadWorld = function(world, users, SERVER_URL, ADMIN_PASSWORD, callback){
    createWorld(world, users, SERVER_URL, ADMIN_PASSWORD, function(){
        uploadWorldPicture(world, users, SERVER_URL, ADMIN_PASSWORD, function(){
            callback();
        });
    });
}

exports.loadGroupMembership = function(world, users, SERVER_URL, ADMIN_PASSWORD, callback){
    addGroupMembers(world, users, SERVER_URL, ADMIN_PASSWORD, function(){
        sendGroupInvite(world, users, SERVER_URL, ADMIN_PASSWORD, function(){
            callback();
        });
    });
}

var createWorld = function(world, users, SERVER_URL, ADMIN_PASSWORD, callback) {
    var creator = userAPI.getUser(world.creator, users);
    var auth = creator.userid + ":" + creator.password;
    var worldObject = {
        "id" : world.id,
        "title" : world.title,
        "visibility" : world.visibility,
        "joinability" : world.joinability,
        "worldTemplate" : "/var/templates/worlds/" + world.type + "/" + world.template,
        'schemaVersion': "2",
        "message" : {
            "body" : "Hi ${firstName},\n\n ${creatorName} has added you as a ${role} to the group \"${groupName}\".\n\n You can find it here: ${link}",
            "subject" : "${creatorName} has added you as a ${role} to the group \"${groupName}\".",
            "creatorName" : creator.firstName + " " + creator.lastName,
            "groupName" : world.title,
            "system" : "Sakai",
            "link" : SERVER_URL + "/~" + world.id,
            "toSend" : []
        },
        "tags" : [],
        "usersToAdd" : [],
        "description": world.hasDescription ? world.description : ""
    };
    if (world.hasTags){
        for (var t = 0; t < world.tags.length; t++){
            worldObject.tags.push(world.tags[t]);
        }
    }
    if (world.hasDirectory){
        for (var d = 0; d < world.directory.length; d++){
            worldObject.tags.push("directory/" + world.directory[d]);
        }
    }
    for (var r in world.roles){
        for (var u = 0; u < world.roles[r].users.length; u++){
            worldObject.usersToAdd.push({
                "userid": world.roles[r].users[u],
                "role": r
            });
            worldObject.message.toSend.push({
                "userid": world.roles[r].users[u],
                "firstName": userAPI.getUser(world.roles[r].users[u], users).firstName,
                "role": r,
                "messageMode": "both"
            });
        }
    }
    general.urlReq(SERVER_URL + "/system/world/create", {
        method: 'POST',
        params: {data: JSON.stringify(worldObject)},
        auth: auth
    }, function(res, success){
        callback();
    });
}

var uploadWorldPicture = function(world, users, SERVER_URL, ADMIN_PASSWORD, callback){
    if (world.picture.hasPicture){
         var auth = world.creator + ":" + userAPI.getUser(world.creator, users).password;
         // Upload to the server
         var picture = "./data/pictures/worlds/" + world.picture.picture;
         general.filePost(SERVER_URL + "/~" + world.id + "/public/profile", picture, world.picture.picture, {
             auth: auth
         }, function(res, success){
             // Calculate what to cut out
             var pic = fs.readFileSync(picture);
            img = new canvas.Image;
            img.src = pic;
            var dimension = img.width > img.height ? img.height : img.width;
            var cropit = {
                "_charset_": "utf-8",
                "dimensions": "256x256",
                "height": dimension,
                "width": dimension,
                "x": 0,
                "y": 0,
                "img": "/~" + world.id + "/public/profile/" + world.picture.picture,
                "save": "/~" + world.id + "/public/profile"
            }
            general.urlReq(SERVER_URL + "/var/image/cropit", {
                method: 'POST',
                params: cropit,
                auth: auth,
                ignoreFail: true
            }, function(res, success) {
                if (success){
                    // Update the authprofile
                    var profileData = {
                        "_charset_": "utf-8",
                        "name": "256x256_" + world.picture.picture,
                        "_name": world.picture.picture,
                        "selectedx1": 0,
                        "selectedy1": 0,
                        "selectedx2": dimension,
                        "selectedy2": dimension
                    }
                    general.urlReq(SERVER_URL + "/~" + world.id + "/public/authprofile.profile.json", {
                        method: 'POST',
                        params: {"picture": JSON.stringify(profileData)},
                        auth: auth
                    }, callback);
                } else {
                    callback();
                }
            });
         });
    } else {
        callback();
    }
}

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
            })
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
}

var sendGroupInvite = function(world, users, SERVER_URL, ADMIN_PASSWORD, callback){
    var creator = userAPI.getUser(world.creator, users);
    var auth = creator.userid + ":" + creator.password;
    var requests = [];
    for (var r in world.roles){
        for (var g = 0; g < world.roles[r].groups.length; g++){
            requests.push({
                "url": "/~" + creator.userid + "/message.create.html",
                "method":"POST",
                "parameters":{
                    "_charset_": "utf-8",
                    "sakai:body": "Hi " + world.roles[r].groups[g] + ", " + creator.firstName + " " + creator.lastName + " has added you as a Member to the group \"" + world.title + "\". You can find it here: " + SERVER_URL + "/~" + world.id,
                    "sakai:category": "message",
                    "sakai:from": creator.userid,
                    "sakai:messagebox": "outbox",
                    "sakai:sendstate": "pending",
                    "sakai:subject": creator.firstName + " " + creator.lastName + " has added you as a " + r + " to the group \"" + world.title + "\".",
                    "sakai:to": "internal:" + world.roles[r].groups[g],
                    "sakai:type": "internal"
                },
                "_charset_":"utf-8"
            });
            requests.push({
                "url": "/~" + creator.userid + "/message.create.html",
                "method":"POST",
                "parameters":{
                    "_charset_": "utf-8",
                    "sakai:body": "Hi " + world.roles[r].groups[g] + ", " + creator.firstName + " " + creator.lastName + " has added you as a Member to the group \"" + world.title + "\". You can find it here: " + SERVER_URL + "/~" + world.id,
                    "sakai:category": "message",
                    "sakai:from": creator.userid,
                    "sakai:messagebox": "pending",
                    "sakai:sendstate": "pending",
                    "sakai:subject": creator.firstName + " " + creator.lastName + " has added you as a " + r + " to the group \"" + world.title + "\".",
                    "sakai:templateParams": "sender=" + creator.firstName + " " + creator.lastName + "|system=Sakai|name=" + world.title + "|body= Hi " + world.roles[r].groups[g] + "," + creator.firstName + " " + creator.lastName + " has added you as a " + r + " to the group \"" + world.title + "\". You can find it here: " + SERVER_URL + "/~" + world.id + " |link=" + SERVER_URL + "/~" + world.id,
                    "sakai:templatePath": "/var/templates/email/group_invitation",
                    "sakai:to": "internal:" + world.roles[r].groups[g],
                    "sakai:type": "smtp"
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
}
