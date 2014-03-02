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

var createMessages = module.exports.createMessages = function(messageBoxId, type, messages, allUsers, SERVER_URL, resourceUsers, fallbackUser, createdMessages, callback) {
    if (messages.length > 0) {
        var message = messages.shift();
        createMessage(messageBoxId, type, message, allUsers, SERVER_URL, resourceUsers, fallbackUser, createdMessages, function() {
            createMessages(messageBoxId, type, messages, allUsers, SERVER_URL, resourceUsers, fallbackUser, createdMessages, callback);
        });
    } else {
        callback();
    }
};

/**
 * Creates one message on a piece of discussion.
 *
 * @param  {String}     messageBoxId    The ID of the messagebox (a contentId, discussionId, ..)
 * @param  {String}     type            'content' or 'discussion' or ..
 * @param  {Message}    message         The message to create
 * @param  {User[]}     allUsers        An array of all the User model objects in this batch.
 * @param  {String}     SERVER_URL      The server where the messages should be created.
 * @param  {User[]}     resourceUsers   An array of users that are members or managers of this piece of discussion. For each message we'll select at random if the content creator or one of the content members/manager should create the message.
 * @param  {User}       fallbackUser    A fallback user which will be selected 1 out of 3 times.
 * @param  {Object[]}   createdMessages An array of message items that are already created for this piece of discussion. The id's will be used to generate replies on messages (ie: threading)
 * @param  {Function}   callback        Standard callback function
 */
var createMessage = module.exports.createMessage = function(messageBoxId, type, message, allUsers, SERVER_URL, resourceUsers, fallbackUser, createdMessages, callback) {
    var params = {
        'body': message.message
    };

    if (message.replyTo !== 'root') {
        params.replyTo = createdMessages[message.replyTo].created;
    }

    var user = null;
    // 1 out 3 messages are made by the creator.
    if (resourceUsers.length > 0 && Math.floor(Math.random() * 2) === 1) {
        var userId = resourceUsers[Math.floor(Math.random() * resourceUsers.length)];
        user = _.find(allUsers, function(user) { return user.id === userId; });
    }
    // If there is no user found, the creator will just message.
    if (!user) {
        user = fallbackUser;
    }

    var url = SERVER_URL + '/api/' + type + '/' + messageBoxId + '/messages';
    general.urlReq(url, {
        'method': 'POST',
        'params': params,
        'auth': user
    }, function(body, success, res) {
        try {
            var createdMessage = JSON.parse(body);
            message.id = createdMessage.messageId;
            message.created = createdMessage.created;
        } catch (err) {
            console.log('Error parsing create message response body:');
            console.log(body);
            console.log(err);
        }
        createdMessages.push(message);
        callback();
    });
};
