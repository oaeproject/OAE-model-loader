var _ = require('underscore');

var general = require('./general.js');

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
                'TOTAL_GROUPS': [0, 1, 0, 5],
                'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
            },
            'viewer': {
                'TOTAL_USERS': [5, 3, 0, 500],
                'TOTAL_GROUPS': [1, 2, 0, 15],
                'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
            }
        }
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
                'TOTAL_GROUPS': [0, 1, 0, 5],
                'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
            },
            'viewer': {
                'TOTAL_USERS': [5, 3, 0, 500],
                'TOTAL_GROUPS': [1, 2, 0, 15],
                'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
            }
        }
    },
    'sakaidoc': {
        'NAME': [2, 1, 1, 15],
        'HAS_DESCRIPTION': [[0.6, true], [0.4, false]],
        'DESCRIPTION': [2, 2, 1, 25],
        'VISIBILITY': [[0.3, 'public'], [0.3, 'loggedin'], [0.4, 'private']],
        'CREATOR': [[0.3, 'student'], [0.35, 'lecturer'], [0.35, 'researcher']],
        'ROLES': {
            'manager': {
                'TOTAL_USERS': [3, 2, 0, 25],
                'TOTAL_GROUPS': [0, 1, 0, 5],
                'DISTRIBUTION': [[0.2, 'student'], [0.35, 'lecturer'], [0.45, 'researcher']]
            },
            'viewer': {
                'TOTAL_USERS': [5, 3, 0, 500],
                'TOTAL_GROUPS': [1, 2, 0, 15],
                'DISTRIBUTION': [[0.4, 'student'], [0.2, 'lecturer'], [0.4, 'researcher']]
            }
        }
    }
};

/////////////////////////
// PooledContent Model //
/////////////////////////

exports.Content = function(batchid, users, groups) {
    var that = {};

    that.contentType = general.randomize([[0.45, 'link'], [0.4, 'file'], [0.15, 'sakaidoc']]);

    that.name = general.generateKeywords(general.ASM(DISTRIBUTIONS[that.contentType].NAME)).join(' ');
    that.name = that.name[0].toUpperCase() + that.name.substring(1);
    that.id = general.generateId(batchid, [that.name.toLowerCase().split(' ')]).replace(/[^a-zA-Z 0-9]+/g,'-');

    that.hasDescription = general.randomize(DISTRIBUTIONS[that.contentType].HAS_DESCRIPTION);
    that.description = general.generateSentence(general.ASM(DISTRIBUTIONS[that.contentType].DESCRIPTION));
    
    that.visibility = general.randomize(DISTRIBUTIONS[that.contentType].VISIBILITY);

    if (that.contentType === 'link') {
        var type = general.randomize(DISTRIBUTIONS[that.contentType].TYPE);
        that.link = general.generateUrl(type);
    }

    // Fill up the creator role
    var creatorRole = general.randomize(DISTRIBUTIONS[that.contentType].CREATOR);
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

    // For now, only add non-private groups as group members
    var nonPrivateGroups = [];
    for (var g in groups) {
        if (groups[g].visibility !== 'private') {
            nonPrivateGroups.push(g);
        }
    }

    // Fill up the managers and viewers
    that.roles = {};
    for (var i in DISTRIBUTIONS[that.contentType].ROLES) {
        that.roles[i] = {
            totalUsers: general.ASM(DISTRIBUTIONS[that.contentType].ROLES[i].TOTAL_USERS),
            totalGroups: general.ASM(DISTRIBUTIONS[that.contentType].ROLES[i].TOTAL_GROUPS),
            users: [],
            groups: []
        };
        // Fill up the users
        for (var m = 0; m < that.roles[i].totalUsers; m++) {
            var type = general.randomize(DISTRIBUTIONS[that.contentType].ROLES[i].DISTRIBUTION);
            // Generate probability distribution
            var dist = [];
            for (var t in users) {
                var duser = users[t];
                if (duser.userType === type && allmembers.indexOf(duser.id) === -1) {
                    dist.push([duser.contentWeighting, duser.id]);
                }
            }
            if (dist.length === 0) {
                break;
            } else {
                // Select the user to add
                var userToAdd = general.randomize(dist);
                that.roles[i].users.push(userToAdd);
                allmembers.push(userToAdd);
            }
        }
        // Fill up the groups
        for (var m = 0; m < that.roles[i].totalGroups; m++) {
            var randomGroup = nonPrivateGroups[Math.floor(Math.random() * nonPrivateGroups.length)];
            nonPrivateGroups = _.without(nonPrivateGroups, randomGroup);
            that.roles[i].groups.push(randomGroup);
            allmembers.push(randomGroup);
        }
    }

    return that;
};