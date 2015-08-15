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

var _ = require('underscore');
var general = require('./general.js');

exports.loadUser = function(user, SERVER_URL, callback) {
    createUser(user, SERVER_URL, function(body, success, res) {
        if (success) {
            try {
                user.originalid = user.id;
                user.id = user.generatedid = JSON.parse(body).id;
            } catch (ex) {
                console.error('Error parsing create user HTTP response:');
                console.error(body);

                // Rethrowing since missing groups will cascade wildfire through the rest of the data-load process
                throw ex;
            }
        } else {
            console.error('Error creating user: %s', body);
        }

        fillUpBasicInfo(user, SERVER_URL, function() {
            uploadProfilePicture(user, SERVER_URL, callback);
        });
    });
};

exports.loadFollowing = function(user, users, SERVER_URL, callback) {
    var following = (user.following) ? user.following.slice() : [];
    followAll(user, users, following, SERVER_URL, callback);
};

var createUser = function(user, SERVER_URL, callback) {
    var userObj = {
        'username': user.userid,
        'password': user.password,
        'visibility': user.userAccountPrivacy,
        'displayName': user.displayName,
        'email': user.basicInfo.email
    };

    general.urlReq(SERVER_URL + '/api/user/create', {
        method: 'POST',
        params: userObj
    }, callback);
};

var fillUpBasicInfo = function(user, SERVER_URL, callback) {
    if (user.hasBasicInfoSection) {
         var basicInfo = {};
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

var uploadProfilePicture = function(user, SERVER_URL, callback) {
    if (user.picture.hasPicture) {
        var filename = user.picture.picture;
        general.uploadProfilePicture('user', user.id, user, filename, SERVER_URL, callback);
    } else {
        callback();
    }
};

var followAll = function(user, users, following, SERVER_URL, callback) {
    if (following.length === 0) {
        return callback();
    }

    var usersArray = _.values(users);
    var originalFollowedId = following.shift();
    var serverFollowedId = findServerIdFromOriginalId(originalFollowedId, usersArray);
    if (!serverFollowedId) {
        console.log('    Warning: User %s will not follow %s since server-side id was not found', user.originalid, originalFollowedId);
        return followAll(user, users, following, SERVER_URL, callback);
    }

    general.urlReq(SERVER_URL + '/api/following/' + serverFollowedId + '/follow', {
        method: 'POST',
        auth: user
    }, function(body, isSuccessCode, res) {
        if (!isSuccessCode) {
            console.log('    Warning: User %s failed to follow %s. Reason: %s', user.originalid, originalFollowedId, body);
        }

        return followAll(user, users, following, SERVER_URL, callback);
    });
};

var findServerIdFromOriginalId = function(originalId, users) {
    var user = _.find(users, function(user) { return user.originalid === originalId; });
    return (user) ? user.id : null;
};
