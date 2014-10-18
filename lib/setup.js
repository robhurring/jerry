'use strict';

var fs = require('fs');
var inquirer = require('inquirer');
var q = require('q');

var base = require('./base');
var logger = require('./logger');

var createInitialConfig = function() {
  var deferred = q.defer();
  var baseConfig = require(base.configPath);

  if(!fs.existsSync(base.userConfigPath)) {
    fs.writeFileSync(base.userConfigPath, JSON.stringify(baseConfig, null, 2), {
      mode: 384
    });
  }

  // sync config
  var userConfig = require(base.userConfigPath);

  Object.keys(baseConfig).forEach(function(key) {
    userConfig[key] = userConfig[key] || baseConfig[key];
  });

  fs.writeFileSync(base.userConfigPath, JSON.stringify(userConfig, null, 2));

  // just resolve immediately
  deferred.resolve();

  return deferred.promise;
};

var __githubCallback = function(user, err, res, deferred) {
  if(res && res.token) {
    base.writeConfig('github.user', user);
    base.writeConfig('github.token', res.token);
    deferred.resolve();
  } else {
    logger.logTemplate('{{redBright "Make sure you dont already have a token for Jerry (in your GitHub account settings)"}}');
    deferred.reject(JSON.parse(err).message);
  }
};

var __twoFactorGithubCallback = function(payload, user, deferred) {
  inquirer.prompt(
    [
      {
        type: 'input',
        message: 'Enter your two-factor code',
        name: 'otp'
      }
    ], function(factor) {
      payload.headers['X-GitHub-OTP'] = factor.otp;

      base.github.authorization.create(payload, function(err, res) {
        __githubCallback(user, err, res, deferred);
      });
    });
};

var setupGitHub = function() {
  var deferred = q.defer();
  var token = base.readConfig('github.token');

  if(token && token !== 'REQUIRED') {
    logger.logTemplate('{{greenBright "[✓] GitHub Setup"}}');
    deferred.resolve();
    return deferred.promise;
  }

  console.log('First we need authorization to use GitHub\'s API. Login with your GitHub account.');

  inquirer.prompt(
    [
      {
        type: 'input',
        message: 'Enter your GitHub user',
        name: 'user'
      },
      {
        type: 'password',
        message: 'Enter your GitHub password',
        name: 'password'
      }
    ],
    function(answers) {
      var payload = {
        note: 'Jerry CLI',
        note_url: 'https://github.com/robhurring/jerry',
        scopes: ['user', 'public_repo', 'repo', 'repo:status', 'delete_repo', 'gist']
      };

      base.github.authenticate({
        type: 'basic',
        username: answers.user,
        password: answers.password
      });

      base.github.authorization.create(payload, function(err, res) {
        var isTwoFactorAuthentication = err && err.message && err.message.indexOf('OTP') > 0;

        if(isTwoFactorAuthentication) {
          __twoFactorGithubCallback(payload, answers.user, deferred);
        } else {
          __githubCallback(answers.user, err, res, deferred);
        }
      });
    }
  );

  return deferred.promise;
};

var setupJira = function() {
  var deferred = q.defer();
  var jira = base.readConfig('jira.password');

  if(jira && jira !== 'REQUIRED') {
    logger.logTemplate('{{greenBright "[✓] Jira Setup"}}');
    deferred.resolve();
    return deferred.promise;
  }

  inquirer.prompt(
    [
      {
        type: 'input',
        message: 'Enter your Jira hostname (ex: mycompany.atlassian.net)',
        name: 'host'
      },
      {
        type: 'input',
        message: 'Enter your Jira OnDemand username',
        name: 'user'
      },
      {
        type: 'password',
        message: 'Enter your Jira OnDemand password',
        name: 'password'
      },
      {
        type: 'input',
        message: 'Enter your Jira default project (ex: FY)',
        name: 'defaultProject'
      }
    ],
    function(answers) {
      base.writeConfig('jira.host', answers.host);
      base.writeConfig('jira.user', answers.user);
      base.writeConfig('jira.password', answers.password);
      base.writeConfig('jira.defaultProject', answers.defaultProject);
      deferred.resolve();
    }
  );

  return deferred.promise;
};

module.exports = function() {
  createInitialConfig()
    .then(setupJira)
    .then(setupGitHub)
    .then(function() {
      logger.logTemplate('{{whiteBright "All good! You can edit these settings at any time in ~/.jerry.json"}}');
    })
    .fail(function(err) {
      logger.logTemplate('{{redBright err}}', {err: err});
    });
};
