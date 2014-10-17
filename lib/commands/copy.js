'use strict';

var logger = require('../logger');
var base = require('../base');
var jira = require('../jira');
var utils = require('../utils');

exports.Command = {
  path: /(?:cp|copy)\s?(.*)?$/i,
  usage: 'copy',
  description: 'Copy a ticket URL to the clipboard',
  help: function() {
    logger.logTemplateFile('help.copy.handlebars');
  },
  run: function(params) {
    var givenId = params.splats[0];

    base.determineTicketId(givenId, function(err, ticketId) {
      if(err) {
        logger.logTemplate('{{redBright err}}', {err: err});
        process.exit(1);
      }

      var url = jira.ticketUrl(ticketId);
      utils.pbcopy(url);
      logger.logTemplate('{{whiteBright "Copied: "}} {{url}}', {url: url});
    });
  }
};
