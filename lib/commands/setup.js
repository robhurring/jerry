'use strict';

var logger = require('../logger');
var base = require('../base');

exports.Command = {
  path: 'setup',
  usage: 'setup',
  description: 'Create the basic configuration needed',
  help: function() {
    logger.logTemplateFile('help.setup.handlebars');
  },
  run: function() {
    base.setup();
    console.log(logger.color.green('Config file copied to ~/.jerry.json'));
    console.log(logger.color.yellow('Make sure you edit the fields marked "REQUIRED" before continuing.'));
  }
};
