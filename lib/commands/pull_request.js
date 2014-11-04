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
        console.log(response);
        return deferred.reject(response.message);
      }

      deferred.resolve(data);
    });

    return deferred.promise;
  };

  klass.create = function() {
    var remote = this.options.remote || config.defaultRemote;
    var branch = this.options.base || config.defaultBranch;

    var templateData = {
      associated: []
    };

    var payload = {
      title: 'Fill me out...',
      base: branch
    };

    var setPayloadBranch = function() {
      var d = q.defer();

      git.getCurrentBranch()
        .then(function(branch) {
          payload.branch = branch;
          d.resolve(branch);
        })
        .catch(d.reject);

      return d.promise;
    };

    var findAssociatedRepos = function(branch) {
      var d = q.defer();

      git.findAssociatedRepos(config.associatedSearchPaths, branch)
        .then(function(associated) {
          associated = _.map(associated, function(aPath) {
            return path.basename(aPath);
          });

          templateData.associated = associated;
          d.resolve(associated);
        })
        .catch(d.reject);

      return d.promise;
    };

    var setPayloadRemoteData = function() {
      var d = q.defer();

      git.getRemote(remote)
        .then(function(data) {
          payload.repo = data.repo;
          payload.user = data.user;
          d.resolve(payload);
        })
        .catch(d.reject);

      return d.promise;
    };

    var setPayloadBody = function() {
      var d = q.defer();

      jira.findIssue(this.ticketId)
        .then(function(issue) {
          var data = _.merge(templateData, {
            reviewer: issue.fields.codeReviewer,
            url: issue.url,
            key: issue.key,
            summary: issue.fields.summary
          });
          data = _.merge(data, payload);

          var body = logger.compileTemplateFile('pull-request.handlebars', data);

          payload.title = issue.key + ': ' + issue.fields.summary;
          payload.body = body;

          d.resolve(payload);
        })
        .catch(d.reject);

      return d.promise;
    }.bind(this);

    var steps = [
      setPayloadBranch,
      findAssociatedRepos,
      setPayloadRemoteData,
      setPayloadBody,
      klass.performPullRequest
    ];

    // build the sequence of steps, chain them together
    var sequence = steps.reduce(function(chain, next) {
      return chain.then(next);
    }, q(null));

    sequence
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
