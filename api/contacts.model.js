var general = require("./general.js");

/////////////////////
// USER PARAMETERS //
/////////////////////

var DISTRIBUTIONS = {
    "student": {
        "HAS_CONTACTS": [[0.8, true],[0.2, false]],
        "TOTAL": [15, 10, 1, 700],
        "ACCEPT_REQUEST": [[0.95, true],[0.05, false]]
    },
    "lecturer": {
        "HAS_CONTACTS": [[0.6, true],[0.4, false]],
        "TOTAL": [5, 3, 1, 300],
        "ACCEPT_REQUEST": [[0.95, true],[0.05, false]]
    },
    "researcher": {
        "HAS_CONTACTS": [[0.7, true],[0.3, false]],
        "TOTAL": [8, 2, 1, 800],
        "ACCEPT_REQUEST": [[0.95, true],[0.05, false]]
    }
};


////////////////
// USER MODEL //
////////////////

exports.generateContacts = function(users) {
    var contacts = [];

    // Determine target number of users for each user
    for (var u = 0; u < users.length; u++){
        var user = users[u];
        user.hasContacts = general.randomize(DISTRIBUTIONS[user.userType].HAS_CONTACTS);
        user.targetContacts = general.ASM(DISTRIBUTIONS[user.userType].TOTAL);
    }

    for (var s = 0; s < users.length; s++){
        var cuser = users[s];
        // Check how many contacts the current user already has
        var contactsAlready = 0; var contactsToGo = 0;
        for (var c = 0; c < contacts.length; c++){
            if (contacts[c].inviter === cuser.userid || contacts[c].invitee === cuser.userid){
                contactsAlready++;
            }
        }
        contactsToGo = cuser.targetContacts - contactsAlready;
        // Decide which users the current one accepts
        // Create a possibility curve based on target contacts
        var possibilities = [];
        for (var p = s + 1; p < users.length; p++){
            if (users[p].hasContacts){
                possibilities.push([users[p].targetContacts, users[p]]);
            }
        }
        if (possibilities.length && contactsToGo){
            for (var t = 0; t < contactsToGo; t++){
                var nextContact = general.randomize(possibilities);
                contacts.push(new exports.Contact(cuser, nextContact));
                contactsAlready++;
                // Remove the contact from the possibilities curve
                var toRemove = 0;
                for (var q = 0; q < possibilities.length; q++){
                    if (possibilities[q][1].userid === nextContact.userid){
                        toRemove = q;
                    }
                }
                possibilities.splice(toRemove, 1);
                if (possibilities.length === 0){
                    break;
                }
            }
        }
    }

    return contacts;
};

exports.Contact = function(user1, user2){
    var that = {};
    var types = ["__MSG__CLASSMATE__", "__MSG__SUPERVISOR__", "__MSG__SUPERVISED__", "__MSG__LECTURER__", "__MSG__STUDENT__", "__MSG__COLLEAGUE__", "__MSG__COLLEGE_MATE__", "__MSG__SHARES_INTERESTS__"];

    that.inviter = user1.userid;
    that.invitee = user2.userid;
    that.type = types[Math.floor(Math.random() * types.length)];
    that.willAccept = general.randomize(DISTRIBUTIONS[user2.userType].ACCEPT_REQUEST);

    return that;
};
