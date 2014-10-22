'use strict';

var logger = require('../logger');
var jira = require('../jira');
var base = require('../base');

function Info(ticketId, options) {
  this.ticketId = ticketId;
  this.options = options;
}

Info.Command = {
  path: /i(?:nfo?)?\s?(.*)?$/i,
  name: 'info',
  description: 'Get basic info about a ticket',
  help: function() {
    logger.logTemplateFile('help.basic.handlebars', {
      usage: 'info [TICKET_ID]',
      text: logger.wrap('Output some basic information about the ticket. If no ticket ID is given jerry will attempt to extract an ID from your current git branch.')
    });
  },
  run: function(params, options) {
    var givenId = params.splats[0];

    base.determineTicketId(givenId, function(err, ticketId) {
      if(err) {
        logger.logTemplate('{{redBright err}}', {err: err});
        process.exit(1);
      }

      var info = new Info(ticketId, options);
      info.print();
    });
  }
};

(function(klass) {

  klass.print = function() {
    jira.findIssue(this.ticketId).then(function(issue) {
      logger.logTemplateFile('issue.handlebars', issue);
    })
    .fail(function(err) {
      logger.logTemplate('{{redBright ticketId ": " error}}', {
        ticketId: self.ticketId,
        error: err.toString()
      });
    });
  };

})(Info.prototype);


module.exports = Info;
