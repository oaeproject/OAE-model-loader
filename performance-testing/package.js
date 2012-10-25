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

var moment = require('moment');
var argv = require('optimist')
    .usage('Usage: $0 -b <number of batches>')
    
    .demand('b')
    .alias('b', 'batches')
    .describe('b', 'Number of batches to process')
    
    .alias('o', 'output')
    .describe('o', 'The target output directory. If not specified, will default a unique time-based directory in ~/.oae/mb-data')
    .default('o', '~/.oae/mb-data/'+moment().format('YYYY-MMM-DD-H-mmss'))
    
    .alias('s', 'source')
    .describe('s', 'The location of the source scripts (relative to the current)')
    .default('s', '.')
    
    .argv;

var util = require('util');
var mkdirp = require('mkdirp');
var ncp = require('ncp').ncp;
var perf = require('./lib/perf');

(function() {
  
  var rawOutput = argv.output;
  argv.output = expand(argv.output);
  argv.source = expand(argv.source);
  
  console.log('Result will be output to: '+argv.output);
 
  mkdirp.sync(argv.output+'/source/scripts/users');
  mkdirp.sync(argv.output+'/source/data');

  console.log('Copying all source scripts to '+rawOutput+'/source/scripts');  
  copySource(util.format('%s/scripts', argv.source), util.format('%s/source/scripts', argv.output), 0, function() {
    console.log('Copying all source data to '+rawOutput+'/source/data');
    ncp(util.format('%s/data', argv.source), util.format('%s/source/data', argv.output), function(err) {
      console.log('Generating load test input data in '+rawOutput+'/csv');
      perf.generateCsvData(argv.batches, argv.source, util.format('%s/csv', argv.output), function() {
        console.log('Done.');
        process.exit(0);
      });
    });
  });
  
  function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }
  
  function copySource(sourceDir, outputDir, batchNum, callback) {
    if (batchNum >= argv.batches) {
      callback();
      return;
    }
  
    // copy from the source, to the output dir
    ncp(util.format('%s/users/%d.txt', sourceDir, batchNum),
            util.format('%s/users/%d.txt', outputDir, batchNum), function(err) {
        assert(err);
        copySource(sourceDir, outputDir, batchNum+1, callback);
    });
  }
  
  function expand(dir) {
    if (dir.slice(0, 1) === '~')
      return getUserHome()+dir.slice(1, dir.length);
    return dir;
  }
  
  function assert(err) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      process.exit(1);
    }
  }
  
})();
