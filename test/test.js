var util = require('util')
  , fs = require('fs')
  , clone = require('clone')
  , temp = require('temp')
  , assert = require('assert')
  , Dpm = require('..')
  , readdirpSync = require('fs-readdir-recursive')
  , difference = require('lodash.difference')
  , path = require('path');

temp.track();

var root = path.dirname(__filename);

describe('dpm', function(){

  var conf = {
    protocol: 'http',
    port: 3000,
    hostname: 'localhost',
    strictSSL: false,
    sha:true,
    name: "user_a",
    email: "user@domain.com",
    password: "user_a"
  };

  var nano = require('nano')('http://seb:seb@127.0.0.1:5984'); //connect as admin
  var _users = nano.db.use('_users')
    , registry = nano.db.use('registry');


  function rm(db, id, cb){
    db['head'](id, function(err, _, headers){
      var etag = (headers && headers.etag.replace(/^"(.*)"$/, '$1')) || '';    
      db['destroy'](id, etag, function(err, _, _){
        cb();
      });
    });
  };

  function rmFixtures (cb){
    rm(registry, 'mydpkg@0.0.0', function(){
      rm(registry, 'req@0.0.0', function(){
        rm(_users,  'org.couchdb.user:user_a', function(){
          rm(_users, 'org.couchdb.user:user_b', function(){            
            cb();
          });
        });
      });
    });
  };


  describe('publish', function(){
    var dpm1, dpm2;

    before(function(done){
      dpm1 = new Dpm(conf, path.join(root, 'fixtures', 'mydpkg'));
      dpm2 = new Dpm(conf, path.join(root, 'fixtures', 'require'));

      dpm1.adduser(function(err, headers){
        done()
      });
    });
    
    it('should publish a data package with attachments and raise an error with code if the dpkg is republished', function(done){
      dpm1.publish(function(err, id){     
        assert.equal('mydpkg@0.0.0', id);
        dpm1.publish(function(err, id){     
          assert.equal(err.code, 409);
          done();
        });
      });
    });

    it('should publish a data package without attachments', function(done){
      dpm2.publish(function(err, id){
        assert.equal('req@0.0.0', id);
        done();
      });
    });

    after(function(done){
      rmFixtures(done);
    });

  });

  describe('unpublish', function(){
    var dpm1;

    before(function(done){
      dpm1 = new Dpm(conf, path.join(root, 'fixtures', 'mydpkg'));
      dpm1.adduser(function(err, headers){
        dpm1.publish(function(err, id){
          done();
        })
      });
    });
    
    it('should unpublish a dpkg', function(done){
      dpm1.unpublish('mydpkg', function(err, res){
        assert.deepEqual(res, {ok:true});
        done();
      });
    });

    after(function(done){
      rmFixtures(done);
    });

  });


  
  describe('cat', function(){

    var dpm1, dpm2;

    var expected = { 
      name: 'req',
      description: 'a test for require',
      dataDependencies: { mydpkg: '0.0.0' },
      version: '0.0.0',
      keywords: [ 'test', 'datapackage' ],
      resources: [
        {
          name: 'azerty',
          require: { datapackage: 'mydpkg', resource: 'csv1', fields: ['a'] },
          url: 'http://localhost:3000/mydpkg/0.0.0/csv1',
          format: 'csv',
          schema: { fields: [ { name: 'a', type: 'integer' } ] }
        } 
      ] 
    };

    before(function(done){
      dpm1 = new Dpm(conf, path.join(root, 'fixtures', 'mydpkg'));
      dpm2 = new Dpm(conf, path.join(root, 'fixtures', 'require'));

      dpm1.adduser(function(err, headers){
        dpm1.publish(function(err, id){
          dpm2.publish(function(err, body){
            done();
          });
        });
      });
    });

    it('should error if we cat unexisting dpkg', function(done){
      dpm2.cat('reqxddwdwdw@0.0.0', function(err, dpkg){
        assert.equal(err.code, 404);
        done();
      });
    });

    it('should cat the dpkg having resolved the require', function(done){
      dpm2.cat('req@0.0.0', function(err, dpkg){
        assert.deepEqual(expected, dpkg);
        done();
      });
    });

    it('should cat the latest dpkg having resolved the require when version is not specified', function(done){
      dpm2.cat('req', function(err, dpkg){
        assert.deepEqual(expected, dpkg);
        done();
      });
    });


    it('should cat the dpkg as is', function(done){
      dpm2.cat('req@0.0.0', {clone:true}, function(err, dpkg){
        var exp = clone(expected);
        delete exp.resources[0].schema;
        delete exp.resources[0].url;
        delete exp.resources[0].format;
        assert.deepEqual(exp, dpkg);
        done();
      });
    });

    after(function(done){
      rmFixtures(done);
    });
    
  });


  describe('owner', function(){

    var expected = [ 
      {name: 'user_a', email: 'user@domain.com'},
      {name: 'user_b', email: 'user@domain.com'}
    ];

    var dpm1, dpm2;
    before(function(done){
      dpm1 = new Dpm(conf, path.join(root, 'fixtures', 'require'));
      var conf2 = clone(conf);
      conf2.name = 'user_b';
      dpm2 = new Dpm(conf2, path.join(root, 'fixtures', 'require'));

      dpm1.adduser(function(err, headers){
        dpm2.adduser(function(err, id){
          dpm1.publish(function(err, body){
            done();
          });
        });
      });
    });
    
    it('should list the maintainers', function(done){
      dpm1.lsOwner('req', function(err, maintainers){
        assert.deepEqual(maintainers, expected.slice(0, 1));
        done();
      });    
    });

    it('should add a maintainer then remove it', function(done){
      dpm1.addOwner({username: 'user_b', dpkgName: 'req'}, function(err){
        dpm1.lsOwner('req', function(err, maintainers){
          assert.deepEqual(maintainers, expected);
          dpm1.rmOwner({username: 'user_b', dpkgName: 'req'}, function(err){
            dpm1.lsOwner('req', function(err, maintainers){
              assert.deepEqual(maintainers, expected.slice(0, 1));
              done();
            });
          });
        });
      });
    });

    it("should err", function(done){
      dpm1.addOwner({username: 'user_c', dpkgName: 'req'}, function(err){
        assert.equal(err.code, 404);
        done();
      })      
    });

    after(function(done){
      rmFixtures(done);
    });

  });


  describe('files', function(){
    var dpm1, dpm2;
    before(function(done){
      dpm1 = new Dpm(conf, path.join(root, 'fixtures', 'require'));
      dpm1.adduser(function(err, headers){
        dpm1.publish(function(err, body){
          dpm2 = new Dpm(conf, path.join(root, 'fixtures', 'mydpkg'));
          dpm2.publish(function(err, body){
            done();
          });
        });
      });
    });

    it('should get req@0.0.0', function(done){
      temp.mkdir('test-dpm2-', function(err, dirPath) {
        var dpm = new Dpm(conf, dirPath);
        dpm.get('req@0.0.0', function(err){
          fs.readdir(path.join(dirPath, 'req'), function(err, files){
            assert.deepEqual(files, ['package.json']);
            done();
          });
        });
      });    
    });

    it('should get req@0.0.0 and cache data including the data of the require', function(done){
      temp.mkdir('test-dpm2-', function(err, dirPath) {
        var dpm = new Dpm(conf, dirPath);
        dpm.get('req@0.0.0', {cache: true}, function(err){
          var files = readdirpSync(path.join(dirPath, 'req'));
          assert(files.length && difference(files, [path.join('data', 'azerty.csv'), 'package.json']).length === 0);
          done();
        });
      });
    });

    it('should clone mydpkg', function(done){
      temp.mkdir('test-dpm2-', function(err, dirPath) {
        var dpm = new Dpm(conf, dirPath);
        dpm.clone('mydpkg@0.0.0', function(err){
          var files = readdirpSync(path.join(dirPath, 'mydpkg'));
          assert(files.length && difference(files, ['package.json', path.join('scripts', 'test.r'),'x1.csv','x2.csv']).length === 0);                 
          done();
        });
      });
    });

    it('should install req and mydpkg', function(done){
      temp.mkdir('test-dpm2-', function(err, dirPath) {
        var dpm = new Dpm(conf, dirPath);
        dpm.install(['mydpkg@0.0.0', 'req@0.0.0'], function(err){
          var files = readdirpSync(path.join(dirPath));
          assert(files.length && difference(files, [ path.join('data_modules',  'mydpkg', 'package.json'), path.join('data_modules',  'req', 'package.json') ]).length === 0);
          done();
        });
      });
    });

    it('should install req and mydpkg and cache the deps', function(done){
      temp.mkdir('test-dpm2-', function(err, dirPath) {
        var dpm = new Dpm(conf, dirPath);
        dpm.install(['mydpkg@0.0.0', 'req@0.0.0'], {cache:true}, function(err){
          var files = readdirpSync(path.join(dirPath));

          var expf = [
            path.join('data_modules', 'mydpkg', 'data', 'csv1.csv'),
            path.join('data_modules', 'mydpkg', 'data', 'csv2.csv'),
            path.join('data_modules', 'mydpkg', 'data', 'inline.json'),
            path.join('data_modules', 'mydpkg', 'package.json'),
            path.join('data_modules', 'req', 'data', 'azerty.csv'),
            path.join('data_modules', 'req', 'package.json')
          ];

          assert(files.length && difference(files, expf).length === 0);
          done();
        });
      });
    });

    it('should resolve the dataDependencies of req', function(done){
      dpm1.resolveDeps({'req': '*'}, function(err, versions){
        assert.deepEqual(versions, ['req@0.0.0']);
        done();
      });
    });
    
    after(function(done){
      rmFixtures(done);
    });
    
  });

});
