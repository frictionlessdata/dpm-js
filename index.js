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
  , publish = require('./lib/publish')
  , jtsInfer = require('jts-infer');


var Dpm = module.exports = function(config, root){
  EventEmitter.call(this);

  this.root = root || process.cwd();

  this.config = config;
};

util.inherits(Dpm, EventEmitter);

Dpm.prototype.publish = publish;


//TODO: remove
Dpm.prototype.url = function(path, queryObj){
  return this.config.protocol + '://'  + this.config.hostname + ':' + this.config.port + path + ( (queryObj) ? '?' + querystring.stringify(queryObj): '');
};

Dpm.prototype.auth = function(){
  return {user: this.config.name, pass: this.config.password};
};


/**
 * create an option object for request
 */
Dpm.prototype.rOpts = function(myurl, extras){
  extras = extras || {};

  var opts = {
    url: myurl,
    strictSSL: false
  }

  for(var key in extras){
    opts[key] = extras[key];
  }

  return opts;
};

/**
 * create an option object for request **with** basic auth
 */
Dpm.prototype.rOptsAuth = function(myurl, extras){
  var opts = this.rOpts(myurl, extras);
  opts.auth = this.auth();

  return opts;
};


Dpm.prototype.logHttp = function(methodCode, reqUrl){
  this.emit('log', 'dpm'.grey + ' http '.green + methodCode.toString().magenta + ' ' + reqUrl.replace(/:80\/|:443\//, '/'));
};


Dpm.prototype.lsOwner = function(dpkgName, callback){

  var rurl = this.url('/owner/ls/' + dpkgName);
  this.logHttp('GET', rurl);

  request(this.rOpts(rurl), function(err, res, body){
    if(err) return callback(err);
    this.logHttp(res.statusCode, rurl);

    if(res.statusCode >= 400){
      var err = new Error(body);
      err.code = res.statusCode;
      callback(err);
    }
    
    callback(null, JSON.parse(body));
  }.bind(this));    
  
};

/**
 * data: {username, dpkgName}
 */
Dpm.prototype.addOwner = function(data, callback){
  var rurl = this.url('/owner/add');
  this.logHttp('POST', rurl);
  request.post(this.rOptsAuth(rurl, {json: data}), function(err, res, body){
    if(err) return callback(err);
    this.logHttp(res.statusCode, rurl);
    if(res.statusCode >= 400){
      var err = new Error(JSON.stringify(body));
      err.code = res.statusCode;
      return callback(err);
    }
    callback(null, body);
  }.bind(this));
};

/**
 * data: {username, dpkgName}
 */
Dpm.prototype.rmOwner = function(data, callback){
  var rurl = this.url('/owner/rm');
  this.logHttp('POST', rurl);
  request.post(this.rOptsAuth(rurl, {json: data}), function(err, res, body){
    if(err) return callback(err);
    this.logHttp(res.statusCode, rurl);
    if(res.statusCode >= 400){
      var err = new Error(JSON.stringify(body));
      err.code = res.statusCode;
      return callback(err);
    }
    callback(null, body);
  }.bind(this));
};


/**
 * data: {dpkgName[@version]}
 */
Dpm.prototype.unpublish = function(dpkgId, callback){
  dpkgId = dpkgId.replace('@', '/');

  var rurl = this.url('/'+ dpkgId);
  this.logHttp('DELETE', rurl);
  request.del(this.rOptsAuth(rurl), function(err, res, body){
    if(err) return callback(err);
    this.logHttp(res.statusCode, rurl);
    if(res.statusCode >= 400){
      var err = new Error(body);
      err.code = res.statusCode;
      return callback(err);
    }
    callback(null, JSON.parse(body));
  }.bind(this));

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


Dpm.prototype.cat = function(dpkgId, opts, callback){

  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }

  var splt = dpkgId.split('@');
  var name = splt[0]
    ,version;


  if(splt.length === 2){
    version = semver.valid(splt[1]);
    if(!version){
      return callback(new Error('invalid version '+ dpkgId.red +' see http://semver.org/'));
    }
  } else {
    version = 'latest'
  }

  var rurl = this.url('/' + name + '/' + version, (opts.clone) ? {clone:true} : undefined);
  this.logHttp('GET', rurl);

  request(this.rOpts(rurl), function(err, res, dpkg){
    if(err) return callback(err);
    this.logHttp(res.statusCode, rurl);
    if (res.statusCode >= 400){
      var err = new Error('fail');
      err.code = res.statusCode;
      return callback(err);
    }
    
    var dpkg = JSON.parse(dpkg)
    if(opts.clone){
      return callback(null, dpkg);
    }

    //for all the resources with a require, get the meta data of the
    //resources (schema, format...)
    var requires = dpkg.resources.filter(function(x){return 'require' in x;});
    async.each(requires, function(r, cb){
      request(r.url + '?meta=true', function(err, resp, rmetadata){
        if(err) return cb(err);
        if(resp.statusCode === 200){
          rmetadata = JSON.parse(rmetadata);
          for (var key in rmetadata){
            if( !(key in r) ){
              r[key] = rmetadata[key];
            }
          }
          
          if( ('fields' in r.require) && ('schema' in r) && ('fields' in r.schema)){
            r.schema.fields = r.schema.fields.filter(function(field){
              return r.require.fields.indexOf(field.name) !== -1;
            });
          }

          cb(null);
        } else {
          return cb(new Error(resp.statusCode));
        }
      });

    }, function(err){
      if(err) return callback(err);
      callback(null, dpkg);
    });

  }.bind(this));

};







Dpm.prototype.get = function(dpkgId, opts, callback){

  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }

  opts.root = opts.root || this.root; 
  opts.root = path.join(opts.root, dpkgId.split('@')[0]);

  async.waterfall([
    function(cb){
      _createDir(opts.root, opts, function(err){
        cb(err);//make sure arrity of cb is 1
      });
    },
    function(cb){

      this.cat(dpkgId, function(err, dpkg){
        if(err) return cb(err);
        var dest = path.join(opts.root, 'package.json');

        if(opts.cache){
          this._cache(dpkg, opts, cb);
        } else {
          fs.writeFile(dest, JSON.stringify(dpkg, null, 2), function(err){
            if(err) return cb(err);
            cb(null, dpkg);
          });
        }
        
      }.bind(this));
      
    }.bind(this)
  ], callback);
  
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


Dpm.prototype.clone = function(dpkgId, opts, callback){

  callback = once(callback);

  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }

  this.cat(dpkgId, {clone:true}, function(err, dpkg){

    if(err) return callback(err);

    var root = path.join(this.root, dpkg.name);
    _createDir(root, opts, function(err){
      if(err) {
        return callback(err);
      }

      var rurl = this.url('/' + dpkg.name + '/' + dpkg.version + '/debug');
      this.logHttp('GET', rurl);

      var req = request(this.rOpts(rurl));
      req.on('error', callback);
      req.on('response', function(resp){            

        this.logHttp(resp.statusCode, rurl);

        if(resp.statusCode >= 400){
          resp.pipe(concat(function(body){
            var err = new Error(body.toString);
            err.code = resp.statusCode;
            callback(err);
          }));
        } else {

          resp
            .pipe(zlib.createGunzip())
            .pipe(new tar.Extract({
              path: root,
              strip: 1
            }))
            .on('end', function(){
              this._cache(dpkg, {clone: true, force: opts.force, root: root}, callback);
            }.bind(this));

        }
      }.bind(this));    

    }.bind(this));

  }.bind(this));
  
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


Dpm.prototype.adduser = function(callback){

  var rurl = this.url('/adduser/' + this.config.name);
  this.logHttp('PUT', rurl);

  var data = {
    name: this.config.name,
    email: this.config.email
  };

  if(this.config.sha){
    var salt = crypto.randomBytes(30).toString('hex');
    data.salt = salt;
    data.password_sha = crypto.createHash("sha1").update(this.config.password + salt).digest("hex");
  } else {
    data.password = this.config.password;
  }

  request.put(this.rOptsAuth(rurl, {json: data}), function(err, res, body){

    if(err) return callback(err);

    this.logHttp(res.statusCode, rurl);

    if(res.statusCode < 400){
      callback(null, body);
    } else if(res.statusCode === 409){
      err = new Error('username ' + this.config.name + ' already exists');
      err.code = res.statusCode;
      callback(err, res.headers);
    } else {
      err = new Error(JSON.stringify(body));
      err.code = res.statusCode;
      callback(err, res.headers);
    }
    
  }.bind(this));

};


function _createDir(dirPath, opts, callback){
  fs.exists(dirPath, function(exists){
    if(exists){
      if(opts.force) {
        rimraf(dirPath, function(err){
          if(err) return callback(err);
          mkdirp(dirPath, callback);                
        });
      } else {
        callback(new Error(dirPath + ' already exists, run with --force to overwrite'));
      }
    } else {
      mkdirp(dirPath, callback);      
    }
  });

};
