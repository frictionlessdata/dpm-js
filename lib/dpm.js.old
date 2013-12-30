var npm = require('npm')
  , initpkgjson = require('init-package-json')
  , path = require('path')
  , fs = require('fs')
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

// TODO: make async?
function getHelpText(offset) {
  var filepath = path.join(path.dirname(__dirname), 'doc', offset + '.md');
  return fs.readFileSync(filepath, 'utf8');
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
  var msg = getHelpText('command-init');
  console.log(msg);

  var configData = {}
  util.createResourceEntries(dir, function(err, resources) {
    configData.resources = resources;
    initpkgjson(dir, promptFile, configData, cb);
  });
}

DPM.prototype.adddata = function(cb) {
}

