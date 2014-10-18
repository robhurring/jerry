'use strict';

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

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
  }
};

module.exports = API;
