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
  , dpSpec = require('datapackage-identifier')
  , dpRead = require('datapackage-read')
  , dpCkan = require('datapackage-ckan')
  , colors = require('colors')
  ;


var Dpm = module.exports = function(config, root){
  EventEmitter.call(this);

  this.root = root || process.cwd();
  this.config = config;
};

util.inherits(Dpm, EventEmitter);

Dpm.prototype.validate = function(path_) {
  var dpjsonPath = path_ || this.root;
  // strip datapackage.json if already there
  dpjsonPath = dpjsonPath.replace(/datapackage.json$/, '');
  // now add it on
  dpjsonPath = path.join(dpjsonPath, 'datapackage.json');
  if (!fs.existsSync(dpjsonPath)) {
    console.log(('No DataPackage at path ' + dpjsonPath).red);
    return;
  }
  var out = fs.readFileSync(dpjsonPath, {encoding: 'utf8'});
  return validator.validate(out).then(function (results) {
    if (results.valid) {
      console.log('DataPackage.json is Valid'.green);
    } else {
      console.log('DataPackage.json is Invalid'.red);
      console.log(JSON.stringify(results, null, 2));
    }
    return results;
  });
};


//TODO: remove
Dpm.prototype.url = function(path, queryObj){
  return this.config.protocol + '://'  + this.config.hostname + ':' + this.config.port + path + ( (queryObj) ? '?' + querystring.stringify(queryObj): '');
};

Dpm.prototype.logHttp = function(methodCode, reqUrl){
  this.emit('log', 'dpm'.grey + ' http '.green + methodCode.toString().magenta + ' ' + reqUrl.replace(/:80\/|:443\//, '/'));
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


// TODO: reintroduce support for --save to list new installs as dependencies
Dpm.prototype.installFromArgString = function(dpkgIds, options, callback) {
  var self = this
    , dpkg = null
    ;

  if(!dpkgIds.length) { //get deps for a package.json
    var dpPath = path.join(this.root, 'datapackage.json');
    try {
      dpkg = JSON.parse(fs.readFileSync(dpPath));
    } catch(e){
      callback(new Error('could not find datapackage at '+ dpPath));
    }
    dpm.resolveDeps(dpkg.dataDependencies, function(err, dpkgIds){
      if (err) callback(new Error(err));
      else next(dpkgIds);
    });
  } else {
    next(dpkgIds);
  }

  function next(dpkgIds){
    self.install(dpkgIds, options, callback);
  };
}

// dpkgIds are data package "specs":
//
// - url to a datapackage
// - path to a datapackage
// - package name
Dpm.prototype.install = function(dpkgIds, opts, callback){
  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }
  async.map(dpkgIds, this.get.bind(this), callback);
};

// retrieve a (remote) data package into local datapackages directory
Dpm.prototype.get = function(dpkgId, opts, callback) {
  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }

  var self = this
    , spec = dpSpec.parse(dpkgId)
    , root = path.join(this.root, 'datapackages')
    , pkgPath = path.join(root, spec.name)
    , dpjsonUrl = spec.url.replace(/\/$/, '') + '/datapackage.json'
    ;

  if (!fs.existsSync(pkgPath)) {
    mkdirp.sync(pkgPath);
  }

  if (!spec.url) {
    callback(new Error('We only support installing from URLs at the moment and "' + dpkgId + '" is not a URL'));
    return;
  }

  request.get(dpjsonUrl, function(err, res, body) {
    if(err) return cb(err);

    var dpkg = JSON.parse(body)
      , dest = path.join(pkgPath, 'datapackage.json');

    fs.writeFileSync(dest, JSON.stringify(dpkg, null, 2));

    var resources = dpkg.resources;
    // TODO: convert path to urls ...

    async.each(resources, function(r, cb) {
      cb = once(cb);
      var resourceUrl = r.url ? r.url : spec.url.replace(/\/$/, '') + '/' + r.path;

      self.logHttp('GET', resourceUrl);
      var req = request(resourceUrl);
      req.on('error', cb);
      req.on('response', function(resp){
        self.logHttp(resp.statusCode, resourceUrl);
        if(resp.statusCode >= 400){
          resp.pipe(concat(function(body){
            var err = new Error(body.toString);
            err.code = resp.statusCode;
            cb(err);
          }));
          return;
        }

        var defaultDataRootPath = path.join(pkgPath, 'data')
          , destPath = ''
        ;
        if (r.path) {
          destPath = path.join(pkgPath, r.path);
        } else {
          var filename = url.parse(r.url).pathname.split('/').pop();
          destPath = path.join(defaultDataRootPath, filename);
          // TODO: store this into local datapackage (??)
        }

        mkdirp.sync(path.dirname(destPath));
        resp
          .pipe(fs.createWriteStream(destPath))
          .on('finish', function(){
            cb(null);
          });
      });
    },
      // what we call when async.each finishes
      function(err) {
        callback(err, dpkg);
      }
    );
  });
};

Dpm.prototype.ckan = function(argv, callback) {
  var ckanUrlOrName = argv._[1]
    , dpPath = this.root
    ;

  // convert configs keyed by name to ones keyed by urls ...
  var ckanConfigs = {};
  for(key in this.config.ckan) {
    ckanConfigs[this.config.ckan[key].url] = this.config.ckan[key];
  };
  var config = ckanConfigs[ckanUrlOrName] || this.config.ckan ? this.config.ckan[ckanUrlOrName] : null;

  if (!config) {
    var msg = 'You need to set a CKAN API Key for CKAN instance ' + ckanUrlOrName +'. See help on ckan command for how to do this.';
    callback(msg);
    return;
  }

  var ckanIt = new dpCkan.Pusher(config.url, config.apikey);
  ckanIt.push(dpPath, argv, callback);
};

Dpm.prototype.info = function(argv, callback) {
  if (!argv.identifier) {
    argv.identifier = path.resolve('.');
  }
  out = dpSpec.parse(argv.identifier);
  if (out.originalType == 'path') {
    dpRead.load(out.path, handleIt);
  } else {
    dpRead.loadUrl(out.url, handleIt);
  }
  function handleIt(err, info) {
    if (!err) {
      var out = {
        json: info,
        plain: JSON.stringify(info, null, 2),
        html: 'TODO'
      }
    }
    callback(err, out);
  }
}
