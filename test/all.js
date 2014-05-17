var assert = require('assert')
  , path = require('path')
  , fs = require('fs')
  , rimraf = require('rimraf')

  , dpm = require('../lib/index')
  , util = require('../lib/util')
  ;

describe('get', function() {
  var root = path.join('/tmp', 'dpm-test');
  this.timeout(8000);

  beforeEach(function(done) {
    rimraf(root, done);
  });

  it('works on urls', function(done) {
    var ours = new dpm({}, root);
    var url = 'http://data.okfn.org/data/country-codes';
    var dpjson = path.join(root, 'datapackages', 'country-codes', 'datapackage.json')
    var datapath = path.join(root, 'datapackages', 'country-codes', 'data', 'country-codes.csv')
    // var url = 'http://localhost/datasets/country-codes';
    ours.get(url, function(err) {
      if (err) done(err);
      var dpkg = JSON.parse(fs.readFileSync(dpjson));
      var data = fs.readFileSync(datapath, 'utf8');
      assert.equal(dpkg.name, 'country-codes');
      assert.equal(data.slice(0,12), 'name,name_fr');
      done();
    });
  });

  it('works on github', function(done) {
    var ours = new dpm({}, root);
    var url = 'https://github.com/datasets/country-codes';
    var dpjson = path.join(root, 'datapackages', 'country-codes', 'datapackage.json')
    var datapath = path.join(root, 'datapackages', 'country-codes', 'data', 'country-codes.csv')
    // var url = 'http://localhost/datasets/country-codes';
    ours.get(url, function(err) {
      if (err) done(err);
      var dpkg = JSON.parse(fs.readFileSync(dpjson));
      var data = fs.readFileSync(datapath, 'utf8');
      assert.equal(dpkg.name, 'country-codes');
      assert.equal(data.slice(0,12), 'name,name_fr');
      done();
    });
  });
});

