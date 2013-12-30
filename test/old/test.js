var dpm = require('../lib/dpm')
    util = require('../lib/util')
  , assert = require('assert')
  ;

describe('basics', function(){
  it('findDataFiles CSV OK', function() {
    var out = util.findDataFiles('test/data/dp1');
    assert.deepEqual(['data.csv'], out);
  });
  it('findDataFiles GeoJSON OK', function() {
    var out = util.findDataFiles('test/data/dp2');
    assert.deepEqual(['data.geojson'], out);
  });
  it('createResourceEntry OK', function(done) {
    var fp = 'test/data/dp1/data.csv';
    util.createResourceEntry(fp, function(err, out) {
      var exp = {
        name: 'data',
        path: fp,
        format: 'csv',
        mediatype: 'text/csv',
        bytes: 48,
        schema: {
          fields: [
            {
              name: 'date',
              description: '',
              type: 'string'
            },
            {
              name: 'value',
              description: '',
              type: 'string'
            }
          ]
        }
      }
      assert.deepEqual(JSON.stringify(out, null, 2), JSON.stringify(exp, null, 2));
      done();
    });
  });
  it('createResourceEntry GeoJSON OK', function(done) {
    var fp = 'test/data/dp2/data.geojson';
    util.createResourceEntry(fp, function(err, out) {
      var exp = {
        name: 'data',
        path: fp,
        format: 'geojson',
        mediatype: 'application/json',
        bytes: 4
      }
      assert.deepEqual(JSON.stringify(out, null, 2), JSON.stringify(exp, null, 2));
      done();
    });
  });
  it('createResourceEntries OK', function(done) {
    util.createResourceEntries('test/data/dp1', function(err, out) {
      assert.equal(out.length, 1);
      assert.equal(out[0].name, 'data');
      done();
    });
  });
});

