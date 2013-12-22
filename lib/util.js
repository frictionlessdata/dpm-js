var fs = require('fs')
  , path = require('path')
  , datapackage = require('datapackage')
  , assert = require('assert')
  ;

// locate potential data files in this directory
exports.findDataFiles = function(dir) {
  var dir = dir || '.';
  var dataDir = path.join(dir, 'data');
  var files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir).map(function(fn) { return 'data/' + fn }) : fs.readdirSync(dir);
  files = files.filter(function(filename) {
    isDataFile = path.extname(filename) in {
          '.csv': ''
        , '.geojson': ''
      };
    return isDataFile;
  });
  return files;
}

// TODO: replace with proper mimetype lookup
var ext2mediatypeMap = {
    'csv': 'text/csv'
  , 'geojson': 'application/json'
};

// path should be relative ...
// assuming we have csvs for the present
exports.createResourceEntry = function(filepath, cb) {
  var ext = path.extname(filepath).toLowerCase().replace('.', '');
  var name = path.basename(filepath.toLowerCase(), '.' + ext);
  var out = {
    name: name,
    path: filepath,
    format: ext.toLowerCase()
  };
  if (ext in ext2mediatypeMap) {
    out.mediatype = ext2mediatypeMap[ext];
  }
  var stats = fs.statSync(filepath);
  assert(stats.isFile(), 'Resource %s is not a file'.replace('%s', filepath));
  out.bytes = stats.size;
  if (ext === 'csv') {
    datapackage.createJsonTableSchema(fs.createReadStream(filepath, {encoding: 'utf8'}), function(err, schema) {
      out.schema = schema;
      cb(null, out);
    });
  } else {
    cb(null, out)
  }
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
