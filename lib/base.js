'use strict';

var fs = require('fs');
var path = require('path');
var logger = require('./logger');

var configPath = path.join(__dirname, '../', '.jerry.json');
var userConfigPath = path.join(process.env.HOME, '.jerry.json');

exports.setup = function() {
  var baseConfig = require(configPath);

  if(!fs.existsSync(userConfigPath)) {
    fs.writeFileSync(userConfigPath, JSON.stringify(baseConfig, null, 2), {
      mode: 384
    });
  }

  // sync config
  var userConfig = require(userConfigPath);

  Object.keys(baseConfig).forEach(function(key) {
    userConfig[key] = userConfig[key] || baseConfig[key];
  });

  fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2));
};

exports.checkConfig = function() {
  try {
    var userConfig = require(userConfigPath);
    var missingFields = JSON.stringify(userConfig).match(/REQUIRED/);
    if(missingFields) {
      console.error(logger.color.red('You are missing required fields in your config file!'));
      console.error('Please update your ~/.jerry.json file and fix all missing required fields.');
    } else {
      console.log(logger.color.green('OK!'));
    }
  } catch(err) {
    console.error(err);
  }
};

exports.getConfig = function() {
  try {
    var config = require(userConfigPath);
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
