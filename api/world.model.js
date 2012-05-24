var general = require("./general.js");

/////////////////////
// USER PARAMETERS //
/////////////////////

var DISTRIBUTIONS = {
    "simple-group": {
        "TITLE": [2, 1, 1, 15],
        "HAS_METADATA": [[0.5, true], [0.5, false]],
        "HAS_DESCRIPTION": [[0.4, true], [0.6, false]],
        "DESCRIPTION": [2, 2, 1, 25],
        "HAS_TAGS": [[0.4, true], [0.6, false]],
        "TAGS": [3, 1, 1, 20],
        "HAS_DIRECTORY": [[0.4, true], [0.6, false]],
        "DIRECTORY": [2, 2, 1, 10],
        "HAS_PICTURE": [[0.6, true], [0.4, false]],
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
    },
    "math-course": {
        "TITLE": [2, 1, 1, 15],
        "HAS_METADATA": [[0.5, true], [0.5, false]],
        "HAS_DESCRIPTION": [[0.7, true], [0.3, false]],
        "DESCRIPTION": [2, 2, 1, 25],
        "HAS_TAGS": [[0.5, true], [0.5, false]],
        "TAGS": [3, 1, 1, 20],
        "HAS_DIRECTORY": [[0.5, true], [0.5, false]],
        "DIRECTORY": [2, 2, 1, 10],
        "HAS_PICTURE": [[0.5, true], [0.5, false]],
        "VISIBILITY": [[0.2, "public"], [0.25, "logged-in-only"], [0.55, "members-only"]],
        "JOINABILITY": [[0.05, "yes"], [0.15, "withauth"], [0.8, "no"]],
        "LIBRARY_SIZE": [[0.3, "few"], [0.5, "medium"], [0.2, "lots"]],
        "CREATOR": [[0, "student"], [0.95, "lecturer"], [0.05, "researcher"]],
        "CREATOR_ROLE": "lecturer",
        "ROLES": {
            "lecturer": {
                "TOTAL_USERS": [3, 2, 0, 10],
                "TOTAL_GROUPS": [0, 1, 0, 2],
                "DISTRIBUTION": [[0.05, "student"], [0.8, "lecturer"], [0.15, "researcher"]]
            },
            "ta": {
                "TOTAL_USERS": [5, 2, 0, 20],
                "TOTAL_GROUPS": [0, 1, 0, 3],
                "DISTRIBUTION": [[0.20, "student"], [0.6, "lecturer"], [0.2, "researcher"]]
            },
            "student": {
                "TOTAL_USERS": [50, 30, 0, 800],
                "TOTAL_GROUPS": [0, 2, 0, 20],
                "DISTRIBUTION": [[0.9, "student"], [0.05, "lecturer"], [0.05, "researcher"]]
            }
        }
    },
    "basic-course": {
        "TITLE": [2, 1, 1, 15],
        "HAS_METADATA": [[0.5, true], [0.5, false]],
        "HAS_DESCRIPTION": [[0.6, true], [0.4, false]],
        "DESCRIPTION": [2, 2, 1, 25],
        "HAS_TAGS": [[0.5, true], [0.5, false]],
        "TAGS": [3, 1, 1, 20],
        "HAS_DIRECTORY": [[0.6, true], [0.4, false]],
        "DIRECTORY": [2, 2, 1, 10],
        "HAS_PICTURE": [[0.35, true], [0.65, false]],
        "VISIBILITY": [[0.2, "public"], [0.35, "logged-in-only"], [0.45, "members-only"]],
        "JOINABILITY": [[0.05, "yes"], [0.15, "withauth"], [0.8, "no"]],
        "LIBRARY_SIZE": [[0.4, "few"], [0.5, "medium"], [0.1, "lots"]],
        "CREATOR": [[0, "student"], [0.95, "lecturer"], [0.05, "researcher"]],
        "CREATOR_ROLE": "lecturer",
        "ROLES": {
            "lecturer": {
                "TOTAL_USERS": [3, 2, 0, 10],
                "TOTAL_GROUPS": [0, 1, 0, 2],
                "DISTRIBUTION": [[0.05, "student"], [0.8, "lecturer"], [0.15, "researcher"]]
            },
            "ta": {
                "TOTAL_USERS": [5, 2, 0, 20],
                "TOTAL_GROUPS": [0, 1, 0, 3],
                "DISTRIBUTION": [[0.20, "student"], [0.6, "lecturer"], [0.2, "researcher"]]
            },
            "student": {
                "TOTAL_USERS": [50, 30, 0, 800],
                "TOTAL_GROUPS": [0, 2, 0, 20],
                "DISTRIBUTION": [[0.9, "student"], [0.05, "lecturer"], [0.05, "researcher"]]
            }
        }
    },
    "research-project": {
        "TITLE": [2, 1, 1, 15],
        "HAS_METADATA": [[0.5, true], [0.5, false]],
        "HAS_DESCRIPTION": [[0.75, true], [0.25, false]],
        "DESCRIPTION": [2, 2, 1, 25],
        "HAS_TAGS": [[0.8, true], [0.2, false]],
        "TAGS": [3, 1, 1, 20],
        "HAS_DIRECTORY": [[0.8, true], [0.2, false]],
        "DIRECTORY": [2, 2, 1, 10],
        "HAS_PICTURE": [[0.6, true], [0.4, false]],
        "VISIBILITY": [[0.45, "public"], [0.35, "logged-in-only"], [0.2, "members-only"]],
        "JOINABILITY": [[0.1, "yes"], [0.2, "withauth"], [0.7, "no"]],
        "LIBRARY_SIZE": [[0.25, "few"], [0.5, "medium"], [0.25, "lots"]],
        "CREATOR": [[0.35, "student"], [0.15, "lecturer"], [0.5, "researcher"]],
        "CREATOR_ROLE": "leadresearcher",
        "ROLES": {
            "leadresearcher": {
                "TOTAL_USERS": [2, 1, 0, 10],
                "TOTAL_GROUPS": [0, 0.1, 0, 1],
                "DISTRIBUTION": [[0.35, "student"], [0.15, "lecturer"], [0.5, "researcher"]]
            },
            "researcher": {
                "TOTAL_USERS": [5, 2, 0, 15],
                "TOTAL_GROUPS": [0, 1, 0, 10],
                "DISTRIBUTION": [[0.35, "student"], [0.15, "lecturer"], [0.5, "researcher"]]
            },
            "researchassistant": {
                "TOTAL_USERS": [3, 2, 0, 20],
                "TOTAL_GROUPS": [0, 1, 0, 5],
                "DISTRIBUTION": [[0.4, "student"], [0.15, "lecturer"], [0.45, "researcher"]]
            },
            "contributor": {
                "TOTAL_USERS": [2, 1, 0, 20],
                "TOTAL_GROUPS": [0, 1, 0, 5],
                "DISTRIBUTION": [[0.5, "student"], [0.25, "lecturer"], [0.25, "researcher"]]
            },
            "evaluator": {
                "TOTAL_USERS": [2, 1, 0, 30],
                "TOTAL_GROUPS": [0, 0.1, 0, 5],
                "DISTRIBUTION": [[0.05, "student"], [0.7, "lecturer"], [0.25, "researcher"]]
            }
        }
    },
    "research-support": {
        "TITLE": [2, 1, 1, 15],
        "HAS_METADATA": [[0.5, true], [0.5, false]],
        "HAS_DESCRIPTION": [[0.7, true], [0.3, false]],
        "DESCRIPTION": [2, 2, 1, 25],
        "HAS_TAGS": [[0.7, true], [0.3, false]],
        "TAGS": [3, 1, 1, 20],
        "HAS_DIRECTORY": [[0.6, true], [0.4, false]],
        "DIRECTORY": [2, 2, 1, 10],
        "HAS_PICTURE": [[0.65, true], [0.35, false]],
        "VISIBILITY": [[0.4, "public"], [0.3, "logged-in-only"], [0.3, "members-only"]],
        "JOINABILITY": [[0.1, "yes"], [0.2, "withauth"], [0.7, "no"]],
        "LIBRARY_SIZE": [[0.4, "few"], [0.45, "medium"], [0.15, "lots"]],
        "CREATOR": [[0.35, "student"], [0.15, "lecturer"], [0.5, "researcher"]],
        "CREATOR_ROLE": "participant",
        "ROLES": {
            "participant": {
                "TOTAL_USERS": [5, 3, 1, 30],
                "TOTAL_GROUPS": [0, 1, 0, 5],
                "DISTRIBUTION": [[0.35, "student"], [0.15, "lecturer"], [0.5, "researcher"]]
            },
            "lurker": {
                "TOTAL_USERS": [2, 1, 0, 50],
                "TOTAL_GROUPS": [1, 1, 0, 20],
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

    that.template = general.randomize([[0.7, "simple-group"],[0.01, "math-course"],[0.05, "basic-course"],[0.1, "research-project"],[0.14, "research-support"]]);
    if (that.template === "simple-group"){
        that.type = "group";
    } else if (that.template === "math-course" || that.template === "basic-course"){
        that.type = "course";
    } else {
        that.type = "research";
    }

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
    that.hasTags = general.randomize(DISTRIBUTIONS[that.template].HAS_TAGS);
    that.tags = general.generateKeywords(general.ASM(DISTRIBUTIONS[that.template].TAGS));
    that.hasDirectory = general.randomize(DISTRIBUTIONS[that.template].HAS_DIRECTORY);
    that.directory = general.generateDirectory(general.ASM(DISTRIBUTIONS[that.template].DIRECTORY));

    that.picture = {
        hasPicture: general.randomize(DISTRIBUTIONS[that.template].HAS_PICTURE),
        picture: general.generateWorldPicture()
    };

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
