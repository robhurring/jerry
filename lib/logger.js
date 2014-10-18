'use strict';

var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');
var color = require('cli-color');
var wrap = require('wordwrap')(0, 80);

var styles = [
  'black',
  'blackBright',
  'red',
  'redBright',
  'green',
  'greenBright',
  'yellow',
  'yellowBright',
  'blue',
  'blueBright',
  'magenta',
  'magentaBright',
  'cyan',
  'cyanBright',
  'white',
  'whiteBright',
  'italic',
  'bold',
  'underline',
  'inverse',
  'strike'
];

styles.forEach(function(style) {
  handlebars.registerHelper(style, function() {
    var args = Array.prototype.slice.call(arguments);
    args.pop();
    return color[style](args.join(''));
  });
});

handlebars.registerHelper('default', function(value, otherwise) {
  return value ? value : otherwise;
});

var logger = {};

logger.wrap = wrap;
logger.color = color;

logger.error = function(message) {
  console.error(color.red(message));
};

logger.compileTemplate = function(source, data) {
  var template = handlebars.compile(source);
  return template(data);
};

logger.logTemplate = function(source, data) {
  console.log(logger.compileTemplate(source, data || {}));
};

logger.logTemplateFile = function(file, data) {
  var output = logger.compileTemplateFile(file, data);
  console.log(output);
};

logger.compileTemplateFile = function(file, data) {
  var templatePath = path.join(file);

  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(__dirname, 'templates', file);
  }

  var source = fs.readFileSync(templatePath).toString();
  return logger.compileTemplate(source, data || {});
};

module.exports = logger;
