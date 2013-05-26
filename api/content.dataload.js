/*
 * Copyright 2012 Sakai Foundation (SF) Licensed under the
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

exports.loadContent = function(content, users, groups, SERVER_URL, callback) {
    createContent(content, users, groups, SERVER_URL, function(body, success, res) {
        if (success) {
            // Get the generated content id and add it to the content item
            content.originalid = content.id;
            try {
                content.originalid = content.id;
                content.id = content.generatedid = JSON.parse(body).id;
            } catch (err) {
                console.log('Error parsing create content response body:');
                console.log(body);
                console.log(err);
                return callback(body, success, res);
            }

            // Create the content comments.
            // We only comment on files and links for now.
            var contentUsers = _.union(content.roles['manager'].users, content.roles['viewer'].users);
            var createdComments = [];
            createComments(content, users, groups, SERVER_URL, contentUsers, createdComments, function() {
                callback(body, success, res);
            });
        } else {
            callback(body, success, res);
        }
    });
};

/**
 * Create a new piece of content
 *
 * @param  {Content}     content         The content object to create
 * @param  {User[]}      users           An array of all the User model objects in this batch.
 * @param  {Group[]}     groups          An array of all the Group model objects in this batch.
 * @param  {String}      SERVER_URL      The server where the comments should be created.
 * @param  {Function}    callback        Standard callback function
 */
var createContent = function(content, users, groups, SERVER_URL, callback) {
    var contentObj = {
        'resourceSubType': content.resourceSubType,
        'displayName': content.name,
        'visibility': content.visibility
    };

    if (content.hasDescription) {
        contentObj['description'] = content.description;
    }
    if (content.roles['viewer'].users.length || content.roles['viewer'].groups.length) {
        contentObj['viewers'] = _.union(content.roles['viewer'].users, content.roles['viewer'].groups);
    }
    if (content.roles['manager'].users.length || content.roles['manager'].groups.length) {
        contentObj['managers'] = _.union(content.roles['manager'].users, content.roles['manager'].groups);
    }

    if (content.resourceSubType === 'file') {
        general.filePost(SERVER_URL + '/api/content/create', content.path, content.filename, {
                'auth': users[content.creator],
                'telemetry': 'Create file content',
                'params': contentObj
            }, callback);

    } else {
        if (content.resourceSubType === 'link') {
            contentObj['link'] = content.link;
        }

        general.urlReq(SERVER_URL + '/api/content/create', {
            'method': 'POST',
            'params': contentObj,
            'auth': users[content.creator],
            'telemetry': 'Create link content'
        }, callback);
    }
};

/**
 * Creates the comments for a piece of content.
 *
 * @param {Content}     content         The content object to create the comments for
 * @param {User[]}      users           An array of all the User model objects in this batch.
 * @param {Group[]}     groups          An array of all the Group model objects in this batch.
 * @param {String}      SERVER_URL      The server where the comments should be created.
 * @param {User[]}      contentUsers    An array of users that are members or managers of this piece of content. For each comment we'll select at random if the content creator or one of the content members/manager should create the comment.
 * @param {Object[]}    createdComments An array of comment items that are already created for this piece of content. The id's will be used to generate replies on comments (ie: threading)
 * @param {Function}    callback        Standard callback function
 */
var createComments = function(content, users, groups, SERVER_URL, contentUsers, createdComments, callback) {
    if (content.hasComments && content.comments.length > 0) {
        createComment(content, users, groups, SERVER_URL, contentUsers, createdComments, function(err) {
            createComments(content, users, groups, SERVER_URL, contentUsers, createdComments, callback);
        });
    } else {
        callback();
    }
};

/**
 * Creates one comment on a piece of content.
 *
 * @param {Content}     content         The content object to create the comment for
 * @param {User[]}      users           An array of all the User model objects in this batch.
 * @param {Group[]}     groups          An array of all the Group model objects in this batch.
 * @param {String}      SERVER_URL      The server where the comments should be created.
 * @param {User[]}      contentUsers    An array of users that are members or managers of this piece of content. For each comment we'll select at random if the content creator or one of the content members/manager should create the comment.
 * @param {Object[]}    createdComments An array of comment items that are already created for this piece of content. The id's will be used to generate replies on comments (ie: threading)
 * @param {Function}    callback        Standard callback function
 */
var createComment = function(content, users, groups, SERVER_URL, contentUsers, createdComments, callback) {
    var comment = content.comments.shift();
    var params = {
        'contentId': content.id,
        'body': comment.message
    };

    if (comment.replyTo !== 'root') {
        params.replyTo = createdComments[comment.replyTo].id;
    }

    var user = null;
    // 1 out 3 comments are made by the creator.
    if (contentUsers.length > 0 && Math.floor(Math.random() * 2) === 1) {
        var userId = contentUsers[Math.floor(Math.random() * contentUsers.length)];
        user = _.find(users, function(user) { return user.id === userId; });
    }
    // If there is no user found, the creator will just comment.
    if (!user) {
        user = users[content.creator];
    }

    general.urlReq(SERVER_URL + '/api/content/' + content.id + '/messages', {
        'method': 'POST',
        'params': params,
        'auth': user,
        'telemetry': 'Create link content'
    }, function(body, success, res) {
        try {
            comment.id = JSON.parse(body).commentId;
        } catch (err) {
            console.log('Error parsing create comment response body:');
            console.log(body);
            console.log(err);
        }
        createdComments.push(comment);
        callback();
    });
};
