dpm
===

[Data package][dp] library and data package manager (dpm) command line tool.

[dp]: http://dataprotocols.org/data-packages/

[![NPM](https://nodei.co/npm/datapackage.png)](https://nodei.co/npm/datapackage/)

Usage:
======

##CLI

    $ dpm --help
    Usage: dpm <command> [options] where command is:
      - init [globs (*.csv, ...)] [urls] [-d, --defaults]
      - install   <datapackage name 1>[@<version>] <datapackage name 2>[@<version>] ... [-c, --cache] [-s, --save] [-f, --force]
      - publish
      - unpublish <datapackage name>[@<version>]
      - search [search terms]


### Publishing and getting data packages

Given a [data package](http://dataprotocols.org/data-packages/):

    $ cat datapackage.json
    
    {
      "name": "mydpkg",
      "description": "my datapackage",
      "version": "0.0.0",
      "keywords": ["test", "datapackage"],
    
      "resources": [
        {
          "name": "inline",
          "schema": { "fields": [ {"name": "a", "type": "string"}, {"name": "b", "type": "integer"}, {"name": "c", "type": "number"} ] },
          "data": [ {"a": "a", "b": 1, "c": 1.2}, {"a": "x", "b": 2, "c": 2.3}, {"a": "y", "b": 3, "c": 3.4} ]
        },
        {
          "name": "csv1",
          "format": "csv",
          "schema": { "fields": [ {"name": "a", "type": "integer"}, {"name": "b", "type": "integer"} ] },
          "path": "x1.csv"
        },
        {
          "name": "csv2",
          "format": "csv",
          "schema": { "fields": [ {"name": "c", "type": "integer"}, {"name": "d", "type": "integer"} ] },
          "path": "x2.csv"
        }
      ]
    }

stored on the disk as

    $ tree
    .
    ├── datapackage.json
    ├── scripts
    │   └── test.r
    ├── x1.csv
    └── x2.csv



## Using dpm programaticaly

You can also use ```dpm``` programaticaly.

    var Dpm = require('datapackage);
    var dpm = new Dpm(conf);
    
    dpm.install(['mydpkg@0.0.0', 'mydata@1.0.0'], {cache: true}, function(err, dpkgs){
      //done!
    });
    dpm.on('log', console.log); //if you like stuff on stdout


See ```bin/dpm``` for examples


References
==========

Previous `dpm` (python-based) can still be found at
http://github.com/okfn/dpm-old.

Most relevant may be the documentation at:
http://dpm.readthedocs.org/en/latest/

