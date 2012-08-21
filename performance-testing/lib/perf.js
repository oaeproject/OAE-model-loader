var mkdirp = require('mkdirp');
var fs = require('fs');

exports.generateCsvData = function(numberOfBatches, modelBuilderBaseDir, outputDir, callback) {

  mkdirp.sync(outputDir);
  
  var usersOutput = outputDir+'/users.csv';
  var invitesOutput = outputDir+'/can_invite.csv';
  var acceptancesOutput = outputDir+'/can_accept.csv';
  
  try { fs.unlinkSync(usersOutput); } catch (e) {}
  try { fs.unlinkSync(invitesOutput); } catch (e) {}
  try { fs.unlinkSync(acceptancesOutput); } catch (e) {}
  
  var processBatch = function(batchNumber) {
    
    if (batchNumber >= numberOfBatches) {
      console.log('Complete batch processing.');
      callback();
    }
  
    console.log('Processing batch #'+batchNumber);
  
    var usersBatchFile = modelBuilderBaseDir+'/scripts/users/'+batchNumber+'.txt';
    var contactsBatchFile = modelBuilderBaseDir+'/scripts/contacts/'+batchNumber+'.txt';
    var worldsBatchFile = modelBuilderBaseDir+'/scripts/worlds/'+batchNumber+'.txt';
  
    fs.readFile(usersBatchFile, 'utf8', function(err, data) {
      assert(err);
    
      var users = {};
      var userMemberships = {};
      var userPseudoMemberships = {};
    
      data = data.split('\n');
      
      // build the usernames and passwords
      
      data.forEach(function(item) {
        item = JSON.parse(item);
        users[item.userid] = item.password;
        
        // seed the membership arrays
        userMemberships[item.userid] = {}; // unique
        userPseudoMemberships[item.userid] = [];
      });
      
      // Read worlds to build membership / role request info
    
      fs.readFile(worldsBatchFile, 'utf8', function(err, data) {
        assert(err);
        data = data.split('\n');
        
        // Building membership / role information for users
        
        var worldNum = 0;
        data.forEach(function(world) {
          world = JSON.parse(world);
          for (var roleId in world['roles']) {
            world['roles'][roleId]['users'].forEach(function(userId) {
              // if the user is a lecturer in world called "CourseA", then their pseudo group is "CourseA-lecturer"
              userMemberships[userId][world.id] = true;
              userPseudoMemberships[userId].push(world.id+'-'+roleId);
            });
          }
        });
        
        // Writing user, password, membership info
        
        var fd = fs.openSync(usersOutput, 'a');
        for (var userId in users) {
          var pw = users[userId];
          var memberships = userMemberships[userId]; // e.g., [groupA, groupB, groupC, ...]
          var membershipRequests = generateMyMembershipsInfoRequests(memberships); // e.g., [{url: '/system/userManager/group/groupA.json, method: 'GET' ...}, ...]
          var encodedMembershipRequests = encodeURIComponent(JSON.stringify(membershipRequests));
      
          var pseudoMemberships = userPseudoMemberships[userId];
          var membershipMembersRequests = generateMyMembershipsMembersInfoRequests(pseudoMemberships);
          var encodedMembershipMembersRequests = encodeURIComponent(JSON.stringify(membershipMembersRequests));
          
          buffer = new Buffer(userId+','+users[userId]+','+encodedMembershipRequests+','+encodedMembershipMembersRequests+'\n');
          fs.writeSync(fd, buffer, 0, buffer.length, null);				
        }
        fs.closeSync(fd);
        
        // Build contacts
        
        fs.readFile(contactsBatchFile, 'utf8', function(err, data) {
          data = data.split('\n');
          
          // Creating all possible combinations of contact invitations. Contacts that have already been made will be removed from this dictionary
          
          var canInvite = createPotentialInvites(users);
          var canAccept = {}
          var contactsNum = 0;
      
          // delete contacts that are already connected
          data.forEach(function(item) {
            contactsNum++;
          
            item = JSON.parse(item);
            
            // Record the fact that the source user CANNOT invite the dest user
            deletePotentialInvite(canInvite, item.inviter, item.invitee);
            deletePotentialInvite(canInvite, item.invitee, item.inviter);
            
            // Record the fact that the source may accept the dest, if true
            if (!item['willAccept']) {
              canAccept[item.inviter] = item.invitee;
            }
          });
      
          // write contact invites
          
          var fd = fs.openSync(invitesOutput, 'a');
          for (var inviterId in canInvite) {
            var i;
            for (i = 0; i < canInvite[inviterId].length; i++) {
              var inviteeId = canInvite[inviterId][i];
              if (inviteeId) {
                var buffer = new Buffer(inviterId+','+users[inviterId]+','+inviteeId+','+users[inviteeId]+'\n');
                fs.writeSync(fd, buffer, 0, buffer.length, null);
              }
            }
          }
          fs.closeSync(fd);

          // write invitation acceptances
          
          fd = fs.openSync(acceptancesOutput, 'a');
          for (var inviter in canAccept) {
            var invitee = canAccept[inviter];
            buffer = new Buffer(inviter+','+users[inviter]+','+invitee+','+users[invitee]+'\n');
            fs.writeSync(fd, buffer, 0, buffer.length, null);
          }
          fs.closeSync(fd);
          
          // on to the next.
          processBatch(batchNumber+1);
          
        }); // done processing contacts
      }); // done processing worlds
    }); // done processing users
  }; // end processBatch

  processBatch(0);
  
  // Data processing helpers
  
  function deletePotentialInvite(potentialInvites, sourceUserId, destUserId) {
    var i;
    for (i = 0; i < potentialInvites[sourceUserId].length; i++) {
      var potentialDestUserId = potentialInvites[sourceUserId][i];
      if (potentialDestUserId == destUserId) {
        potentialInvites[sourceUserId][i] = false;
      }
    }
  }
  
  function createPotentialInvites(users) {
    var potentialInvites = {};
    var maxInvitesPerUser = 10;
    var totalUsers = Object.keys(users).length;
    
    for (var sourceUserId in users) {
      potentialInvites[sourceUserId] = [];
      
      // do a "round-robin" search since we want to start at a random location
      var start = Math.floor(Math.random()*totalUsers);
      var end = (start == 0) ? totalUsers-1 : start-1; 
      var userIdKeys = Object.keys(users);

      var i;
      for (i = start; i != end; i = (i+1)%totalUsers) {
        var destUserId = userIdKeys[i];
        if (sourceUserId == destUserId)
          continue;
        if (potentialInvites[sourceUserId].length >= maxInvitesPerUser)
          break;
        potentialInvites[sourceUserId].push(destUserId)
      }
    }
    return potentialInvites;
  }
       
  function generateMyMembershipsInfoRequests(memberships) {
    // memberships is an object of {<groupId>: true}
    var requests = [];
    for (var membership in memberships) {
      requests.push({
        "url": "/system/userManager/group/"+membership+".json",
        "method": "GET",
        "_charset_": "utf-8"});
    }
    return requests;
  }
  
  function generateMyMembershipsMembersInfoRequests(pseudoMemberships) {
    // pseudo memberships are an array of group id's
    var requests = [];
    pseudoMemberships.forEach(function(pseudoMembership) {
      requests.push({
        "url": "/system/userManager/group/"+pseudoMembership+".members.json",
        "method": "GET",
        "_charset_": "utf-8",
        "parameters": {
            "_charset_": "utf-8",
            "items": 1000
          }
        });
    });
    return requests;
  }
  
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
      process.exit(1);
    }
  }
  
}; // end export.generateCsvData