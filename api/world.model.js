var general = require("./general.js");

/////////////////////
// USER PARAMETERS //
/////////////////////

var DISTRIBUTIONS = {
    "group": {
        "TITLE": [2, 1, 1, 15],
        "HAS_METADATA": [[0.5, true], [0.5, false]],
        "HAS_DESCRIPTION": [[0.4, true], [0.6, false]],
        "DESCRIPTION": [2, 2, 1, 25],
        "VISIBILITY": [[0.4, "public"], [0.2, "logged-in-only"], [0.4, "members-only"]],
        "JOINABILITY": [[0.4, "yes"], [0.2, "withauth"], [0.4, "no"]],
        "LIBRARY_SIZE": [[0.6, "few"], [0.3, "medium"], [0.1, "lots"]],
        "CREATOR": [[0.35, "student"], [0.2, "lecturer"], [0.45, "researcher"]],
        "CREATOR_ROLE": "manager",
        "ROLES": {
            "manager": {
                "TOTAL_USERS": [5, 2, 0, 50],
                "TOTAL_GROUPS": [0, 1, 0, 3],
                "DISTRIBUTION": [[0.35, "student"], [0.2, "lecturer"], [0.45, "researcher"]]
            },
            "member": {
                "TOTAL_USERS": [10, 5, 0, 650],
                "TOTAL_GROUPS": [1, 2, 0, 20],
                "DISTRIBUTION": [[0.4, "student"], [0.2, "lecturer"], [0.4, "researcher"]]
            }
        }
    }
};

////////////////
// USER MODEL //
////////////////

exports.World = function(batchid, users) {
    var that = {};

    that.template = general.randomize([[1, 'group']]);
    that.title = general.generateKeywords(general.ASM(DISTRIBUTIONS[that.template].TITLE)).join(" ");
    that.title = that.title[0].toUpperCase() + that.title.substring(1);
    that.id = general.generateId(batchid, [that.title.toLowerCase().split(" ")]).replace(/[^a-zA-Z 0-9]+/g,'-');

    that.visibility = general.randomize(DISTRIBUTIONS[that.template].VISIBILITY);
    that.joinability = general.randomize(DISTRIBUTIONS[that.template].JOINABILITY);

    that.librarySize = general.randomize(DISTRIBUTIONS[that.template].LIBRARY_SIZE);

    // Fill up the creator role
    var creatorRole = general.randomize(DISTRIBUTIONS[that.template].CREATOR);
    var allmembers = [];
    var distribution = [];
    for (var u = 0; u < users.length; u++){
        var user = users[u];
        if (user.userType === creatorRole){
            distribution.push([user.worldWeighting, user.userid]);
        }
    }
    if (distribution.length){
        that.creator = general.randomize(distribution);
    } else {
        that.creator = users[0].userid;
    }
    that.creatorRole = DISTRIBUTIONS[that.template].CREATOR_ROLE;
    allmembers.push(that.creator);

    // Fill up the other roles
    that.roles = {};
    for (var i in DISTRIBUTIONS[that.template].ROLES){
        that.roles[i] = {
            totalUsers: general.ASM(DISTRIBUTIONS[that.template].ROLES[i].TOTAL_USERS),
            totalGroups: general.ASM(DISTRIBUTIONS[that.template].ROLES[i].TOTAL_GROUPS),
            users: [],
            groups: []
        };
        for (var m = 0; m < that.roles[i].totalUsers; m++){
            var type = general.randomize(DISTRIBUTIONS[that.template].ROLES[i].DISTRIBUTION);
            // Generate probability distribution
            var dist = [];
            for (var t = 0; t < users.length; t++){
                var duser = users[t];
                if (duser.userType === type && allmembers.indexOf(duser.userid) === -1){
                    dist.push([duser.worldWeighting, duser.userid]);
                }
            }
            if (dist.length === 0){
                break;
            } else {
                // Select the user to add
                var userToAdd = general.randomize(distribution);
                that.roles[i].users.push(userToAdd);
                allmembers.push(userToAdd);
            }
        }
    }
    that.roles[that.creatorRole].users.push(that.creator);

    that.hasDescription = general.randomize(DISTRIBUTIONS[that.template].HAS_DESCRIPTION);
    that.description = general.generateSentence(general.ASM(DISTRIBUTIONS[that.template].DESCRIPTION));

    return that;
};

exports.setWorldMemberships = function(batchid, worlds, users){
    for (var w = 0; w < worlds.length; w++){
        var world = worlds[w];
        for (var r in world.roles){
            for (var g = 0; g < world.roles[r].totalGroups; g++){
                world.roles[r].groups.push(worlds[Math.floor(Math.random() * worlds.length)].id);
            }
        }
    }
    return worlds;
};
