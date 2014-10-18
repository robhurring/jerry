'use strict';

var logger = require('../logger');
var jira = require('../jira');
var git = require('../git');
var base = require('../base');
var q = require('q');

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

  klass.buildTemplate = function() {
    var deferred = q.defer();

    jira.findIssue(this.ticketId)
      .then(function(issue) {
        var body = logger.compileTemplate()
      })
      .fail(deferred.reject);

    return deferred.promise;
  };

  klass.create = function() {
    git.getRemote()
      .then(function(data) {
        console.log(data);
      })
      .fail(function(err) {
        console.log('err', err);
      });
  };


})(PullRequest.prototype);

module.exports = PullRequest;
