#!/usr/bin/env node
var dpm = require('../lib/dpm')
  , optimist = require('optimist')
  ;

var usage = 'Usage: dpm OPTIONS COMMAND ...';
usage += '\n\nCOMMANDs:\n\n'
usage += '  install\n'
usage += '  publish'

var argv = optimist
  .usage(usage)
  .wrap(80)
  .argv
  ;
var args = argv._;

if (args.length < 1) {
  optimist.showHelp();
  return;
}

dpm(args[0], args.slice(1, args.length), function(err, resp) {
  if (err) {
    console.error('There was an error: ' + err);
  } else {
    console.log(resp)
  }
})
