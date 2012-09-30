var _ = require('underscore');
var fs = require('fs');

var general = require('./general.js');

//////////////
// USER API //
//////////////

exports.loadContent = function(content, users, groups, SERVER_URL, callback) {
    createContent(content, users, groups, SERVER_URL, callback);
};

var createContent = function(content, users, groups, SERVER_URL, callback) {
    var contentObj = {
        'contentType': content.contentType,
        'name': content.name,
        'visibility': content.visibility
    }
    if (content.contentType === 'link') {
        contentObj['link'] = content.link;
    }
    if (content.hasDescription) {
        contentObj['description'] = content.description;
    }
    if (content.roles['viewer'].users.length || content.roles['viewer'].groups.length) {
        contentObj['viewers'] = _.union(content.roles['viewer'].users, content.roles['viewer'].groups);
    }
    if (content.roles['manager'].users.length || content.roles['manager'].groups.length) {
        contentObj['managers'] = _.union(content.roles['manager'].users, content.roles['manager'].groups);
    }
    general.urlReq(SERVER_URL + '/api/content/create', {
        method: 'POST',
        params: contentObj,
        auth: users[content.creator]
    }, callback);
};
