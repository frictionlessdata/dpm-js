var npm = require('npm')
  , initpkgjson = require('init-package-json')
  , path = require('path')
  , util = require('./util')
  ;

var validCommands = [
  'install',
  'publish',
  'init',
  'view'
]

module.exports = DPM;

function DPM() {
  if (!(this instanceof DPM)) {
    return new DPM();
  }
}

DPM.prototype.run = function(command, args, cb) {
  if (!command || !(command in npm.commands) || validCommands.indexOf(command) === -1) {
    return cb("invalid command: " + command)
  }
  if (command == 'init') {
    this.init(cb);
    return;
  }
  // else fallback to running npm
  npm.load(function(err) {
    if (err) return cb(err)
    npm.commands[command](args, function errBack(err, data) {
      if (err) return cb(err)
      else cb(false, "dpm ran ok")
    })  
  })
}

DPM.prototype.init = function(cb) {
  var self = this;
  var promptFile = path.join(__dirname, 'prompt.js');
  var dir = process.cwd();

  if (!cb) cb = function(er) {
    if (er) {
      console.error('\n' + er.message);
    }
  }
  var msg = [
    'This utility will walk you through creating a Data Package package.json file.',
    '',
    'It only covers the most common items, and tries to guess sane defaults.',
    'See http://data.okfn.org/standards/data-package for definitive documentation on these fields',
    'and exactly what they do.',
    '',
    'Press ^C at any time to quit.'
    ].join('\n')
  console.log(msg);

  var configData = {}
  util.createResourceEntries(dir, function(err, resources) {
    configData.resources = resources;
    initpkgjson(dir, promptFile, configData, cb);
  });
}

DPM.prototype.adddata = function(cb) {
}

