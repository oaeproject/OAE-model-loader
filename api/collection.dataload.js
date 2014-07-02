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

var loadCollection = module.exports.loadCollection = function(collection, users, groups, content, serverUrl, callback) {
    _createCollection(collection, users, serverUrl, function(body, success, res) {
        if (!success) {
            return callback(body, success, res);
        }

        // Get the generated collection id and add it to the collection
        collection.originalid = collection.id;
        try {
            collection.originalid = collection.id;
            collection.id = collection.generatedid = JSON.parse(body).id;
        } catch (ex) {
            console.log('Error parsing create collection HTTP response:');
            console.log(body);
            return callback(body, success, res);
        }

        return _addContentItems(collection, users, content, serverUrl, callback);
    });
};

var _createCollection = function(generatedCollection, users, serverUrl, callback) {
    var collection = {
        'displayName': generatedCollection.name,
        'description': generatedCollection.description,
        'visibility': generatedCollection.visibility
    };

    var managers = _.union(generatedCollection.roles.manager.users, generatedCollection.roles.manager.groups);
    var members = _.union(generatedCollection.roles.member.users, generatedCollection.roles.member.groups);

    return general.urlReq(util.format('%s/api/collection', serverUrl), {
        'method': 'POST',
        'params': _.extend({'managers': managers, 'members': members}, collection),
        'auth': users[generatedCollection.creator]
    }, callback);
};

var _addContentItems = function(generatedCollection, users, content, serverUrl, callback) {
    if (_.isEmpty(generatedCollection.contentIds)) {
        return callback();
    }

    return general.urlReq(util.format('%s/api/collection/%s/library', serverUrl, generatedCollection.generatedid), {
        'method': 'POST',
        'auth': users[generatedCollection.creator],
        'params': {
            'contentIds': generatedCollection.contentIds
        }
    }, callback);
};
