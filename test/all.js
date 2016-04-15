var assert = require('assert')
  , sinon = require('sinon')
  , colors = require('colors')
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

  it('should ignore data resource', function(done) {
    var ours = new dpm({}, root);
    var url = 'https://github.com/waylonflinn/datapackage-example-inline';
    var dpjson = path.join(root, 'datapackages', 'datapackage-example-inline', 'datapackage.json')

    ours.get(url, function(err) {
      if (err) return done(err);

      var dpkg = JSON.parse(fs.readFileSync(dpjson));
      assert.equal(dpkg.name, 'datapackage-example-inline');
      done();
    });
  });
});

describe('info', function() {
  it('fixture', function(done) {
    var ours = new dpm({}, root);
    var argv = {
      identifier: path.resolve('test/fixtures/mydpkg-test')
    };
    ours.info(argv, function(err, result) {
      assert(!err, err);
      assert.equal(result.json.name, 'mydpkg-test');
      done();
    });
  });
});

describe('validate', function() {
  var consoleLogSpy;
  beforeEach(function() {
    consoleLogSpy = sinon.spy(console, 'log');
  });

  afterEach(function() {
    consoleLogSpy.restore();
  });

  it('should return valid with a valid datapackage.json', function(done) {
    var _dpm = new dpm({}, root);
    var _path = path.resolve('test/fixtures/mydpkg-test');
    return _dpm.validate(_path).then(function (results) {
      assert.equal(results.valid, true);
      assert.equal(results.errors.length, 0);
      assert.ok(consoleLogSpy.calledWith('DataPackage.json is Valid'.green));
      done();
    });
  });

  it('should return invalid with a invalid datapackage.json', function(done) {
    var _dpm = new dpm({}, root);
    var _path = path.resolve('test/fixtures/mydpkg-invalid-test');
    var expectedResult = {
      "valid": false,
      "errors": [
        {
          "message": "Missing required property: name",
          "params": {
            "key": "name"
          },
          "code": 302,
          "dataPath": "",
          "schemaPath": "/required/0",
          "subErrors": null,
          "type": "schema"
        }
      ]
    };

    return _dpm.validate(_path).then(function (results) {
      assert.equal(results.valid, false);
      assert.equal(results.errors.length, 1);
      assert.ok(consoleLogSpy.calledWith('DataPackage.json is Invalid'.red));
      assert.ok(consoleLogSpy.calledWith(JSON.stringify(expectedResult, null, 2)));
      done();
    });
  });
});
