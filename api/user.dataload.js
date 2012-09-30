var fs = require('fs');

var general = require('./general.js');

var cookies = {};

//////////////
// USER API //
//////////////

exports.loadUser = function(user, SERVER_URL, callback) {
    createUser(user, SERVER_URL, function() {
        fillUpBasicInfo(user, SERVER_URL, function() {
            fillUpAboutMe(user, SERVER_URL, function() {
                fillUpPublications(user, SERVER_URL, function() {
                    callback();
                });
            });
        });
    });
};

var createUser = function(user, SERVER_URL, callback) {
    var userObj = {
        'username': user.userid,
        'password': user.password,
        'visibility': user.userAccountPrivacy,
        'firstName': user.firstName,
        'lastName': user.lastName,
        'displayName': user.displayName
    }
    general.urlReq(SERVER_URL + '/api/user/create', {
        method: 'POST',
        params: userObj
    }, callback);
};

var fillUpBasicInfo = function(user, SERVER_URL, callback) {
    if (user.hasBasicInfoSection) {
         var basicInfo = {};
         if (user.hasEmail) {
             basicInfo['email'] = user.email;
         }
         if (user.hasDepartment) {
             basicInfo['department'] = user.department;
         }
         if (user.hasCollege) {
             basicInfo['college'] = user.college;
         }
         general.urlReq(SERVER_URL + '/api/user/' + user.id, {
            method: 'POST',
            params: basicInfo,
            auth: user
        }, callback);
    } else {
        callback();
    }
};

var fillUpAboutMe = function(user, SERVER_URL, callback) {
    if (user.aboutMe.hasAboutMeSection) {
        var aboutMe = {};
        if (user.aboutMe.hasAboutMe) {
            aboutMe['aboutme'] = user.aboutMe.aboutMe;
        }
        if (user.aboutMe.hasAcademicInterests) {
            aboutMe['academicinterests'] = user.aboutMe.academicInterests.join(', ');
        }
        if (user.aboutMe.hasPersonalInterests) {
            aboutMe['personalinterests'] = user.aboutMe.personalInterests.join(', ');
        }
        if (user.aboutMe.hasHobbies) {
            aboutMe['hobbies'] = user.aboutMe.hobbies.join(', ');
        }

        var section = {
            'section': 'aboutme',
            'data': JSON.stringify(aboutMe),
            'visibility': user.aboutMe.aboutMePrivacy
        }

        general.urlReq(SERVER_URL + '/api/user/' + user.id + '/profile', {
            method: 'POST',
            params: section,
            auth: user
        }, callback);
    } else {
        callback();
    }
};

var fillUpPublications = function(user, SERVER_URL, callback) {
    if (user.publications.publications.length) {
        var section = {
            'section': 'publications',
            'data': JSON.stringify({'publications': user.publications.publications}),
            'visibility': user.publications.publicationsPrivacy
        }
        
        general.urlReq(SERVER_URL + '/api/user/' + user.id + '/profile', {
            method: 'POST',
            params: section,
            auth: user
        }, callback);
    } else {
        callback();
    }
};
