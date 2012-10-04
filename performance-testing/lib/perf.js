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
      
        fs.readFile(usersBatchFile, 'utf8', function(err, data) {
            assert(err);
          
            var users = {};
            
            data = data.split('\n');
            
            // build the usernames and passwords
            data.forEach(function(item) {
                item = JSON.parse(item);
                users[item.userid] = item.password;
            });

            // Writing username and password info
            fs.open(usersOutput, 'a', function(err, fd) {
                assert(err);

                for (var userId in users) {
                    buffer = new Buffer(userId+','+users[userId]+'\n');
                    fs.writeSync(fd, buffer, 0, buffer.length, null);       
                }
                fs.closeSync(fd);

                processBatch(batchNumber+1);
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
