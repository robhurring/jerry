'use strict';

var logger = require('../logger');
var jira = require('../jira');
var git = require('../git');
var base = require('../base');
var utils = require('../utils');
var q = require('q');
var _ = require('lodash');
var config = base.getConfig();

function PullRequest(ticketId, options) {
  this.ticketId = ticketId;
  this.options = options;
}

PullRequest.Command = {
  path: /(?:pr|pull-request)$/i,
  name: 'pull-request',
  description: 'Create a pull-request from the current branch',
  help: function() {
    logger.logTemplateFile('help.basic.handlebars', {
      usage: 'pull-request',
      text: logger.wrap('Create a pull-request from the current branch using the branch\'s ticket ID for the info.')
    });
  },
  run: function(params, options) {
    base.determineTicketId(null, function(err, ticketId) {
      var pullRequest = new PullRequest(ticketId, options);
      pullRequest.create();
    });
  }
};

(function(klass) {

  klass.performPullRequest = function(payload) {
    var deferred = q.defer();

    base.github.authenticate({
      type: 'oauth',
      token: config.github.token
    });

    base.github.pullRequests.create(payload, function(err, data) {
      if(err) {
        var response = JSON.parse(err);
        var errorMessage = _.last(response.errors).message || response.message;
        return deferred.reject(errorMessage);
      }

      deferred.resolve(data);
    });

    return deferred.promise;
  };

  klass.create = function() {
    var remote = this.options.remote || config.defaultRemote;
    var branch = this.options.into || config.defaultBranch;

    var payload = {
      title: 'Testing',
      base: branch
    };

    git.getCurrentBranch()
      .then(function(branch) {
        payload.head = branch;
        return git.getRemote(remote);
      })
      .then(function(data) {
        payload.repo = data.repo;
        payload.user = data.user;
        return payload;
      })
      .then(jira.findIssue(this.ticketId))
      .then(function(issue) {
        var body = logger.compileTemplateFile('pull-request.handlebars', {
          reviewer: issue.fields.codeReviewer,
          url: issue.url,
          summary: issue.fields.summary,
          associated: []
        });

        payload.title = issue.key + ': ' + issue.summary;
        payload.body = body;
      })
      .then(klass.performPullRequest)
      .then(function(response) {
        logger.logTemplate('{{whiteBright title}}\n{{url}}', {
          url: response.html_url,
          title: response.title
        });
        utils.openURL(response.url);
      })
      .fail(function(err){
        logger.logTemplate('{{redBright err}}', {err: err});
      })
      .done();
  };


})(PullRequest.prototype);

module.exports = PullRequest;
