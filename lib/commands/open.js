'use strict';

var logger = require('../logger');
var base = require('../base');
var jira = require('../jira');
var utils = require('../utils');

exports.Command = {
  path: /o(?:pen)?\s?(.*)?$/i,
  usage: 'open',
  description: 'Open an issue in your browser',
  help: function() {
    logger.logTemplateFile('help.open.handlebars');
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
