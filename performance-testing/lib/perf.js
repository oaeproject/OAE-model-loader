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

var mkdirp = require('mkdirp');
var fs = require('fs');

exports.generateCsvData = function(numberOfBatches, modelBuilderBaseDir, outputDir, callback) {
    // Create the output directory.
    mkdirp.sync(outputDir);

    // Loop over each batch, read it and collect the data we need.
    for (var batchNumber = 0; batchNumber < numberOfBatches; batchNumber++) {
        console.log('Processing batch #' + batchNumber);
      
        var usersBatchFile = modelBuilderBaseDir + '/scripts/users/' + batchNumber + '.txt';
        var groupsBatchFile = modelBuilderBaseDir + '/scripts/groups/' + batchNumber + '.txt';

        // Read the data,
        // It doesn't really matter that it happens synchronously as it's the only thing that this module does.
        var userData = fs.readFileSync(usersBatchFile, 'utf8');
        var groupData = fs.readFileSync(groupsBatchFile, 'utf8');

        var users = {};
        var userBatch = userData.split('\n');

        // build the usernames and passwords
        userBatch.forEach(function(item) {
            item = JSON.parse(item);
            users[item.userid] = {};
            users[item.userid].password = item.password;
            users[item.userid].groups = {'member': [], 'manager': []};
        });

        // Get the groups
        groupData = groupData.split('\n');
        groupData.forEach(function(group) {
            group = JSON.parse(group);
            group.roles.manager.users.forEach(function(member) {
                users[member.substr(6)].groups.manager.push(group.id);
            });
            group.roles.member.users.forEach(function(member) {
                users[member.substr(6)].groups.member.push(group.id);
            });
        });

        // Collect data in easy-to-write format.
        var data = [];
        for (var userId in users) {
            for (var i = 0; i < 10 && i < users[userId].groups.member.length; i++)  {
                data.push([userId, users[userId].password, users[userId].groups.member[i]])
            }
        }
    }

    // Write the CSV file.
    var usersCSV = outputDir + '/users.csv';
    var usersFormat = outputDir + '/users.format';
    writeCSVFile(usersCSV, data);

    // Write the format files.
    writeFormatFile(usersFormat, ['username', 'password', 'group'], 'random');
    
    // Output some logging
    console.log('Complete batch processing.');
    console.log('Generated:');
    console.log(usersCSV);
    callback();
};


/**
 * Write a CSV file.
 *
 * @param  {String}                  path   The path to write to
 * @param  {Array<Array<String> >}   data   An array of arrays with string.
 *                                          Each inner array will be formatted on one line as a string of comma-seperated values.
 */
var writeCSVFile = exports.writeCSVFile = function(path, data) {
    var fd = fs.openSync(path, 'w');
    var lines = [];
    for (var i = 0; i < data.length; i++) {
        lines.push(data[i].join(','));
    }
    var buffer = new Buffer(lines.join('\n'));
    fs.writeSync(fd, buffer, 0, buffer.length, null);
};

/**
 * Write a format value.
 *
 * @param {String}          path        The path to write to
 * @param {Array<String>}   columns     An array of string values where each value represents a column name.
 * @param {String}          order       The order that tsung should go trough this file. Defaults to random.
 *                                      Should be either undefined, 'iter' or 'random'.
 */
var writeFormatFile = exports.writeFormatFile = function(path, columns, order) {
    order = order || 'random';
    var fd = fs.openSync(path, 'w');
    var buffer = new Buffer(columns.join(',') + '\n' +  order);
    fs.writeSync(fd, buffer, 0, buffer.length, null);
};
