var fs = require('fs')
  , path = require('path')
  , datapackage = require('datapackage')
  ;

module.exports = {
  "name" : prompt('name',
    typeof name === 'undefined'
    ? basename.replace(/^node-|[.-]js$/g, ''): name),
  "version" : prompt('version', typeof version !== "undefined"
                              ? version : '0.1.0'),
  "description" : (function () {
      if (typeof description !== 'undefined' && description) {
        return description
      }
      var value;
      try {
          var src = fs.readFileSync('README.md', 'utf8');
          value = src.split('\n').filter(function (line) {
              return /\s+/.test(line)
                  && line.trim() !== basename.replace(/^node-/, '')
                  && !line.trim().match(/^#/)
              ;
          })[0]
              .trim()
              .replace(/^./, function (c) { return c.toLowerCase() })
              .replace(/\.$/, '')
          ;
      }
      catch (e) {
      }
      return prompt('description', value);
  })(),
  "repository" : (function () {
    try { var gconf = fs.readFileSync('.git/config').toString() }
    catch (e) { gconf = null }
    if (gconf) {
      gconf = gconf.split(/\r?\n/)
      var i = gconf.indexOf('[remote "origin"]')
      if (i !== -1) {
        var u = gconf[i + 1]
        if (!u.match(/^\s*url =/)) u = gconf[i + 2]
        if (!u.match(/^\s*url =/)) u = null
        else u = u.replace(/^\s*url = /, '')
      }
      if (u && u.match(/^git@github.com:/))
        u = u.replace(/^git@github.com:/, 'git://github.com/')
    }

    return prompt('git repository', u)
  })(),
  "keywords" : prompt(function (s) {
    if (!s) return undefined
    if (Array.isArray(s)) s = s.join(' ')
    if (typeof s !== 'string') return s
    return s.split(/[\s,]+/)
  }),
  "author" : config['init.author.name']
    ? {
        "name" : config['init.author.name'],
        "email" : config['init.author.email'],
        "url" : config['init.author.url']
      }
    : undefined,
  "licenses" : [{
    type: 'ODC-PDDL',
    url: 'http://opendatacommons.org/licenses/pddl/1.0/'
  }],
  "sources": [{
    name: 'Unknown',
    web: ''
  }],
  "resources": config.get('resources')
}

