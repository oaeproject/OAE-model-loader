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
var util = require('util');

var general = require('./general');

var loadfolder = module.exports.loadfolder = function(folder, users, groups, content, serverUrl, callback) {
    _createfolder(folder, users, serverUrl, function(body, success, res) {
        if (!success) {
            return callback(body, success, res);
        }

        // Get the generated folder id and add it to the folder
        folder.originalid = folder.id;
        try {
            folder.originalid = folder.id;
            folder.id = folder.generatedid = JSON.parse(body).id;
        } catch (ex) {
            console.log('Error parsing create folder HTTP response:');
            console.log(body);
            return callback(body, success, res);
        }

        return _addContentItems(folder, users, content, serverUrl, callback);
    });
};

var _createfolder = function(generatedfolder, users, serverUrl, callback) {
    var folder = {
        'displayName': generatedfolder.name,
        'description': generatedfolder.description,
        'visibility': generatedfolder.visibility
    };

    var managers = _.union(generatedfolder.roles.manager.users, generatedfolder.roles.manager.groups);
    var members = _.union(generatedfolder.roles.member.users, generatedfolder.roles.member.groups);

    return general.urlReq(util.format('%s/api/folder', serverUrl), {
        'method': 'POST',
        'params': _.extend({'managers': managers, 'members': members}, folder),
        'auth': users[generatedfolder.creator]
    }, callback);
};

var _addContentItems = function(generatedfolder, users, content, serverUrl, callback) {
    if (_.isEmpty(generatedfolder.contentIds)) {
        return callback();
    }

    return general.urlReq(util.format('%s/api/folder/%s/library', serverUrl, generatedfolder.generatedid), {
        'method': 'POST',
        'auth': users[generatedfolder.creator],
        'params': {
            'contentIds': generatedfolder.contentIds
        }
    }, callback);
};
