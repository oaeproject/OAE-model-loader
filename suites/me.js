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

var general = require('./../api/general.js');
var suiteAPI = require('./../api/suite.js');

exports.Suite = function(datamodel, SERVER_URL) {
    var id = 'me';
    var title = 'Me';
    var threshold = 90;
    var target = 100;
    var elements = [];
    var runs = [];

    // Me Feed
    elements.push(new suiteAPI.SuiteElement('me-data', 'Me Feed', 200, 1000, 0.05, 1));
    elements.push(new suiteAPI.SuiteElement('visibility-overview', 'Visibility overview', 200, 1000, 0.05, 1));
    elements.push(new suiteAPI.SuiteElement('all-profile', 'All profile', 200, 1000, 0.05, 1));

    for (var b = 0; b < datamodel.length; b++) {
        for (var u in datamodel[b].users) {
            var user = datamodel[b].users[u];
            runs.push({
                'type': 'me-data',
                'url': SERVER_URL + '/api/me',
                'user': user,
                'method': 'GET'
            });
            runs.push({
                'type': 'visibility-overview',
                'url': SERVER_URL + '/api/user/' + user.id + '/visibility',
                'user': user,
                'method': 'GET'
            }); 
            runs.push({
                'type': 'all-profile',
                'url': SERVER_URL + '/api/user/' + user.id + '/profile',
                'user': user,
                'method': 'GET'
            });
        }
    }

    // Define elements
    var suite = new suiteAPI.Suite(id, title, threshold, target, elements, runs);
    return suite;
};
