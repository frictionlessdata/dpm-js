var path = require('path')
  , http = require('http')
  , https = require('https')
  , Ignore = require("fstream-ignore")
  , PassThrough = require("stream").PassThrough
  , temp = require('temp')
  , tar = require('tar')
  , async = require('async')
  , mime = require('mime')
  , zlib = require('zlib')
  , cookie = require('cookie')
  , clone = require('clone')
  , once = require('once')
  , fs = require('fs')
  , couchMultipartStream = require('couch-multipart-stream');

temp.track();

module.exports = publish;

function publish(callback){

  callback = once(callback);

  var options = {
    port: this.rc.port,
    hostname: this.rc.hostname,
    method: 'PUT',
    path: '/',
    auth: this.rc.name + ':' + this.rc.password,
    headers: {}
  };

  var http_s;

  if(this.rc.protocol === 'https'){

    options.rejectUnauthorized = false;
    options.agent = new https.Agent(options);
    
    http_s = https;

  } else {
    http_s = http;
  }

  _getDpkgStream.call(this, function(err, dpkgStream){
    if(err) return callback(err);

    Object.keys(dpkgStream.headers).forEach(function(header){
      options.headers[header] = dpkgStream.headers[header];
    });
    options.path +=  dpkgStream._id.replace('@', '/');

    var rurl = this.url(options.path);
    this.logHttp('PUT', rurl);

    var req = http_s.request(options, function(res){
      var code = res.statusCode;
      this.logHttp(code, rurl);

      res.setEncoding('utf8');
      var data = '';
      res.on('data', function(chunk){ data += chunk; });
      res.on('end', function(){
        var err;
        
        if(code < 400){
          callback(null, dpkgStream._id);

        } else if(code === 409){ //a previous version is already here

          err = new Error(dpkgStream._id + ' has already been published');
          err.code = code;
          callback(err, res.headers);

        } else {

          err = new Error(data);
          err.code = code;
          callback(err, res.headers);

        }
      }.bind(this));
    }.bind(this));
    req.on('error', callback);

    dpkgStream.pipe(req);

  }.bind(this));
};


function _getDpkgStream(callback){
  callback = once(callback);

  var root = this.root;

  fs.readFile(path.resolve(root, 'package.json'), function(err, doc){
    if(err) return callback(err);

    try{
      doc = JSON.parse(doc);
    } catch(e){
      return callback(e);
    }

    doc.date = (new Date).toISOString();

    var data = doc.resources.filter(function(x){return 'path' in x});

    var dataPaths = data.map(function(x){return x.path});
    var dataNames = data.map(function(x){return x.name});

    //compress everything (not ignored) but the data and the package.json
    var ignore = new Ignore({
      path: root,
      ignoreFiles: ['.gitignore', '.npmignore', '.dpmignore'].map(function(x){return path.resolve(root, x)})
    });
    ignore.addIgnoreRules(dataPaths.concat(['package.json', '.git', 'data_modules', 'node_modules']), 'custom-rules');

    //write tarball in a temp dir
    var ws = ignore.pipe(tar.Pack()).pipe(zlib.createGzip()).pipe(temp.createWriteStream('dpm-'));
    ws.on('error', callback)
    ws.on('finish', function(){

      dataPaths = dataPaths.map(function(p){return path.resolve(root, p);});
      dataPaths.push(ws.path);
      //get stats
      async.map(dataPaths, fs.stat, function(err, stats){
        if(err) return callback(err); 

        //append _attachments to datapackage
        doc._attachments = {
          'debug.tar.gz': {follows: true, length: (stats.pop()).size, 'content_type': 'application/x-gtar', _stream: fs.createReadStream(dataPaths.pop())}
        };

        dataPaths.forEach(function(p, i){
          doc._attachments[dataNames[i] + path.extname(p)] = {
            follows: true,
            length: stats[i].size,
            'content_type': mime.lookup(p),
            _stream: fs.createReadStream(p)
          };
        });

        var dpkgStream = couchMultipartStream(doc);
        dpkgStream._id = doc.name + '@' + doc.version;
        dpkgStream._name = doc.name;

        callback(null, dpkgStream);
      });

    });

  }.bind(this));

};
