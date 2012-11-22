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

//////////////
// USER API //
//////////////

exports.loadContent = function(content, users, groups, SERVER_URL, callback) {
    createContent(content, users, groups, SERVER_URL, function(body, success, res) {
        if (success) {
            content.originalid = content.id;
            content.id = content.generatedid = JSON.parse(body).contentId;
        }
        callback(body, success, res);
    });
};

var createContent = function(content, users, groups, SERVER_URL, callback) {
    var contentObj = {
        'contentType': content.contentType,
        'name': content.name,
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

    if (content.contentType === 'file') {
        general.filePost(SERVER_URL + '/api/content/create', content.path, contentObj.name, {
                'auth': users[content.creator],
                'telemetry': 'Create file content',
                'params': contentObj,
            }, callback);

    } else {
        if (content.contentType === 'link') {
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
