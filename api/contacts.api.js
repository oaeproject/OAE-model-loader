var general = require("./general.js");

//////////////////
// CONTACTS API //
//////////////////

exports.loadContact = function(contact, users, SERVER_URL, ADMIN_PASSWORD, callback){
    // Get user object
    var inviter = false;
    var invitee = false;
    for (var u = 0; u < users.length; u++){
        if (users[u].userid === contact.inviter){
            inviter = users[u];
        }
        if (users[u].userid === contact.invitee){
            invitee = users[u];
        }
    }
    // Send the request
    sendContactRequest(contact, inviter, invitee, SERVER_URL, ADMIN_PASSWORD, function(){
        // Accept the request if appropriate
        if (contact.willAccept){
            acceptContactRequest(contact, inviter, invitee, SERVER_URL, ADMIN_PASSWORD, callback);
        } else {
            callback();
        }
    });
}

var sendContactRequest = function(contact, inviter, invitee, SERVER_URL, ADMIN_PASSWORD, callback){
    var auth = inviter.userid + ":" + inviter.password;
    var contactRequest = {
        "_charset_": "utf-8",
        "targetUserId": invitee.userid,
        "fromRelationships": contact.type,
        "toRelationships": contact.type
    };
    general.urlReq(SERVER_URL + "/~" + inviter.userid + "/contacts.invite.html", {
        method: 'POST',
        params: contactRequest,
        auth: auth
    }, function(){
        // Send the system message
        var message = {
            "_charset_": "utf-8",
            "sakai:body": inviter.firstName + " " + inviter.lastName + " has invited you to become a contact: I would like to invite you to become a member of my network on Sakai. - " + inviter.firstName,
            "sakai:category": "invitation",
            "sakai:from": inviter.userid,
            "sakai:messagebox": "outbox",
            "sakai:sendstate": "pending",
            "sakai:subject": inviter.firstName + " " + inviter.lastName + " has invited you to become a connection",
            "sakai:to": "internal:" + invitee.userid,
            "sakai:type": "internal"
        }
        general.urlReq(SERVER_URL + "/~" + inviter.userid + "/message.create.html", {
            method: 'POST',
            params: message,
            auth: auth
        }, function(){
            // Send the SMTP message
            var message = {
                "_charset_": "utf-8",
                "sakai:body": inviter.firstName + " " + inviter.lastName + " has invited you to become a contact: I would like to invite you to become a member of my network on Sakai. - " + inviter.firstName,
                "sakai:category": "message",
                "sakai:from": inviter.userid,
                "sakai:messagebox": "pending",
                "sakai:sendstate": "pending",
                "sakai:subject": inviter.firstName + " " + inviter.lastName + " has invited you to become a connection",
                "sakai:templateParams": "sender=" + inviter.firstName + " " + inviter.lastName + "|system=Sakai|body=" + inviter.firstName + " " + inviter.lastName + " has invited you to become a contact: I would like to invite you to become a member of my network on Sakai. - " + inviter.firstName + "|link=http://localhost:8080/me#l=messages/invitations",
                "sakai:templatePath": "/var/templates/email/contact_invitation",
                "sakai:to": "internal:" + invitee.userid,
                "sakai:type": "smtp"   
            }
            general.urlReq(SERVER_URL + "/~" + inviter.userid + "/message.create.html", {
                method: 'POST',
                params: message,
                auth: auth
            }, callback);
        });
    });
}

var acceptContactRequest = function(contact, inviter, invitee, SERVER_URL, ADMIN_PASSWORD, callback){
    var auth = invitee.userid + ":" + invitee.password;
    var contactRequest = {
        "_charset_": "utf-8",
        "targetUserId": inviter.userid
    };
    general.urlReq(SERVER_URL + "/~" + invitee.userid + "/contacts.accept.html", {
        method: 'POST',
        params: contactRequest,
        auth: auth
    }, callback);
}
