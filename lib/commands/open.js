'use strict';

var logger = require('../logger');
var base = require('../base');
var jira = require('../jira');
var utils = require('../utils');

exports.Command = {
  path: /o(?:pen)?\s?(.*)?$/i,
  name: 'open',
  description: 'Open an issue in your browser',
  help: function() {
    logger.logTemplateFile('help.basic.handlebars', {
      usage: 'open [TICKET_ID]',
      text: logger.wrap('Open the ticket in your browser. If no ticket ID is given jerry will attempt to extract an ID from your current git branch.')
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
      utils.openURL(url, function() {
        logger.logTemplate('{{whiteBright "Opening: "}} {{url}}', {url: url});
      });
    });
  }
};
