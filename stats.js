var _ = require('underscore');

var general = require('./api/general.js');

var users = general.loadJSONFileIntoObject('./scripts/users/0.txt');
var groups = general.loadJSONFileIntoObject('./scripts/groups/0.txt');
var content = general.loadJSONFileIntoObject('./scripts/content/0.txt');

/////////////////////////////////
// DEEP GROUP MEMBERSHIP STATS //
/////////////////////////////////

var getMaxGroupDepth = function(currentGroup, groups, processed, depth) {
    if (groups[currentGroup].roles['manager'].groups.length || groups[currentGroup].roles['member'].groups.length) {
        depth = depth + 1;
    }
    var maxDepth = depth;
    for (var g = 0; g < groups[currentGroup].roles['manager'].groups.length; g++) {
        var group = groups[currentGroup].roles['manager'].groups[g];
        if (_.indexOf(processed, group) === -1) {
            var returnDepth = getMaxGroupDepth(group, groups, processed, depth);
            if (returnDepth > maxDepth) {
                maxDepth = returnDepth;
            }
        }
    }
    for (var g = 0; g < groups[currentGroup].roles['member'].groups.length; g++) {
        var group = groups[currentGroup].roles['member'].groups[g];
        if (_.indexOf(processed, group)  === -1) {
            processed.push(group);
            var returnDepth = getMaxGroupDepth(group, groups, processed, depth);
            if (returnDepth > maxDepth) {
                maxDepth = returnDepth;
            }
        }
    }
    return maxDepth;
}

var depths = {};
var memberships = {};
for (var user in users) {
    var maxDepth = 0;
    var totalMemberships = 0;
    for (var group in groups) {
        if (_.indexOf(groups[group].roles['manager'].users, user) !== -1 || _.indexOf(groups[group].roles['member'].users, user) !== -1) {
            totalMemberships++;
            var depth = getMaxGroupDepth(group, groups, [], 1);
            if (depth > maxDepth) {
                maxDepth = depth;
            }
        }
    }
    depths[maxDepth] = (depths[maxDepth] || 0) + 1;
    memberships[totalMemberships] = (memberships[totalMemberships] || 0) + 1;
}

/////////////////////////
// GROUP MEMBERS STATS //
/////////////////////////

var groupmemberships = {};
for (var group in groups) {
    var members = groups[group].roles['manager'].users.length + groups[group].roles['manager'].groups.length;
    members += groups[group].roles['member'].users.length + groups[group].roles['member'].groups.length;
    groupmemberships[members] = (groupmemberships[members] || 0) + 1;
}

/////////////////////////
// GROUP LIBRARY STATS //
/////////////////////////

var libraries = {};
for (var group in groups) {
    var totalLibrarySize = 0;
    for (var c in content) {
        if (_.indexOf(content[c].roles['viewer'].groups, group) !== -1 || _.indexOf(content[c].roles['manager'].groups, group) !== -1) {
            totalLibrarySize++;
        }
    }
    libraries[totalLibrarySize] = (libraries[totalLibrarySize] || 0) + 1;
}

////////////////////////
// USER LIBRARY STATS //
////////////////////////

var userlibraries = {};
for (var user in users) {
    var totalLibrarySize = 0;
    for (var c in content) {
        if (_.indexOf(content[c].roles['viewer'].users, user) !== -1 || _.indexOf(content[c].roles['manager'].users, user) !== -1) {
            totalLibrarySize++;
        }
    }
    userlibraries[totalLibrarySize] = (userlibraries[totalLibrarySize] || 0) + 1;
}


console.log("*******************");
console.log("Depth overview is (key = maximum group depth, value = number of users with that maximum group depth)");
console.log(depths); 
console.log("\n\nMembership overview is (key = number of memberships, value = number of users with that number of memberships)");
console.log(memberships); 
console.log("\n\nGroup membership overview is (key = number of members, value = number of groups with that number of members)");
console.log(groupmemberships);
console.log("\n\nGroup library overview is (key = number of content items, value = number of groups with that number of content items)");
console.log(libraries);
console.log("\n\User library overview is (key = number of content items, value = number of users with that number of content items)");
console.log(userlibraries);
console.log("*******************");
