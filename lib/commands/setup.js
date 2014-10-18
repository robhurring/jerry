'use strict';

var logger = require('../logger');

exports.Command = {
  path: 'setup',
  name: 'setup',
  description: 'Create the basic configuration needed',
  help: function() {
    logger.logTemplateFile('help.basic.handlebars', {
      usage: this.name,
      text: logger.wrap('Copies the jerry configuration files to your home directory. You should edit this file with your information.')
    });
  },
  run: function() {
    require('../setup')();
  }
};
