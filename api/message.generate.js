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
var fs = require('fs');

var general = require('./general.js');

/**
 * Generates a tree of message.
 *
 * @param  {Number[]}   nrOfMessagesDistr   An array that can be used to calculate the average, standard deviation and maximum amount of messages
 * @param  {Number[]}   messageLengthDistr  An array that can be used to calculate the average, standard deviation and maximum length of a message body
 * @return {Object[]}                       A flat array of message objects. Each object holds a `message` and a `replyTo` key. If the message is a top level message, the `replyTo` key will be set to `root`.
 */
var generateMessages = module.exports.generateMessages = function(nrOfMessagesDistr, messageLengthDistr) {
    var nrOfMessages = general.ASM(nrOfMessagesDistr);
    var allMessages = [];

    while (nrOfMessages > 0) {
        var message = _generateMessage(messageLengthDistr);

        // Find a message to attach it to.
        // If the index === the length (ie: a non-existing message), we stick it in the root.
        message.replyTo = Math.floor(Math.random() * (allMessages.length + 1));
        if (message.replyTo === allMessages.length) {
            message.replyTo = 'root';
        }

        allMessages.push(message);
        nrOfMessages--;
    }
    return allMessages;
};

var _generateMessage = function(messageLengthDistr) {
    return {
        'message': general.generateSentence(general.ASM(messageLengthDistr))
    };
};
