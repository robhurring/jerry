'use strict';

var logger = require('../logger');
var jira = require('../jira');
var git = require('../git');
var base = require('../base');
var path = require('path');
var utils = require('../utils');
var q = require('q');
var _ = require('lodash');
var config = base.getConfig();

function PullRequest(ticketId, options) {
  this.ticketId = ticketId;
  this.options = options;
  this.base = options.base || config.defaultBranch;
  this.remote = options.remote || config.defaultRemote;
}

PullRequest.Command = {
  path: /(?:pr|pull-request)$/i,
  name: 'pull-request',
  description: 'Create a pull-request from the current branch',
  help: function() {
    logger.logTemplateFile('help.pull-request.handlebars');
  },
  run: function(params, options) {
    base.determineTicketId(null, function(err, ticketId) {
      var pullRequest = new PullRequest(ticketId, options);
      if(options.preview || options.p) {
        pullRequest.preview();
      } else {
        pullRequest.create();
      }
    });
  }
};

(function(klass) {

  klass.setCurrentBranch = function(data) {
    var d = q.defer();

    git.getCurrentBranch()
      .then(function(head) {
        data.head = head;
        d.resolve(data);
      })
      .catch(d.reject);

    return d.promise;
  },

  klass.setAssociatedRepos = function (data) {
    var d = q.defer();

    git.findAssociatedRepos(config.associatedSearchPaths, data.head)
      .then(function(associated) {
        associated = _.map(associated, function(aPath) {
          return path.basename(aPath);
        });

        data.associated = associated;
        d.resolve(data);
      })
      .catch(d.reject);

    return d.promise;
  },

  klass.setRemoteData = function(data) {
    var d = q.defer();

    git.getRemote(data.remote)
      .then(function(remoteData) {
        data.repo = remoteData.repo;
        data.user = remoteData.user;
        d.resolve(data);
      })
      .catch(d.reject);

    return d.promise;
  },

  klass.setIssue = function (data) {
    var d = q.defer();

    jira.findIssue(data.ticketId)
      .then(function(issue) {
        data.issue = {
          reviewer: issue.fields.codeReviewer,
          url: issue.url,
          key: issue.key,
          summary: issue.fields.summary
        };

        d.resolve(data);
      })
      .catch(d.reject);

    return d.promise;
  },

  klass.renderBody = function (data) {
    var d = q.defer();

    data.body = logger.compileTemplateFile(
      'pull-request.handlebars', data);

    d.resolve(data);

    return d.promise;
  },

 klass.openPullRequest = function(data) {
  var d = q.defer();

  var payload = {
    user: data.user,
    repo: data.repo,
    title: data.issue.key + ': ' + data.issue.summary,
    body: data.body,
    base: data.base,
    head: data.head
  };

  base.github.authenticate({
    type: 'oauth',
    token: config.github.token
  });

  base.github.pullRequests.create(payload, function(err, response) {
    if(err) {
      try {
        var errorResponse = JSON.parse(err);
        if(errorResponse.errors) {
          d.reject(errorResponse.errors[0].message);
        } else {
          d.reject(errorResponse.message);
        }
      } catch(e) {
        d.reject(err);
      }
    }

    d.resolve(response);
  });

  return d.promise;
 },

 klass.setupPullRequestData = function() {
  var data = {
    ticketId: this.ticketId,
    remote: this.remote,
    base: this.base
  };

  var steps = [
    klass.setCurrentBranch,
    klass.setAssociatedRepos,
    klass.setRemoteData,
    klass.setIssue,
    klass.renderBody
  ];

  // build the sequence of steps, chain them together
  var sequence = steps.reduce(function(chain, next) {
    return chain.then(next);
  }, q(data));

  return sequence;
 },

 klass.preview = function() {
  this.setupPullRequestData()
    .then(function(data) {
      logger.logTemplate('{{whiteBright title}}\n\n{{{body}}}', {
        title: data.issue.key + ': ' + data.issue.summary,
        body: data.body
      });
    })
    .catch(function(err){
      logger.logTemplate('{{redBright err}}', {err: err});
    })
    .done();
 },

  klass.create = function() {
    this.setupPullRequestData()
      .then(klass.openPullRequest)
      .then(function(response) {
      logger.logTemplate('{{whiteBright title}}\n{{url}}', {
        url: response.html_url,
        title: response.title
      });
      utils.openURL(response.html_url);
    })
    .catch(function(err) {
      logger.logTemplate('{{redBright err}}', {err: err});
    })
    .done();
  };

})(PullRequest.prototype);

module.exports = PullRequest;
