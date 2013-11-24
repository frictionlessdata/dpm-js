var fs = require('fs')
  , path = require('path')
  , datapackage = require('datapackage')
  , assert = require('assert')
  ;

exports.findDataFiles = function(dir) {
  var dir = dir || '.';
  var dataDir = path.join(dir, 'data');
  var files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).map(function(fn) { return 'data/' + fn }) : fs.readdirSync(dir);
  files = files.filter(function(filename) {
    return (path.extname(filename) === '.csv');
  });
  return files;
}

// path should be relative ...
// assuming we have csvs for the present
exports.createResourceEntry = function(filepath, cb) {
  var name = path.basename(filepath, '.csv');
  var out = {
    name: name,
    path: filepath,
    format: 'csv',
    mediatype: 'text/csv'
  };
  var stats = fs.statSync(filepath);
  assert(stats.isFile(), 'Resource %s is not a file'.replace('%s', filepath));
  out.bytes = stats.size;
  datapackage.createJsonTableSchema(fs.createReadStream(filepath, {encoding: 'utf8'}), function(err, schema) {
    out.schema = schema;
    cb(null, out);
  });
}

exports.createResourceEntries = function(dir, cb) {
  var count = 0
    , dataFiles = exports.findDataFiles(dir).map(function(fp) { return path.join(dir, fp) })
    , resources = new Array(dataFiles.length)
    ;
  if (dataFiles.length === 0) {
    cb(null, []);
    return;
  }
  var done = function() {
    count ++;
    if (count === dataFiles.length) { 
      cb(null, resources);
    }
  }
  dataFiles.forEach(function(fp, idx) {
    exports.createResourceEntry(fp, function(err, resource) {
      resources[idx] = resource;
      done();
    });
  });
}
