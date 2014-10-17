'use strict';

var logger = require('../logger');
var base = require('../base');
var jira = require('../jira');
var utils = require('../utils');

exports.Command = {
  path: /(?:cp|copy)\s?(.*)?$/i,
  name: 'copy',
  description: 'Copy a ticket URL to the clipboard',
  help: function() {
    logger.logTemplateFile('help.basic.handlebars', {
      usage: 'copy [TICKET_ID]',
      text: logger.wrap('Copy the ticket URL to your clipboard. If no ticket ID is given jerry will attempt to extract an ID from your current git branch.')
    });
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
