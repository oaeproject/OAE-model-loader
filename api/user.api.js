var canvas = require('canvas');
var fs = require("fs");

var general = require("./general.js");

//////////////
// USER API //
//////////////

exports.loadUser = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    createUser(user, SERVER_URL, ADMIN_PASSWORD, function(){
        uploadProfilePicture(user, SERVER_URL, ADMIN_PASSWORD, function(){
            storePubPrivStructure(user, SERVER_URL, ADMIN_PASSWORD, function(){
                setAccountPrivacy(user, SERVER_URL, ADMIN_PASSWORD, function(){
                    fillUpBasicInfo(user, SERVER_URL, ADMIN_PASSWORD, function(){
                        fillUpAboutMe(user, SERVER_URL, ADMIN_PASSWORD, function(){
                            fillUpPublications(user, SERVER_URL, ADMIN_PASSWORD, function(){
                                setSectionPermissions(user, SERVER_URL, ADMIN_PASSWORD, function(){
                                    callback();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

exports.getUser = function(userid, users){
    for (var u = 0; u < users.length; u++){
        if (users[u].userid === userid){
            return users[u];
        }
    }
    return false;
}

var createUser = function(userObj, SERVER_URL, ADMIN_PASSWORD, callback) {
    var profileData = {}; profileData.basic = {}; profileData.basic.elements = {};
    profileData.basic.elements["firstName"] = {};
    profileData.basic.elements["firstName"].value = userObj.firstName;
    profileData.basic.elements["lastName"] = {};
    profileData.basic.elements["lastName"].value = userObj.lastName;
    profileData.basic.elements["email"] = {};
    profileData.basic.elements["email"].value = userObj.basicInfo.email;
    profileData["email"] = userObj.basicInfo.email;
    profileData.basic.access = "everybody";
    var user = {
        "_charset_": "utf-8",
        "locale": "en_US",
        "timezone": "Europe/London",
        "pwd": userObj.password,
        "pwdConfirm": userObj.password,
        "firstName": userObj.firstName,
        "lastName": userObj.lastName,
        "email": userObj.basicInfo.email,
        ":name": userObj.userid,
        ":sakai:profile-import": JSON.stringify(profileData)
    };
    general.urlReq(SERVER_URL + "/system/userManager/user.create.html", {
        method: 'POST',
        params: user,
        auth: "admin:" + ADMIN_PASSWORD
    }, callback);
}

var uploadProfilePicture = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    if (user.picture.hasPicture){
         var auth = user.userid + ":" + user.password;
         // Upload to the server
         var picture = "./data/pictures/users/" + user.picture.picture;
         general.filePost(SERVER_URL + "/~" + user.userid + "/public/profile", picture, user.picture.picture, {
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
                "img": "/~" + user.userid + "/public/profile/" + user.picture.picture,
                "save": "/~" + user.userid + "/public/profile"
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
                        "name": "256x256_" + user.picture.picture,
                        "_name": user.picture.picture,
                        "selectedx1": 0,
                        "selectedy1": 0,
                        "selectedx2": dimension,
                        "selectedy2": dimension
                    }
                    general.urlReq(SERVER_URL + "/~" + user.userid + "/public/authprofile.profile.json", {
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

var storePubPrivStructure = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    var pubstructure0 = {"profile":{"_title":"__MSG__MY_PROFILE__","_altTitle":"__MSG__MY_PROFILE_OTHER__","_order":0,"_canEdit":true,"_nonEditable":true,"_reorderOnly":true,"_canSubedit":true,"basic":{"_ref":"id2482685","_order":0,"_altTitle":"__MSG__PROFILE_BASIC_LABEL__","_title":"__MSG__PROFILE_BASIC_LABEL__","_nonEditable":true,"_view":"anonymous","_reorderOnly":true},"aboutme":{"_ref":"id9650412","_order":1,"_altTitle":"__MSG__PROFILE_ABOUTME_LABEL_OTHER__","_title":"__MSG__PROFILE_ABOUTME_LABEL__","_nonEditable":true,"_view":"anonymous","_reorderOnly":false},"publications":{"_ref":"id4427096","_order":2,"_altTitle":"__MSG__PROFILE_PUBLICATIONS_LABEL__","_title":"__MSG__PROFILE_PUBLICATIONS_LABEL__","_nonEditable":true,"_view":"anonymous","_reorderOnly":false},"_ref":"id2482685"},"library":{"_ref":"id92773090","_order":1,"_title":"__MSG__MY_LIBRARY__","_altTitle":"__MSG__MY_LIBRARY_OTHER__","_reorderOnly":true,"_nonEditable":true,"_view":"anonymous","main":{"_ref":"id92773090","_order":0,"_title":"__MSG__MY_LIBRARY__"}},"memberships":{"_title":"__MSG__MY_MEMBERSHIPS__","_order":2,"_ref":"id92773091","_altTitle":"__MSG__MY_MEMBERSHIPS_OTHER__","_reorderOnly":true,"_nonEditable":true,"_view":"anonymous","main":{"_ref":"id92773091","_order":0,"_title":"__MSG__MY_MEMBERSHIPS__"}},"contacts":{"_title":"__MSG__MY_CONTACTS__","_order":3,"_ref":"id92773092","_altTitle":"__MSG__MY_CONTACTS_OTHER__","_reorderOnly":true,"_nonEditable":true,"_view":"anonymous","main":{"_ref":"id92773092","_order":0,"_title":"__MSG__MY_CONTACTS__"}}}
    var privstructure0 = {"dashboard":{"_ref":"id84508350","_title":"__MSG__MY_DASHBOARD__","_order":0,"_canEdit":true,"_reorderOnly":true,"_nonEditable":true,"main":{"_ref":"id84508350","_order":0,"_title":"__MSG__MY_DASHBOARD__"}},"messages":{"_title":"__MSG__MY_MESSAGES__","_ref":"id84508351","_order":1,"_canEdit":true,"_reorderOnly":true,"_canSubedit":true,"_nonEditable":true,"inbox":{"_ref":"id84508351","_order":0,"_title":"__MSG__INBOX__","_nonEditable":true},"invitations":{"_ref":"id84508352","_order":1,"_title":"__MSG__INVITATIONS__","_nonEditable":true},"sent":{"_ref":"id84508353","_order":2,"_title":"__MSG__SENT__","_nonEditable":true},"trash":{"_ref":"id84508354","_order":3,"_title":"__MSG__TRASH__","_nonEditable":true}}};
    if (user.reordersPubprivspace){
        pubstructure0["profile"]["_order"] = 1;
        pubstructure0["library"]["_order"] = 0;
        pubstructure0["memberships"]["_order"] = 3;
        pubstructure0["contacts"]["_order"] = 2;
        privstructure0["dashboard"]["_order"] = 1;
        privstructure0["messages"]["_order"] = 0;
    }
    var pubstruc = {
        "structure0": JSON.stringify(pubstructure0),
        "id92773090":{"rows":{"__array__0__":{"id":"id89874","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id5739346","type":"mylibrary"}}}}}}},"id92773091":{"rows":{"__array__0__":{"id":"id7664610","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id4347509","type":"mymemberships"}}}}}}},"id92773092":{"rows":{"__array__0__":{"id":"id293415","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id6775571","type":"contacts"}}}}}}},"id2482685":{"rows":{"__array__0__":{"id":"id757095","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id3955814","type":"displayprofilesection"}}}}}},"id3955814":{"sectionid":"basic"}},"id9650412":{"rows":{"__array__0__":{"id":"id7452110","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id9036745","type":"displayprofilesection"}}}}}},"id9036745":{"sectionid":"aboutme"}},"id4427096":{"rows":{"__array__0__":{"id":"id8233886","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id3495893","type":"displayprofilesection"}}}}}},"id3495893":{"sectionid":"publications"}},"sakai:schemaversion":"2"
    }
    var privstruc = {
        "structure0": JSON.stringify(privstructure0),
        "id84508350":{"id2487321":{"htmlblock":{"content":"<h1 class=\"s3d-contentpage-title\">__MSG__MY_DASHBOARD__</h1>"}},"id2506067":{"dashboardactivity":{"content":""}},"rows":{"__array__0__":{"id":"id8965114","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id2487321","type":"htmlblock"},"__array__1__":{"id":"id2506067","type":"dashboardactivity"}}}}}}},"id84508351":{"rows":{"__array__0__":{"id":"id7088118","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id84508356","type":"inbox"}}}}}},"id84508356":{"box":"inbox","category":"message","title":"__MSG__INBOX__"}},"id84508352":{"rows":{"__array__0__":{"id":"id6156677","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id84508357","type":"inbox"}}}}}},"id84508357":{"box":"inbox","category":"invitation","title":"__MSG__INVITATIONS__"}},"id84508353":{"rows":{"__array__0__":{"id":"id5268914","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id84508358","type":"inbox"}}}}}},"id84508358":{"box":"outbox","category":"*","title":"__MSG__SENT__"}},"id84508354":{"rows":{"__array__0__":{"id":"id1281420","columns":{"__array__0__":{"width":1,"elements":{"__array__0__":{"id":"id84508359","type":"inbox"}}}}}},"id84508359":{"box":"trash","category":"*","title":"__MSG__TRASH__"}},"sakai:schemaversion":"2"
    }
    var auth = user.userid + ":" + user.password;
    general.importRequest(SERVER_URL + "/~" + user.userid + "/public/pubspace", pubstruc, {
        method: 'POST',
        auth: auth
    }, function(){
        general.importRequest(SERVER_URL + "/~" + user.userid + "/private/privspace", privstruc, {
            method: 'POST',
            auth: auth
        }, callback);
    });
}

var setAccountPrivacy = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    if (user.userAccountPrivacy === "loggedin"){
        var auth = user.userid + ":" + user.password;
        var requests = [
            {
                "url":"/~" + user.userid + ".modifyAce.json",
                "method":"POST",
                "parameters":{
                    "principalId":"anonymous",
                    "privilege@jcr:read":"denied",
                    "_charset_":"utf-8"
                },
                "_charset_":"utf-8"
            },
            {
                "url":"/system/userManager/user/" + user.userid + ".modifyAce.json",
                "method":"POST",
                "parameters":{
                    "principalId":"anonymous",
                    "privilege@jcr:read":"denied",
                    "_charset_":"utf-8"
                },
                "_charset_":"utf-8"
            }
        ];
        general.urlReq(SERVER_URL + "/system/batch", {
            method: 'POST',
            params: {"_charset_": "utf-8", "requests": JSON.stringify(requests)},
            auth: auth
        }, callback);
    } else {
        callback();
    }
}
var querystring = require('querystring');
var fillUpBasicInfo = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    if (user.basicInfo.hasBasicInfoSection){
        var auth = user.userid + ":" + user.password;
        var basicInfo = {
            "elements": {
                "firstName": {"value": user.firstName},
                "lastName": {"value": user.lastName}
            }
        }
        var role = "undergraduate_student";
        if (user.userType === "lecturer"){
            role = "academic_staff";
        } else if (user.userType === "researcher"){
            role = "research_staff";
        }
        basicInfo["elements"]["role"] = {"value": role};
        if (user.basicInfo.hasEmail){
            basicInfo["elements"]["email"] = {"value": user.basicInfo.email};
        }
        if (user.basicInfo.hasPreferredName){
            basicInfo["elements"]["preferredName"] = {"value": user.basicInfo.preferredName};
        }
        if (user.basicInfo.hasDepartment){
            basicInfo["elements"]["department"] = {"value": user.basicInfo.department};
        }
        if (user.basicInfo.hasCollege){
            basicInfo["elements"]["college"] = {"value": user.basicInfo.college};
        }
        general.importRequest(SERVER_URL + "/~" + user.userid + "/public/authprofile/basic.profile.json", basicInfo, {
            method: 'POST',
            auth: auth
        }, function(){
            // Tag the user
            var tags = [];
            if (user.basicInfo.hasTags){
                for (var t = 0; t < user.basicInfo.tags.length; t++){
                    tags.push("/tags/" + user.basicInfo.tags[t]);
                }
            } 
            if (user.basicInfo.hasDirectory){
                for (var d = 0; d < user.basicInfo.directory.length; d++){
                    tags.push("/tags/directory/" + user.basicInfo.directory[d]);
                }
            }
            if (tags.length) {
                general.urlReq(SERVER_URL + "/~" + user.userid + "/public/authprofile", {
                    method: 'POST',
                    params: {
                        ":operation": "tag",
                        "_charset_": "utf-8",
                        "key": tags
                    },
                    auth: auth
                }, callback);
            } else {
                callback();
            }
        });
    } else {
        callback();
    }
}

var fillUpAboutMe = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    if (user.aboutMe.hasAboutMeSection){
        var auth = user.userid + ":" + user.password;
        var aboutMe = {
            "elements": {}
        }
        if (user.aboutMe.hasAboutMe){
            aboutMe["elements"]["aboutme"] = {"value": user.aboutMe.aboutMe};
        }
        if (user.aboutMe.hasAcademicInterests){
            aboutMe["elements"]["academicinterests"] = {"value": user.aboutMe.academicInterests.join(", ")};
        }
        if (user.aboutMe.hasPersonalInterests){
            aboutMe["elements"]["personalinterests"] = {"value": user.aboutMe.personalInterests.join(", ")};
        }
        if (user.aboutMe.hasHobbies){
            aboutMe["elements"]["hobbies"] = {"value": user.aboutMe.hobbies.join(", ")};
        }
        general.importRequest(SERVER_URL + "/~" + user.userid + "/public/authprofile/aboutme.profile.json", aboutMe, {
            method: 'POST',
            auth: auth
        }, callback);
    } else {
        callback();
    }
}

var fillUpPublications = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    if (user.publications.publications.length){
        var auth = user.userid + ":" + user.password;
        var publications = {
            "elements": {}
        }
        for (var p = 0; p < user.publications.publications.length; p++){
            var publication = user.publications.publications[p];
            publications["elements"]["" + Math.round(Math.random() * 1000000)] = {
                "order": p + 1,
                "maintitle": {"value": publication.title},
                "mainauthor": {"value": publication.mainAuthor},
                "publisher": {"value": publication.publisher},
                "placeofpublication": {"value": publication.placeofpublication},
                "year": {"value": publication.year}
            }
        }
        general.importRequest(SERVER_URL + "/~" + user.userid + "/public/authprofile/publications.profile.json", publications, {
            method: 'POST',
            auth: auth
        }, callback);
    } else {
        callback();
    }
}

var setSectionPermissions = function(user, SERVER_URL, ADMIN_PASSWORD, callback){
    var pubstructure0 = {"profile":{"_title":"__MSG__MY_PROFILE__","_altTitle":"__MSG__MY_PROFILE_OTHER__","_order":0,"_canEdit":true,"_nonEditable":true,"_reorderOnly":true,"_canSubedit":true,"basic":{"_ref":"id2482685","_order":0,"_altTitle":"__MSG__PROFILE_BASIC_LABEL__","_title":"__MSG__PROFILE_BASIC_LABEL__","_nonEditable":true,"_view":"anonymous","_reorderOnly":true},"aboutme":{"_ref":"id9650412","_order":1,"_altTitle":"__MSG__PROFILE_ABOUTME_LABEL_OTHER__","_title":"__MSG__PROFILE_ABOUTME_LABEL__","_nonEditable":true,"_view":"anonymous","_reorderOnly":false},"publications":{"_ref":"id4427096","_order":2,"_altTitle":"__MSG__PROFILE_PUBLICATIONS_LABEL__","_title":"__MSG__PROFILE_PUBLICATIONS_LABEL__","_nonEditable":true,"_view":"anonymous","_reorderOnly":false},"_ref":"id2482685"},"library":{"_ref":"id92773090","_order":1,"_title":"__MSG__MY_LIBRARY__","_altTitle":"__MSG__MY_LIBRARY_OTHER__","_reorderOnly":true,"_nonEditable":true,"_view":"anonymous","main":{"_ref":"id92773090","_order":0,"_title":"__MSG__MY_LIBRARY__"}},"memberships":{"_title":"__MSG__MY_MEMBERSHIPS__","_order":2,"_ref":"id92773091","_altTitle":"__MSG__MY_MEMBERSHIPS_OTHER__","_reorderOnly":true,"_nonEditable":true,"_view":"anonymous","main":{"_ref":"id92773091","_order":0,"_title":"__MSG__MY_MEMBERSHIPS__"}},"contacts":{"_title":"__MSG__MY_CONTACTS__","_order":3,"_ref":"id92773092","_altTitle":"__MSG__MY_CONTACTS_OTHER__","_reorderOnly":true,"_nonEditable":true,"_view":"anonymous","main":{"_ref":"id92773092","_order":0,"_title":"__MSG__MY_CONTACTS__"}}}
    var setSectionPermissions = function(section, privacy, cb){
        if (privacy !== "public"){
            var auth = user.userid + ":" + user.password;
            pubstructure0["profile"][section]["_view"] = section;
            general.urlReq(SERVER_URL + "/~" + user.userid + "/public/pubspace", {
                method: 'POST',
                params: {
                    "structure0": JSON.stringify(pubstructure0),
                    "_charset_": "utf-8"
                },
                auth: auth
            }, function(){
                // Set permissions
                var requests = [
                    {
                        "url":"/~" + user.userid + "/public/authprofile/" + section + ".modifyAce.html",
                        "method":"POST",
                        "parameters":{
                            "principalId": user.userid,
                            "privilege@jcr:write":"granted",
                            "privilege@jcr:read":"granted",
                            "_charset_":"utf-8"
                        },
                        "_charset_":"utf-8"
                    },
                    {
                        "url":"/~" + user.userid + "/public/authprofile/" + section + ".modifyAce.html",
                        "method":"POST",
                        "parameters":{
                            "principalId": "g-contacts-" + user.userid,
                            "privilege@jcr:read": (privacy === "private" ? "denied" : "granted"),
                            "_charset_":"utf-8"
                        },
                        "_charset_":"utf-8"
                    },
                    {
                        "url":"/~" + user.userid + "/public/authprofile/" + section + ".modifyAce.html",
                        "method":"POST",
                        "parameters":{
                            "principalId": "everyone",
                            "privilege@jcr:read": (privacy === "everyone" ? "granted" : "denied"),
                            "_charset_":"utf-8"
                        },
                        "_charset_":"utf-8"
                    },
                    {
                        "url":"/~" + user.userid + "/public/authprofile/" + section + ".modifyAce.html",
                        "method":"POST",
                        "parameters":{
                            "principalId": "anonymous",
                            "privilege@jcr:read": "denied",
                            "_charset_":"utf-8"
                        },
                        "_charset_":"utf-8"
                    }
                ];
                general.urlReq(SERVER_URL + "/system/batch", {
                    method: 'POST',
                    params: {"_charset_": "utf-8", "requests": JSON.stringify(requests)},
                    auth: auth
                }, cb);
            });
        } else {
            cb();
        }
    }
    setSectionPermissions("aboutme", user.aboutMe.aboutMePrivacy, function(){
        setSectionPermissions("publications", user.publications.publicationsPrivacy, callback);
    });
}
