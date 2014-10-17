'use strict';

var logger = require('../logger');
var base = require('../base');

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
    base.setup();
    console.log(logger.color.green('Config file copied to ~/.jerry.json'));
    console.log(logger.color.yellow('Make sure you edit the fields marked "REQUIRED" before continuing.'));
  }
};
