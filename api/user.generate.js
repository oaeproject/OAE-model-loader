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

/////////////////////
// USER PARAMETERS //
/////////////////////

var DISTRIBUTIONS = {
    'student': {
        'SEX': [[0.5, 'M'],[0.5, 'F']],
        'USER_ACCOUNT_PRIVACY': [[0.7, 'public'], [0.3, 'loggedin']],
        'HAS_BASIC_INFO_SECTION': [[0.7, true],[0.3, false]],
        'HAS_EMAIL': [[0.9, true], [0.1, false]],
        'HAS_DEPARTMENT': [[0.8, true], [0.2, false]],
        'HAS_COLLEGE': [[0.5, true], [0.5, false]],
        'HAS_ABOUT_ME_SECTION': [[0.4, true],[0.6, false]],
        'ABOUT_ME_PRIVACY': [[0.4, 'public'], [0.4, 'loggedin'], [0.10, 'private']],
        'HAS_ABOUT_ME': [[0.7, true], [0.3, false]],
        'ABOUT_ME': [2, 2, 1, 25],
        'HAS_ACADEMIC_INTERESTS': [[0.6, true], [0.4, false]],
        'ACADEMIC_INTERESTS': [2, 2, 1, 50],
        'HAS_PERSONAL_INTERESTS': [[0.6, true], [0.4, false]],
        'PERSONAL_INTERESTS': [3, 2, 1, 50],
        'HAS_HOBBIES': [[0.5, true], [0.5, false]],
        'HOBBIES': [3, 2, 1, 50],
        'PUBLICATIONS_PRIVACY': [[0.8, 'public'], [0.19, 'loggedin'], [0.01, 'private']],
        'PUBLICATIONS': [1, 3, 0, 20],
        'GROUPS_WEIGHTING': [[0.3, 1], [0.5, 3], [0.2, 9]],
        'CONTENT_WEIGHTING': [[0.25, 1], [0.4, 3], [0.35, 9]],
        'HAS_PICTURE': [[0.8, true], [0.2, false]]
    },
    'lecturer': {
        'SEX': [[0.5, 'M'],[0.5, 'F']],
        'USER_ACCOUNT_PRIVACY': [[0.4, 'public'], [0.6, 'loggedin']],
        'HAS_BASIC_INFO_SECTION': [[0.7, true],[0.3, false]],
        'HAS_EMAIL': [[0.7, true], [0.3, false]],
        'HAS_DEPARTMENT': [[0.7, true], [0.3, false]],
        'HAS_COLLEGE': [[0.3, true], [0.7, false]],
        'HAS_ABOUT_ME_SECTION': [[0.4, true],[0.6, false]],
        'ABOUT_ME_PRIVACY': [[0.2, 'public'], [0.40, 'loggedin'], [0.40, 'private']],
        'HAS_ABOUT_ME': [[0.5, true], [0.5, false]],
        'ABOUT_ME': [2, 2, 1, 25],
        'HAS_ACADEMIC_INTERESTS': [[0.6, true], [0.4, false]],
        'ACADEMIC_INTERESTS': [2, 2, 1, 50],
        'HAS_PERSONAL_INTERESTS': [[0.3, true], [0.7, false]],
        'PERSONAL_INTERESTS': [3, 2, 1, 25],
        'HAS_HOBBIES': [[0.25, true], [0.75, false]],
        'HOBBIES': [3, 2, 1, 20],
        'PUBLICATIONS_PRIVACY': [[0.6, 'public'], [0.35, 'loggedin'], [0.05, 'private']],
        'PUBLICATIONS': [3, 3, 0, 50],
        'GROUPS_WEIGHTING': [[0.4, 1], [0.4, 3], [0.2, 9]],
        'CONTENT_WEIGHTING': [[0.2, 1], [0.6, 3], [0.2, 9]],
        'HAS_PICTURE': [[0.5, true], [0.5, false]]
    },
    'researcher': {
        'SEX': [[0.5, 'M'],[0.5, 'F']],
        'USER_ACCOUNT_PRIVACY': [[0.7, 'public'], [0.3, 'loggedin']],
        'HAS_BASIC_INFO_SECTION': [[0.7, true],[0.3, false]],
        'HAS_EMAIL': [[0.8, true], [0.2, false]],
        'HAS_DEPARTMENT': [[0.7, true], [0.3, false]],
        'HAS_COLLEGE': [[0.3, true], [0.7, false]],
        'HAS_ABOUT_ME_SECTION': [[0.4, true],[0.6, false]],
        'ABOUT_ME_PRIVACY': [[0.6, 'public'], [0.35, 'loggedin'], [0.05, 'private']],
        'HAS_ABOUT_ME': [[0.7, true], [0.3, false]],
        'ABOUT_ME': [2, 2, 1, 25],
        'HAS_ACADEMIC_INTERESTS': [[0.8, true], [0.2, false]],
        'ACADEMIC_INTERESTS': [5, 3, 1, 50],
        'HAS_PERSONAL_INTERESTS': [[0.5, true], [0.5, false]],
        'PERSONAL_INTERESTS': [3, 2, 1, 25],
        'HAS_HOBBIES': [[0.4, true], [0.6, false]],
        'HOBBIES': [3, 2, 1, 30],
        'PUBLICATIONS_PRIVACY': [[0.9, 'public'], [0.08, 'loggedin'], [0.02, 'private']],
        'PUBLICATIONS': [10, 6, 0, 100],
        'GROUPS_WEIGHTING': [[0.2, 1], [0.5, 3], [0.3, 9]],
        'CONTENT_WEIGHTING': [[0.15, 1], [0.5, 3], [0.35, 9]],
        'HAS_PICTURE': [[0.7, true], [0.3, false]]
    }
};


/*!
 * Provides an ASM distribution that distributes how many users a given user will follow. This is a **primary distribution**
 * in that its result will actually specify how many follows can exist in the system, and distribute them among potential
 * followers. Based on a 1000 followable (non-private) user set, this is the distribution:
 *
 *  avg = <num users> / 50      : On average, a user will follow 2% of the followable users in the system (i.e., 20 users in 1000 user batch)
 *  stddev = <num users> / 60   : 68% of the users will follow 3 to 35 (.03% to 3.5%) followable users
 *  max = <num users> / 10      : A user will never follow more than 100 (10%) of the followable users in the system
 */
var _createFollowingDistribution = function(numFollowableUsers) {
    // On average a single user will follow 1/50th of all users in the system. For a system with 1000 users
    // this equates to an average of 20 users
    var avg = Math.floor(numFollowableUsers/50);
    var stddev = Math.floor(numFollowableUsers/60);

    // At the peak, a user will follow 1/10th of the system. For a system with 1000 users, that is 100 users
    var max = Math.floor(numFollowableUsers/10);

    return [avg, stddev, 0, max];
};

/*!
 * Provides an ASM distribution that distributes how many followers a user will have in the system model. Note
 * that this distribution is **secondary** to the following distribution, in that we can only distribute as many
 * follows with this distribution as specifed by `_createFollowingDistribution`. The output of the method is an
 * index that can be used in an array of potential users to follow. The distribution is:
 *
 *  avg = <num followable users> / 25       : A user will on average consume 4% of the follows in the system
 *  stddev = <num followable users> / 10    : 68% (unpopular) users will consume 9% of the follows / 32% (popular) users will consume 91% of the follows
 *  max = <num followable users>            : The max will always be the number of followable users available, lest they never consume any follows
 */
var _createFollowerDistribution = function(numFollowableUsers) {
    var avg = Math.floor(numFollowableUsers/25);
    var stddev = Math.floor(numFollowableUsers/10);
    return [avg, stddev, 0, numFollowableUsers - 1];
};


////////////////
// USER MODEL //
////////////////

exports.User = function(batchid, TENANT_ALIAS) {
    var that = {};

    that.userType = general.randomize([[0.6, 'student'],[0.1, 'lecturer'],[0.3, 'researcher']]);

    that.sex = general.randomize(DISTRIBUTIONS[that.userType].SEX);
    that.firstName = general.generateFirstName(that.sex);
    that.lastName = general.generateLastName();
    that.displayName = that.firstName + ' ' + that.lastName;
    that.userid = general.generateId(batchid, [that.firstName, that.lastName]);
    that.id = 'u:' + TENANT_ALIAS + ':' + that.userid;
    that.password = general.generatePassword();

    that.userAccountPrivacy = general.randomize(DISTRIBUTIONS[that.userType].USER_ACCOUNT_PRIVACY);

    that.basicInfo = {
        hasBasicInfoSection: general.randomize(DISTRIBUTIONS[that.userType].HAS_BASIC_INFO_SECTION),
        hasEmail: general.randomize(DISTRIBUTIONS[that.userType].HAS_EMAIL),
        email: general.generateEmail([that.firstName, that.lastName]),
        hasDepartment: general.randomize(DISTRIBUTIONS[that.userType].HAS_DEPARTMENT),
        department: general.generateDepartment(),
        hasCollege: general.randomize(DISTRIBUTIONS[that.userType].HAS_COLLEGE),
        college: general.generateCollege()
    };

    that.aboutMe = {
        hasAboutMeSection: general.randomize(DISTRIBUTIONS[that.userType].HAS_ABOUT_ME_SECTION),
        aboutMePrivacy: general.randomize(DISTRIBUTIONS[that.userType].ABOUT_ME_PRIVACY),
        hasAboutMe: general.randomize(DISTRIBUTIONS[that.userType].HAS_ABOUT_ME),
        aboutMe: general.generateSentence(general.ASM(DISTRIBUTIONS[that.userType].ABOUT_ME)),
        hasAcademicInterests: general.randomize(DISTRIBUTIONS[that.userType].HAS_ACADEMIC_INTERESTS),
        academicInterests: general.generateKeywords(general.ASM(DISTRIBUTIONS[that.userType].ACADEMIC_INTERESTS)),
        hasPersonalInterests: general.randomize(DISTRIBUTIONS[that.userType].HAS_PERSONAL_INTERESTS),
        personalInterests: general.generateKeywords(general.ASM(DISTRIBUTIONS[that.userType].PERSONAL_INTERESTS)),
        hasHobbies: general.randomize(DISTRIBUTIONS[that.userType].HAS_HOBBIES),
        hobbies: general.generateKeywords(general.ASM(DISTRIBUTIONS[that.userType].HOBBIES))
    };

    var publications = [];
    var numberOfPublications = general.ASM(DISTRIBUTIONS[that.userType].PUBLICATIONS);
    for (var p = 0; p < numberOfPublications; p++) {
        publications.push(new exports.Publication(that));
    }
    that.publications = {
        publicationsPrivacy: general.randomize(DISTRIBUTIONS[that.userType].PUBLICATIONS_PRIVACY),
        publications: publications
    };

    that.groupWeighting = general.randomize(DISTRIBUTIONS[that.userType].GROUPS_WEIGHTING);
    that.contentWeighting = general.randomize(DISTRIBUTIONS[that.userType].CONTENT_WEIGHTING);

    that.picture = {
        hasPicture: general.randomize(DISTRIBUTIONS[that.userType].HAS_PICTURE),
        picture: general.generateUserPicture()
    };

    return that;
};

exports.setFollowing = function(users) {
    var allUsers = _.values(users);
    var nonPrivateUsers = [];
    _.each(allUsers, function(user) {
        if (user.visibility !== 'private') {
            nonPrivateUsers.push(user);
        }
    });

    var followingDistribution = _createFollowingDistribution(nonPrivateUsers.length);
    var followersDistribution = _createFollowerDistribution(nonPrivateUsers.length);
    _.each(allUsers, function(user) {
        user.following = [];
        var numFollowing = general.ASM(followingDistribution);
        for (var i = 0; i < numFollowing; i++) {
            // Get a unique new followed user that isn't the current user
            var followedIndex = general.ASM(followersDistribution);
            var followedUserId = nonPrivateUsers[followedIndex].id;
            var tries = 0;
            while (followedUserId === user.id || _.contains(user.following, followedUserId)) {
                followedIndex = general.ASM(followersDistribution);
                followedUserId = nonPrivateUsers[followedIndex].id;
            }

            // Indicate that the user will follow this user
            user.following.push(nonPrivateUsers[followedIndex].id);
        }
    });
};

exports.Publication = function(user) {
    var that = {};

    that.title = general.generateSentence(1);
    that.mainAuthor = user.lastName + ' ' + user.firstName.substring(0, 1) + '.';
    that.publisher = general.generateCity() + ' Press';
    that.placeofpublication = general.generateCity();
    that.year = general.ASM([2005, 15, 1990, 2012]);

    return that;
};
