'use strict';

var fs = require('fs');
var path = require('path');
var logger = require('./logger');
var GitHubApi = require('github');

exports.configPath = path.join(__dirname, '../', '.jerry.json');
exports.userConfigPath = path.join(process.env.HOME, '.jerry.json');

exports.github = new GitHubApi({
  version: '3.0.0',
  debug: false,
  protocol: 'https'
});

exports.runSetupCheck = function() {
  if(!fs.existsSync(exports.userConfigPath) || !exports.checkConfig()) {
    logger.logTemplateFile('welcome.handlebars');
    require('./setup')();
    return false;
  }
  return true;
};

exports.checkConfig = function() {
  try {
    var userConfig = require(exports.userConfigPath);
    var missingFields = JSON.stringify(userConfig).match(/REQUIRED/);
    return !missingFields;
  } catch(err) {
    console.error(err);
  }
};

exports.getConfig = function() {
  try {
    var config = require(exports.userConfigPath);
    return config;
  } catch (err) {
    console.error('Could not load config file! Please try running `jerry setup` and editing your ~/.jerry.json file.');
    console.error(err);
  }
};

exports.determineTicketId = function(id, callback) {
  var jira = require('./jira');
  var git = require('./git');

  var ticketId = jira.normalizeId(id);

  if(ticketId) {
    callback(null, ticketId);
  } else {
    git.getCurrentBranch().then(function(branch) {
      var ticketId = jira.extractTicketId(branch);
      if(ticketId) {
        callback(null, ticketId);
      } else {
        callback('Ticket ID could not be extracted from the current branch.');
      }
    })
    .fail(function() {
      callback('Could not determine the jira ticket ID');
    });
  }
};

exports.writeConfig = function(jsonPath, value) {
  var config = exports.getConfig(),
    i,
    output,
    path,
    pathLen;

  path = jsonPath.split('.');
  output = config;

  for (i = 0, pathLen = path.length; i < pathLen; i++) {
    output[path[i]] = config[path[i]] || (i + 1 === pathLen ? value : {});
    output = output[path[i]];
  }

  fs.writeFileSync(exports.userConfigPath, JSON.stringify(config, null, 2));
};

exports.readConfig = function(jsonPath) {
  var config = JSON.parse(JSON.stringify(exports.getConfig()));
  var path = jsonPath.split('.');

  for (var i = 0; i < path.length; i++) {
    if(typeof config[path[i]] === 'undefined'){ return null; }
    config = config[path[i]];
  }

  return config;
};


