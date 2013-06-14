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

///////////////////////////
// GENERIC API FUNCTIONS //
///////////////////////////

// Generator object
Generators = require('gen');

// File reader
var fs = require('fs');
var gm = require('gm');
var mime = require('mime');
var Path = require('path');
var util = require('util');


exports.loadFileIntoArray = function(filename) {
    var content = fs.readFileSync(filename, 'utf8');
    var finallines = [];
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(/\r/g, '');
        if (lines[i]) {
            finallines.push(lines[i]);
        }
    }
    return finallines;
};

exports.loadJSONFileIntoObject = function(filename) {
    var items = exports.loadFileIntoArray(filename);
    var finalitems = {};
    for (var i = 0; i < items.length; i++) {
        var item = JSON.parse(items[i]);
        finalitems[item.id] = item;
    }
    return finalitems;
};

exports.writeFile = function(filename, content) {
    try {
        fs.unlinkSync(filename);
    } catch (err) {}
    fs.writeFileSync(filename, content, 'utf8');
};

exports.writeObjectToFile = function(filename, object) {
    try {
        fs.unlinkSync(filename);
    } catch (err) {}
    var finalArray = [];
    for (var i in object) {
        finalArray.push(JSON.stringify(object[i]));
    }
    fs.writeFileSync(filename, finalArray.join('\n'), 'utf8');
};

// Folder specific functions
exports.folderExists = function(path) {
    return fs.existsSync(path);
};

exports.createFolder = function(path) {
    if (!exports.folderExists(path)) {
        fs.mkdirSync(path);
    };
};

// List files in a folder
exports.getFileListForFolder = function(foldername) {
    var files = fs.readdirSync(foldername);
    return files;
};

// List files in a folder who match one of the specified mimetypes
exports.getFilesInFolder = function(foldername, mimetypes) {
    var files = fs.readdirSync(foldername);
    var matchedFiles = [];
    for (var i = 0; i < files.length; i++) {
        var type = mime.lookup(foldername + '/' + files[i]);
        if (mimetypes.indexOf(type) !== -1) {
            matchedFiles.push(files[i]);
        }
    }
    return matchedFiles;
};

exports.removeFilesInFolder = function(foldername) {
    var files = exports.getFileListForFolder(foldername);
    for (var f = 0; f < files.length; f++) {
        fs.unlinkSync(foldername + '/' + files[f]);
    }
};

// Randomize function
// Pass this something along the lines of [[0.5, 'M'],[0.5, 'F']]
exports.randomize = function(_mapfunc) {
    // Make a copy of the array
    var mapFuncLength = _mapfunc.length;
    var mapfunc = [];
    // Make it a Cummulative Density Function
    for (var i = 0; i < mapFuncLength; i++) {
        mapfunc[i] = [_mapfunc[i][0], _mapfunc[i][1]];
        if (i !== 0) {
            mapfunc[i][0] = mapfunc[i -1][0] + mapfunc[i][0];
        }
    }

    // Select the randoms
    var random = Math.random() * mapfunc[mapFuncLength - 1][0];

    // Return the selected one
    for (var j = 0; j < mapFuncLength; j++) {
        if (random <= mapfunc[j][0]) {
            return mapfunc[j][1];
        }
    }
};

// Calculate a value given an average, standard deviation and maximum
exports.ASM = function(vars) {
    var average = vars[0]; var sdev = vars[1]; var minimum = vars[2]; var maximum = vars[3];
    var outlier = exports.randomize([[0.02, true], [0.98, false]]);
    if (outlier) {
        // Generate an outlier
        return Math.round(Math.random() * (maximum - average) + average);
    } else {
        // Generate a number from a gaussian distribution
        var G = (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
        var R = Math.round(G*sdev+average);
        if (R < minimum) {
            R = minimum;
        } else if (R > maximum) {
            R = maximum;
        }
        return R;
    }
};

/////////////////
// API RELATED //
/////////////////

var http = require('http');
var querystring = require('querystring');
var url = require('url');
var telemetry = require('./telemetry.js').Telemetry;

var cookies = {};

exports.requests = 0;
exports.errors = [];
exports.urlReq = function(reqUrl, options, cb) {
    if(typeof options === 'function') { cb = options; options = {}; }// incase no options passed in

    // parse url to chunks
    var reqUrlObj = url.parse(reqUrl);

    // Check if we need to log the user in first
    if (options.auth) {
        if (!cookies[options.auth.userid]) {
            // Log in the user first
            var requestStart = new Date().getTime();
            exports.urlReq(reqUrlObj.protocol + '//' + reqUrlObj.host + '/api/auth/login', {
                method: 'POST',
                params: {'username': options.auth.userid, 'password': options.auth.password}
            }, function(body, success, res) {
                cookies[options.auth.userid] = res.headers['set-cookie'][0].split(';')[0];
                var requestEnd = new Date().getTime();
                telemetry('Login', requestEnd - requestStart);
                finishUrlReq(reqUrlObj, options, cb);
            });
        } else {
            finishUrlReq(reqUrlObj, options, cb);
        }
    } else {
        finishUrlReq(reqUrlObj, options, cb);
    }
};

var finishUrlReq = function(reqUrlObj, options, cb) {
    var requestStart = new Date().getTime();
    // http.request settings
    var settings = {
        host: reqUrlObj.hostname,
        port: reqUrlObj.port || 80,
        path: reqUrlObj.pathname,
        headers: options.headers || {},
        method: options.method || 'GET'
    };

    settings.headers['Referer'] = reqUrlObj.protocol + '//' + reqUrlObj.host + '/test';

    // Check if there already is a cookie for this user
    settings.headers['Host'] = reqUrlObj.host;
    if (options.auth) {
        settings.headers['Cookie'] = cookies[options.auth.userid];
    }

    // if there are params:
    if(options.params) {
        options.params = querystring.stringify(options.params);
        if (settings.method === 'GET') {
            settings.path += '?' + options.params;
        } else if (settings.method === 'POST') {
            settings.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            settings.headers['Content-Length'] = options.params.length;
        }
    }

    // MAKE THE REQUEST
    var req = http.request(settings);

    // if there are params: write them to the request
    if(options.params && settings.method === 'POST') { req.write(options.params); }

    // when the response comes back
    req.on('response', function(res) {
        res.body = '';
        res.setEncoding('utf-8');

        // concat chunks
        res.on('data', function(chunk) { res.body += chunk; });

        // when the response has finished
        res.on('end', function() {

            // fire callback
            exports.requests++;
            if (options.telemetry) {
                var requestEnd = new Date().getTime();
                telemetry(options.telemetry, requestEnd - requestStart);
            }
            if (res.statusCode === 500 || res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 403) {
                if (!options.ignoreFail) {
                    exports.errors.push({
                        'settings': settings,
                        'response': res.body
                    });
                    console.log(res.body);
                }
                cb(res.body, false, res);
            } else {
                cb(res.body, true, res);
            }
        });
    });

    // end the request
    req.end();
};

exports.filePost = function(reqUrl, file, name, options, cb) {
    // parse url to chunks
    var reqUrlObj = url.parse(reqUrl);

    // Check if we need to log the user in first
    if (options.auth) {
        if (!cookies[options.auth.userid]) {
            // Log in the user first
            var requestStart = new Date().getTime();
            exports.urlReq(reqUrlObj.protocol + '//' + reqUrlObj.host + '/api/auth/login', {
                method: 'POST',
                params: {'username': options.auth.userid, 'password': options.auth.password}
            }, function(body, success, res) {
                cookies[options.auth.userid] = res.headers['set-cookie'][0].split(';')[0];
                var requestEnd = new Date().getTime();
                telemetry('Login', requestEnd - requestStart);
                finishFilePost(reqUrlObj, file, name, options, cb);
            });
        } else {
            finishFilePost(reqUrlObj, file, name, options, cb);
        }
    } else {
        finishFilePost(reqUrlObj, file, name, options, cb);
    }
};

var finishFilePost = function(reqUrlObj, path, name, options, cb) {
    if(typeof options === "function"){ cb = options; options = {}; }// incase no options passed in

    var lf = "\r\n";

    var boundary = "----Boundary" + Math.round(Math.random() * 1000000000000);
    var post_data = [];
    var header = null;
    for (var param in options.params) {
        if (Array.isArray(options.params[param])) {
            for (var i = 0; i < options.params[param].length; i++) {
                header = util.format('Content-Disposition: form-data; name="%s"' + lf + lf, param);
                post_data.push(new Buffer(boundary + lf, 'ascii'));
                post_data.push(new Buffer(header, 'ascii'));
                post_data.push(new Buffer(options.params[param][i] + lf, 'utf8'));
            }
        } else {
            header = util.format('Content-Disposition: form-data; name="%s"' + lf + lf, param);
            post_data.push(new Buffer(boundary + lf, 'ascii'));
            post_data.push(new Buffer(header, 'ascii'));
            post_data.push(new Buffer(options.params[param] + lf, 'utf8'));
        }
    }

    // Add the filebody.
    var fileBody = fs.readFileSync(path);
    var fileSize = fs.statSync(path).size;
    var contentType = mime.lookup(path);
    var fileBodyHeader = '';
    fileBodyHeader += util.format('Content-Disposition: form-data; name="file"; filename="%s"' + lf, name);
    fileBodyHeader += util.format('Content-Type: %s' + lf, contentType);
    fileBodyHeader += util.format('Content-Length: %s' + lf + lf, fileSize);
    post_data.push(new Buffer(boundary + lf, 'ascii'));
    post_data.push(new Buffer(fileBodyHeader, 'ascii'));
    post_data.push(fileBody);
    post_data.push(new Buffer(lf, 'ascii'));
    post_data.push(new Buffer(boundary + '--' + lf, 'ascii'));


    // Determine the length of this request so we can pass it in the Content-Length header.
    var length = 0;
    for(var j = 0; j < post_data.length; j++) {
        length += post_data[j].length;
    }

    // http.request settings
    var settings = {
        'host': reqUrlObj.hostname,
        'port': reqUrlObj.port || 80,
        'path': reqUrlObj.pathname,
        'headers': options.headers || {},
        'method': 'POST'
    };

    settings.headers['Referer'] = reqUrlObj.protocol + '//' + reqUrlObj.host + '/test';
    settings.headers['Host'] = reqUrlObj.host;
    if (options.auth) {
        settings.headers['Cookie'] = cookies[options.auth.userid];
    }
    settings.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary.substr(2);
    settings.headers['Content-Length'] = length;

    // MAKE THE REQUEST
    var req = http.request(settings);
    for (var k = 0; k < post_data.length; k++) {
        req.write(post_data[k]);
    }

    // when the response comes back
    req.on('response', function(res){
        res.body = '';
        res.setEncoding('utf-8');

        // concat chunks
        res.on('data', function(chunk){ res.body += chunk; });

        // when the response has finished
        res.on('end', function(){

            // fire callback
            exports.requests++;
            if (res.statusCode === 500 || res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 403) {
                if (!options.ignoreFail){
                    console.log(res.body);
                    exports.errors.push({
                        'settings': settings,
                        'response': res.body
                    });
                }
                cb(res.body, false, res);
            } else {
                cb(res.body, true, res);
            }
        });
    });

    // end the request
    req.end();
};

////////////////
// LOAD NAMES //
////////////////

var maleFirstNames = exports.loadFileIntoArray('./data/male.first.txt');
var femaleFirstNames = exports.loadFileIntoArray('./data/female.first.txt');
var lastNames = exports.loadFileIntoArray('./data/all.last.txt');

////////////////
// LOAD FILES //
////////////////

var cities = exports.loadFileIntoArray('./data/cities.txt');
var randomUrls = exports.loadFileIntoArray('./data/urls/random.txt');
var youtubeUrls = exports.loadFileIntoArray('./data/urls/youtube.txt');
var userPictures = exports.getFilesInFolder('./data/pictures/users', ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp']);
var groupPictures = exports.getFilesInFolder('./data/pictures/groups', ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp']);

////////////////
// LOAD WORDS //
////////////////

var verbs = exports.loadFileIntoArray('./data/verbs.txt');
var nouns = exports.loadFileIntoArray('./data/nouns.txt');
var keywords = exports.loadFileIntoArray('./data/keywords.txt');
Generators.english.prototype.NOUN = Generators.english.words(nouns);
Generators.english.prototype.VERBAS = Generators.english.words(verbs);

//////////////////////////
// USER DATA GENERATION //
//////////////////////////

exports.generateSentence = function(total) {
    if (!total || total === 1) {
        return Generators.english.sentence();
    }
    var sentences = [];
    for (var i = 0; i < total; i++) {
        sentences.push(Generators.english.sentence());
    }
    return sentences.join(' ');
};

exports.generateParagraph = function(total) {
    if (!total || total === 1) {
        return Generators.english.paragraph();
    } else {
        return Generators.english.paragraphs(total);
    }
};

exports.generateFirstName = function(sex) {
    if (!sex) {
        sex = exports.randomize([[0.5, 'M'],[0.5, 'F']]);
    }
    var firstName = '';
    if (sex === 'M') {
        firstName = maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)].toLowerCase();
    } else if (sex === 'F') {
        firstName = femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)].toLowerCase();
    }
    return firstName[0].toUpperCase() + firstName.substring(1);
};

exports.generateLastName = function() {
    var lastName = lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase();
    return lastName[0].toUpperCase() + lastName.substring(1);
};

exports.generateName = function(sex) {
    return exports.generateFirstName(sex) + ' ' + exports.generateLastName();
};

exports.generateId = function(batchid, seed) {
    return 'batch' + batchid + '-' + (seed.join('-').toLowerCase()) + '-' + Math.round(Math.random() * 1000);
};

exports.generateEmail = function(seed) {
    return seed.join('_').toLowerCase() + '@example.com';
};

exports.generatePassword = function() {
    var passwords = exports.loadFileIntoArray('./data/passwords.txt');
    return passwords[Math.floor(Math.random() * passwords.length)];
};

exports.generateKeywords = function(total) {
    var toReturn = [];
    for (var i = 0; i < total; i++) {
        // 50% is from a dedicated keywords list, 50% is from the noun list
        var fromDedicated = exports.randomize([[0.5, true], [0.5, false]]);
        if (fromDedicated) {
            toReturn.push(keywords[Math.floor(Math.random() * keywords.length)]);
        } else {
            toReturn.push(nouns[Math.floor(Math.random() * nouns.length)]);
        }
    }
    return toReturn;
};

exports.generateDepartment = function() {
    var departments = exports.loadFileIntoArray('./data/departments.txt');
    return departments[Math.floor(Math.random() * departments.length)];
};

exports.generateCollege = function() {
    var colleges = exports.loadFileIntoArray('./data/colleges.txt');
    return colleges[Math.floor(Math.random() * colleges.length)];
};

exports.generateCity = function() {
    return cities[Math.floor(Math.random() * cities.length)];
};

exports.generateUrl = function(type) {
    if (type === 'youtube') {
        return youtubeUrls[Math.floor(Math.random() * youtubeUrls.length)];
    } else {
        return randomUrls[Math.floor(Math.random() * randomUrls.length)];
    }
};

exports.generateUserPicture = function(){
    return userPictures[Math.floor(Math.random() * userPictures.length)];
};

exports.generateGroupPicture = function(){
    return groupPictures[Math.floor(Math.random() * groupPictures.length)];
};

/**
 * Uploads a profile picture for either a user or a group.
 *
 * @param {String}      type            'user' or 'group'
 * @param {String}      principalId     The ID of the user or group.
 * @param {User}        authUser        The user that can be used to perform the requests.
 * @param {String}      filename        The name of the file
 * @param {String}      SERVER_URL      The server to post to
 * @param {Function}    callback        Standard callback method
 */
exports.uploadProfilePicture = function(type, principalId, authUser, filename, SERVER_URL, callback) {
    // Upload the pic.
    var path = './data/pictures/' + type + 's/' + filename;
    exports.filePost(SERVER_URL + '/api/' + type+ '/' + principalId + '/picture', path, filename, {
            'auth': authUser,
            'telemetry': 'Upload group profile picture',
            'params': {}
        }, function(body, success) {
            gm(path).size(function (err, size) {
                if (err) {
                    console.error('Error trying to get the size of an image. Did you install GraphicsMagick?');
                    console.error(err);
                    callback(err);
                }
                var dimension = size.width > size.height ? size.height : size.width;
                exports.urlReq(SERVER_URL + '/api/crop', {
                    'method': 'POST',
                    'params': {
                        'principalId': principalId,
                        'x': 0,
                        'y': 0,
                        'width': dimension
                    },
                    'auth': authUser,
                    'telemetry': 'Crop ' + type + ' profile picture'
                }, function(body, success) {
                    callback();
                });
            });
        });
};
