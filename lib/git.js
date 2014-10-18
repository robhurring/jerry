'use strict';

var git = require('gift');
var _ = require('lodash');
var q = require('q');
var utils = require('./utils');
var config = require('./base').getConfig();

var API = {
  getRepo: function() {
    return git(utils.currentPath());
  },

  getBranches: function() {
    var deferred = q.defer();
    var repo = API.getRepo();

    repo.branches(function(err, branches) {
      if(err){ deferred.reject(err); }
      var names = _.pluck(branches, 'name');
      deferred.resolve(names);
    });

    return deferred.promise;
  },

  getCurrentBranch: function() {
    var deferred = q.defer();
    var repo = API.getRepo();

    repo.git('rev-parse --abbrev-ref', {}, ['HEAD'], function(err, stdout) {
      if(err) { return deferred.reject(err); }
      var name = _.first(stdout.split('\n'));
      deferred.resolve(name);
    });

    return deferred.promise;
  },

  branchExists: function(name_or_matcher) {
    var deferred = q.defer();

    API.getBranches().then(function(list) {
      if(typeof name_or_matcher === 'function') {
        var found = _.find(list, name_or_matcher);
        if(found) {
          deferred.resolve(found);
        } else {
          deferred.reject('Branch does not exist');
        }
      } else {
        if(list.indexOf(name_or_matcher) !== -1) {
          deferred.resolve(name_or_matcher);
        } else {
          deferred.reject('Branch does not exist');
        }
      }
    });

    return deferred.promise;
  },

  createBranch: function(name) {
    var deferred = q.defer();
    var repo = API.getRepo();

    API.branchExists(name)
      .then(deferred.resolve)
      .fail(function(err) {
        if(err === 'Branch does not exist') {
          repo.create_branch(name, function(err) {
            if(err){ return deferred.reject(err); }
            deferred.resolve(name);
          });
        } else {
          deferred.reject(err);
        }
      });

    return deferred.promise;
  },

  checkout: function(branch) {
    var deferred = q.defer();
    var repo = API.getRepo();

    repo.checkout(branch, function(err) {
      if(err) {
        deferred.reject(err);
      } else {
        deferred.resolve(branch);
      }
    });

    return deferred.promise;
  },

  getConfig: function(path) {
    var deferred = q.defer();
    var repo = API.getRepo();

    repo.config(function(err, gitConfig) {
      if(err) { return deferred.reject(err); }
      deferred.resolve(gitConfig.items[path]);
    });

    return deferred.promise;
  },

  getRemote: function(remote) {
    var name = remote || config.defaultRemote;
    var path = ['remote', name, 'url'].join('.');
    var deferred = q.defer();

    API.getConfig(path)
      .then(function(url) {
        deferred.resolve(API.parseRemoteUrl(url));
      })
      .fail(deferred.reject);

    return deferred.promise;
  },

  parseRemoteUrl: function(url) {
    var parsed = /[\/:]([\w-]+)\/(.*?)(?:\.git)?$/.exec(url);

    if (parsed) {
      parsed.shift();
    }

    return parsed;
  }
};

module.exports = API;
