'use strict';

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var API = {
  currentPath: function() {
    return process.cwd();
  },

  startsWith: function(haystack, needle) {
    var regexp;

    if(typeof needle === RegExp) {
      regexp = needle;
    } else {
      regexp = new RegExp('^' + needle);
    }

    return haystack.toString().match(regexp);
  },

  exec: function(command, callback) {
    exec(command, function(err) {
      if(err) { callback(err, null); }
      callback(null, true);
    });
  },

  noop: function(){},

  openURL: function(url, callback) {
    this.exec('open ' + url, callback || this.noop);
  },

  pbcopy: function(data) {
    var proc = spawn('pbcopy');
    proc.stdin.write(data);
    proc.stdin.end();
  },

  expandTilde: function(string) {
    var homedir;

    if (string.substr(0,1) === '~') {
      homedir = (process.platform.substr(0, 3) === 'win') ? process.env.HOMEPATH : process.env.HOME;
      string = homedir + string.substr(1);
    }

    return path.resolve(string);
  },

  getDirectories: function(searchPath) {
    var _path = this.expandTilde(searchPath);

    var directories = fs.readdirSync(_path).filter(function (file) {
      return fs.statSync(path.join(_path, file)).isDirectory();
    });

    return _.map(directories, function(dir) {
      return path.join(_path, dir);
    });
  }
};

module.exports = API;

