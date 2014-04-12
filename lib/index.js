var crypto = require('crypto')
  , url = require('url')
  , semver = require('semver')
  , uniq = require('lodash.uniq')
  , flatten = require('lodash.flatten')
  , glob = require('glob')
  , querystring = require('querystring')
  , cookie = require('cookie')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , request = require('request')
  , path = require('path')
  , mime = require('mime')
  , rimraf = require('rimraf')
  , mkdirp = require('mkdirp')
  , async = require('async')
  , fs = require('fs')
  , zlib = require('zlib')
  , tar = require('tar')
  , once = require('once')
  , concat = require('concat-stream')
  , jtsInfer = require('jts-infer')
  , validator = require('datapackage-validate')
  ;


var Dpm = module.exports = function(config, root){
  EventEmitter.call(this);

  this.root = root || process.cwd();

  this.config = config;
};

util.inherits(Dpm, EventEmitter);

Dpm.prototype.validate = function(path_) {
  path_ = path_ || this.root;
  var dpjsonPath = path.join(path_, 'datapackage.json');
  if (!fs.existsSync(dpjsonPath)) {
    console.log(('No DataPackage at path ' + dpjsonPath).red);
    return;
  }
  var out = fs.readFileSync(dpjsonPath);
  var results = validator.validate(out);
  if (results.valid) {
    console.log('DataPackage.json is Valid'.green);
  } else {
    console.log('DataPackage.json is Invalid'.red);
    console.log(JSON.stringify(results, null, 2));
  }
};


//TODO: remove
Dpm.prototype.url = function(path, queryObj){
  return this.config.protocol + '://'  + this.config.hostname + ':' + this.config.port + path + ( (queryObj) ? '?' + querystring.stringify(queryObj): '');
};

Dpm.prototype.resolveDeps = function(dataDependencies, callback){

  var deps = [];
  dataDependencies = dataDependencies || {};
  for (var name in dataDependencies){
    deps.push({name: name, range: dataDependencies[name]});
  }

  async.map(deps, function(dep, cb){

    var rurl = this.url('/' + dep.name);
    this.logHttp('GET', rurl);

    request(this.rOpts(rurl), function(err, res, versions){
      if(err) return cb(err);

      this.logHttp(res.statusCode, rurl);
      if (res.statusCode >= 400){
        var err = new Error('fail');
        err.code = res.statusCode;
        return cb(err);
      }

      versions = JSON.parse(versions);
      var version = semver.maxSatisfying(versions, dep.range);

      cb(null, dep.name + '@' + version);

    }.bind(this));
    
  }.bind(this), callback);

};

Dpm.prototype._cache = function(dpkg, opts, callback){

  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }
  opts.root = opts.root || this.root;

  var resources = dpkg.resources.filter(function(r){return 'url' in r;});
  if(opts.clone) {
    resources = resources.filter(function(r){return 'path' in r;});
  }
  
  async.each(resources, function(r, cb){
    cb = once(cb);

    var root;
    if(opts.clone){
      root = path.resolve(opts.root, path.dirname(r.path));
    } else {
      root = path.resolve(opts.root, 'data');
    }

    mkdirp(root, function(err){

      if(err) return cb(err);

      this.logHttp('GET', r.url);
      var req = request(this.rOpts(r.url));
      req.on('error', cb);
      req.on('response', function(resp){            
        this.logHttp(resp.statusCode, r.url);

        if(resp.statusCode >= 400){
          resp.pipe(concat(function(body){
            var err = new Error(body.toString);
            err.code = resp.statusCode;
            cb(err);
          }));
        } else {

          var filename = (opts.clone)? path.basename(r.path) : r.name + '.' +mime.extension(resp.headers['content-type']);

          resp
            .pipe(fs.createWriteStream(path.join(root, filename)))
            .on('finish', function(){
              if(!opts.clone){
                r.path = path.join('data', filename);
              }
              delete r.url;
              
              cb(null);
            });
        }
      }.bind(this));

    }.bind(this));

  }.bind(this), function(err){

    if(err) return callback(err);
    fs.writeFile(path.join(opts.root, 'package.json'), JSON.stringify(dpkg, null, 2), function(err){
      if(err) return callback(err);
      callback(null, dpkg);
    });

  });

};

Dpm.prototype.install = function(dpkgIds, opts, callback){

  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }
  
  async.map(dpkgIds, function(dpkgId, cb){

    var root = path.join(this.root, 'data_modules');    

    this.get(dpkgId, {cache: opts.cache, root: root, force: opts.force}, function(err, dpkg){
      if(err) return cb(err);
      cb(null, dpkg);
    });
    
  }.bind(this), callback);

};

