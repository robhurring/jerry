'use strict';

var logger = require('../logger');
var jira = require('../jira');
var git = require('../git');
var base = require('../base');
var utils = require('../utils');
var q = require('q');

function Branch(ticketId, options) {
  this.ticketId = ticketId;
  this.options = options;
}

Branch.Command = {
  path: /br(?:anch)?\s?(.*)?$/i,
  name: 'branch',
  description: 'Start a new branch from ticketId',
  help: function() {
    logger.logTemplateFile('help.basic.handlebars', {
      usage: 'branch TICKET_ID',
      text: logger.wrap('Create a branch in your current git repo that matches the Jira issue summary for the given ticket ID. If any branch currently matches the ticket number, it will be checked out instead of created.')
    });
  },
  run: function(params, options) {
    var givenId = params.splats[0];
    var ticketId = jira.normalizeId(givenId);

    if(!givenId) {
      this.help();
      process.exit(1);
    }

    if(!ticketId) {
      logger.logTemplate('{{redBright "Invalid jira ticket ID" }}');
      process.exit(1);
    }

    var branch = new Branch(ticketId, options);
    branch.create();
  }
};

(function(klass) {

  klass.checkoutExistingBranch = function() {
    var deferred = q.defer();

    var matcher = function(branch) {
      return utils.startsWith(branch.toUpperCase(), this.ticketId);
    }.bind(this);

    git.branchExists(matcher)
      .then(git.checkout)
      .then(deferred.resolve)
      .fail(deferred.reject);

    return deferred.promise;
  };

  klass.buildName = function() {
    var deferred = q.defer();
    var config = base.getConfig();
    var maxBranchLength = config.maxBranchLength;

    jira.findIssue(this.ticketId)
      .then(function(issue) {
        var branchName = issue.key + '_' + issue.fields.summary
          .toLowerCase()
          .replace(/[\s\W]/g, '_')
          .replace(/_(_)*/g, '_')
          .substr(0, maxBranchLength)
          .replace(/_$/, '');

        deferred.resolve(branchName);
      })
      .fail(deferred.reject);

    return deferred.promise;
  };

  klass.create = function() {
    this.checkoutExistingBranch()
      .then(function(branch){
        logger.logTemplate('{{greenBright "Switched to branch " branch}}', {
          branch: branch
        });
      })
      .fail(function() {
        this.buildName()
          .then(git.createBranch)
          .then(git.checkout)
          .then(function(branch) {
            logger.logTemplate('{{greenBright "Switched to branch " branch}}', {
              branch: branch
            });
          })
          .fail(function(err){
            logger.logTemplate('{{redBright err}}', {err: err});
          });
      }.bind(this))
      .done();
  };

})(Branch.prototype);

module.exports = Branch;
