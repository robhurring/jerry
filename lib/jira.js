'use strict';

var q = require('q');
var utils = require('./utils');
var base = require('./base');
var JiraApi = require('jira').JiraApi;
var config = base.getConfig().jira;

var API = {
  TICKET_PREFIX: '[A-Za-z]{2,}-',
  TICKET_MATCHER: /^([A-Z]{2,}\-[0-9]+)/i,
  URL_TEMPLATE: '',

  getClient: function() {
    return new JiraApi('https', config.host, '443', config.user, config.password, '2');
  },

  jiraUrl: function(path) {
    return 'https://' + config.host + path;
  },

  ticketUrl: function(ticketOrId) {
    var id = this.normalizeId(ticketOrId);
    return this.jiraUrl('/browse/' + id);
  },

  normalizeId: function(id) {
    if(!id) {
      return null;
    }

    if(utils.startsWith(id, this.TICKET_PREFIX)) {
      return id.toUpperCase();
    } else {
      if(id.toString().match(/^[0-9]+/)) {
        return config.defaultProject.toUpperCase() + '-' + id;
      } else {
        return null;
      }
    }
  },

  extractTicketId: function(string) {
    var found = string.match(this.TICKET_MATCHER);

    if(found) {
      return this.normalizeId(found[0]);
    } else {
      return null;
    }
  },

  isJiraBranch: function(string) {
    return utils.startsWith(string, this.TICKET_PREFIX);
  },

  findIssue: function(id) {
    var ticketId = this.normalizeId(id);
    var deferred = q.defer();
    var jira = this.getClient();

    jira.findIssue(ticketId, function(err, issue) {
      if(err){ return deferred.reject(err); }

      issue.url = API.ticketUrl(issue.key);

      // ghetto fab custom field mapping
      issue.fields.primaryDeveloper = issue.fields.customfield_10203;
      issue.fields.codeReviewer = issue.fields.customfield_10202;
      issue.fields.sponsor = issue.fields.customfield_10300;

      deferred.resolve(issue);
    });

    return deferred.promise;
  }
};

module.exports = API;
