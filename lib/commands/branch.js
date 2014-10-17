'use strict';

var logger = require('../logger');

function Branch(ticketId, options) {
  this.ticketId = ticketId;
  this.options = options;
}

Branch.Command = {
  path: /br(?:anch)?\s?(.*)?$/i,
  usage: 'branch <ticket-id>',
  description: 'Start a new branch from ticketId',
  help: function() {
    logger.logTemplateFile('help.branch.handlebars');
  },
  run: function(params, options) {
    var ticketId = params.splats[0];

    if(!ticketId) {
      this.help();
      process.exit(1);
    }

    var branch = new Branch(ticketId, options);
    branch.run();
  }
};

Branch.prototype.run = function() {
  console.log("Branching off " + this.ticketId);
};

exports.Command = Branch.Command;
exports.Impl = Branch;
