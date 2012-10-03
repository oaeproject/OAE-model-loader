var mkdirp = require('mkdirp');
var fs = require('fs');

exports.generateCsvData = function(numberOfBatches, modelBuilderBaseDir, outputDir, callback) {

    mkdirp.sync(outputDir);
    
    var usersOutput = outputDir + '/users.csv';

    // recursively process batches from batchNumber to numberOfBatches
    var processBatch = function(batchNumber) {
        
        if (batchNumber >= numberOfBatches) {
          console.log('Complete batch processing.');
          callback();
        }
      
        console.log('Processing batch #'+batchNumber);
      
        var usersBatchFile = modelBuilderBaseDir + '/scripts/users/' + batchNumber + '.txt';
        var worldsBatchFile = modelBuilderBaseDir + '/scripts/groups/' + batchNumber + '.txt';
        var contentBatchFile = modelBuilderBaseDir + '/scripts/content/' + batchNumber + '.txt';
      
        fs.readFile(usersBatchFile, 'utf8', function(err, userData) {
            fs.readFile(worldsBatchFile, 'utf8', function(err, groupData) {
                fs.readFile(contentBatchFile, 'utf8', function(err, contentData) {
                    assert(err);

                    var users = {};

                    userData = userData.split('\n');

                    // build the usernames and passwords
                    userData.forEach(function(item) {
                        item = JSON.parse(item);
                        users[item.userid] = {};
                        users[item.userid].password = item.password;
                        users[item.userid].groups = [];
                        users[item.userid].content = {'viewer': [], 'manager': []};
                    });

                    // Get the groups
                    groupData = groupData.split('\n');
                    groupData.forEach(function(group) {
                        group = JSON.parse(group);
                        group.roles.manager.users.forEach(function(member) {
                            users[member.substr(6)].groups.push(group.id);
                        });
                    });

                    // Get the content
                    contentData = contentData.split('\n');
                    contentData.forEach(function(content) {
                        content = JSON.parse(content);
                        content.roles.manager.users.forEach(function(manager) {
                            users[manager.substr(6)].content.manager.push(content.id);
                        });
                        content.roles.viewer.users.forEach(function(viewer) {
                            users[viewer.substr(6)].content.viewer.push(content.id);
                        });
                    });

                    // Writing username, password info and groups
                    fs.open(usersOutput, 'w', function(err, fd) {
                        assert(err);

                        for (var userId in users) {
                            buffer = new Buffer(userId+','+users[userId].password + ',' + users[userId].groups[0] + ',' + users[userId].content.manager[0] + ',' + users[userId].content.viewer[0] +'\n');
                            fs.writeSync(fd, buffer, 0, buffer.length, null);
                        }
                        fs.closeSync(fd);

                        processBatch(batchNumber+1);
                    });
                });
            });
        });
    }; // end processBatch

    processBatch(0);
    
    // File-system hepers
    function mkdirpSync(leaf, callback) {
        var parts = leaf.split('/');
        var path = '';
        
        // hand relative v.s. absolute path
        if (leaf.slice(0, 1) === '/') {
            path = '/';
            parts.splice(0, 1);
        }
        
        parts.forEach(function(part) {
            path = part+'/';
            try {
                fs.mkdirSync(path);
            } catch (e) { }
        });
    }
    
    // misc.
    function assert(err) {
        if (err) {
            console.log(err);
            console.log(err.stack);
            process.exit(1);
        }
    }
  
}; // end export.generateCsvData
