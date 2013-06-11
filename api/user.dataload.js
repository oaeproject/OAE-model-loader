/*
 * Copyright 2013 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var general = require('./general.js');

exports.loadUser = function(user, SERVER_URL, callback) {
    createUser(user, SERVER_URL, function(body, success, res) {
        if (success) {
            user.originalid = user.id;
            user.id = user.generatedid = JSON.parse(body).id;
        }

        fillUpBasicInfo(user, SERVER_URL, function() {
            fillUpAboutMe(user, SERVER_URL, function() {
                fillUpPublications(user, SERVER_URL, function() {
                    uploadProfilePicture(user, SERVER_URL, callback);
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
    };
    general.urlReq(SERVER_URL + '/api/user/create', {
        method: 'POST',
        params: userObj,
        telemetry: 'Create user'
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
            auth: user,
            telemetry: 'Add basic info'
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
            auth: user,
            telemetry: 'Add about me'
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
            auth: user,
            telemetry: 'Add publications'
        }, callback);
    } else {
        callback();
    }
};

var uploadProfilePicture = function(user, SERVER_URL, callback) {
    if (user.picture.hasPicture) {
        var filename = user.picture.picture;
        general.uploadProfilePicture('user', user.id, user, filename, SERVER_URL, callback);
    } else {
        callback();
    }
};
