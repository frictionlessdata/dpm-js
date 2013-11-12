var npm = require('npm')
  , path = require('path')
  ;

var validCommands = [
  'install',
  'publish',
  'view'
]

module.exports = function(command, args, cb) {
  npm.load(function(err) {
    if (err) return cb(err)
    if (!command || !(command in npm.commands) || validCommands.indexOf(command) === -1) {
      return cb("invalid command: " + command)
    }
    npm.commands[command](args, function errBack(err, data) {
      if (err) return cb(err)
      else cb(false, "dpm ran ok")
    })  
  })
}
