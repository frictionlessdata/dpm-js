var urlmod = require('url');

exports.parseSpecString = function (specString) {
  out = {
    url: '',
    name: '',
    version: ''
  }
  var path = specString;
  if (specString.indexOf('http') != -1) {
    out.url = specString;
    var urlparts = urlmod.parse(specString);
    path = urlparts.pathname;
  }
  var parts = path.split('/');
  var name = parts.pop();
  var _tmp = name.split('@');
  out.name = _tmp[0];
  if (_tmp.length > 1) {
    out.version = _tmp.split('@');
  }
  return out;
}
