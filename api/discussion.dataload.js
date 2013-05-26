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
var messageLoader = require('./message.dataload');

exports.loadDiscussion = function(discussion, users, groups, SERVER_URL, callback) {
    createDiscussion(discussion, users, groups, SERVER_URL, function(body, success, res) {
        if (success) {
            try {
                // Get the generated content id and add it to the content item
                discussion.originalid = discussion.id;
                discussion.id = discussion.generatedid = JSON.parse(body).id;
            } catch (err) {
                console.log('Error parsing create discussion response body:');
                console.log(body);
                console.log(err);
                return callback(body, success, res);
            }

            // Create the discussion messages.
            var discussionUsers = _.union(discussion.roles['manager'].users, discussion.roles['member'].users);
            var createdMessages = [];
            createMessages(discussion, users, groups, SERVER_URL, discussionUsers, createdMessages, function() {
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
 * @param  {Discussion}  discussion      The discussion object to create
 * @param  {User[]}      users           An array of all the User model objects in this batch.
 * @param  {Group[]}     groups          An array of all the Group model objects in this batch.
 * @param  {String}      SERVER_URL      The server where the messages should be created.
 * @param  {Function}    callback        Standard callback function
 */
var createDiscussion = function(discussion, users, groups, SERVER_URL, callback) {
    var discussionObj = {
        'displayName': discussion.name,
        'visibility': discussion.visibility,
        'description': discussion.description
    };

    if (discussion.roles['member'].users.length || discussion.roles['member'].groups.length) {
        discussionObj['members'] = _.union(discussion.roles['member'].users, discussion.roles['member'].groups);
    }
    if (discussion.roles['manager'].users.length || discussion.roles['manager'].groups.length) {
        discussionObj['managers'] = _.union(discussion.roles['manager'].users, discussion.roles['manager'].groups);
    }

    general.urlReq(SERVER_URL + '/api/discussion/create', {
        'method': 'POST',
        'params': discussionObj,
        'auth': users[discussion.creator],
        'telemetry': 'Create discussion'
    }, callback);
};

/**
 * Creates the messages for a discussion.
 *
 * @param {Discussion}  discussion      The discussion object to create the messages for
 * @param {User[]}      users           An array of all the User model objects in this batch.
 * @param {Group[]}     groups          An array of all the Group model objects in this batch.
 * @param {String}      SERVER_URL      The server where the messages should be created.
 * @param {User[]}      discussionUsers An array of users that are members or managers of this discussion. For each message we'll select at random if the discussion creator or one of the discussion members/manager should create the message.
 * @param {Object[]}    createdMessages An array of message items that are already created for this discussion. The id's will be used to generate replies on messages (ie: threading)
 * @param {Function}    callback        Standard callback function
 */
var createMessages = function(discussion, users, groups, SERVER_URL, discussionUsers, createdMessages, callback) {
    if (discussion.hasMessages && discussion.messages.length > 0) {
        messageLoader.createMessages(discussion.id, 'discussion', discussion.messages, users, SERVER_URL, discussionUsers, users[discussion.creator], createdMessages, callback);
    } else {
        callback();
    }
};
