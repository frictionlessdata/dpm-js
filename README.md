dpm
===

Like [npm](https://npmjs.org/) but for
[data packages](http://dataprotocols.org/data-packages/)!

[![NPM](https://nodei.co/npm/dpm2.png)](https://nodei.co/npm/dpm2/)


Usage:
======

##CLI

    $ dpm --help
    Usage: dpm <command> [options] where command is:
      - init [globs (*.csv, ...)] [urls] [-d, --defaults]
      - cat       <datapackage name>[@<version>]
      - get       <datapackage name>[@<version>] [-f, --force] [-c, --cache]
      - clone     <datapackage name>[@<version>] [-f, --force]
      - install   <datapackage name 1>[@<version>] <datapackage name 2>[@<version>] ... [-c, --cache] [-s, --save] [-f, --force]
      - publish
      - unpublish <datapackage name>[@<version>]
      - adduser
      - owner <subcommand> where subcommand is:
        - ls  <datapackage name>
        - add <user> <datapackage name>
        - rm  <user> <datapackage name>[@<version>]
      - search [search terms]


### Publishing and getting data packages

Given a [data package](http://dataprotocols.org/data-packages/):

    $ cat package.json
    
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
    ├── package.json
    ├── scripts
    │   └── test.r
    ├── x1.csv
    └── x2.csv

we can:

    $ dpm publish
    dpm http PUT https://registry.standardanalytics.io/mydpkg/0.0.0
    dpm http 201 https://registry.standardanalytics.io/mydpkg/0.0.0
    + mydpkg@0.0.0

and reclone it:

    $ dpm clone mydpkg
    dpm http GET https://registry.standardanalytics.io/mydpkg?clone=true
    dpm http 200 https://registry.standardanalytics.io/mydpkg?clone=true
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/debug
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/debug
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/csv1
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/csv2
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/csv1
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/csv2
    .
    └─┬ mydpkg
      ├── package.json
      ├─┬ scripts
      │ └── test.r
      ├── x1.csv
      └── x2.csv

But to save space or maybe because you just need 1 resource, you can
also simply ask to get a package.json where all the resource data have
been replaced by and URL.

    $ dpm get mydpkg
    dpm http GET https://registry.standardanalytics.io/mydpkg
    dpm http 200 https://registry.standardanalytics.io/mydpkg
    .
    └─┬ mydpkg
      └── package.json

For instance (using [jsontool](https://npmjs.org/package/jsontool))

    $ cat mydpkg/package.json | json resources | json -c 'this.name === "csv1"' | json 0.url

returns:

    https://registry.standardanalytics.io/mydpkg/0.0.0/csv1

Note that in case of resources using the ```require``` property (as
opposed to ```data```, ```path``` or ```url```), the metadata of the
resource (```schema```, ```format```, ...) have been retrieved.

Then you can consume the resources you want with the module
[data-streams](https://github.com/standard-analytics/data-streams).


On the opposite, you can also cache all the resources data (including
external URLs) in a _standard_ directory structure, available for all
the data packages stored on the registry.

    $ dpm get mydpkg --cache
    dpm http GET https://registry.standardanalytics.io/mydpkg
    dpm http 200 https://registry.standardanalytics.io/mydpkg
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/inline
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/csv2
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/csv1
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/inline
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/csv1
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/csv2
    .
    └─┬ mydpkg
      ├── package.json
      └─┬ data
        ├── inline.json
        ├── csv1.csv
        └── csv2.csv

Each resources of package.json now have a ```path``` property. For instance

    $ cat mydpkg/package.json | json resources | json -c 'this.name === "csv1"' | json 0.path

returns

    data/csv1.csv


### Installing data packages as dependencies of your project

Given a package.json with

    {
      "name": "test",
      "version": "0.0.0",
      "dataDependencies": {
        "mydpkg": "0.0.0"
      }
    }

one can run

    $ dpm install
    dpm http GET https://registry.standardanalytics.io/versions/mydpkg
    dpm http 200 https://registry.standardanalytics.io/versions/mydpkg
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0
    .
    ├── data_modules
    └─┬ mydpkg
      └── package.json

Combined with the --cache option, you get:

    $ dpm install --cache
    dpm http GET https://registry.standardanalytics.io/versions/mydpkg
    dpm http 200 https://registry.standardanalytics.io/versions/mydpkg
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/inline
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/csv2
    dpm http GET https://registry.standardanalytics.io/mydpkg/0.0.0/csv1
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/inline
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/csv1
    dpm http 200 https://registry.standardanalytics.io/mydpkg/0.0.0/csv2
    .
    ├── data_modules
    └─┬ mydpkg
      ├── package.json
      └─┬ data
        ├── inline.json
        ├── csv1.csv
        └── csv2.csv


```dpm``` aims to bring all the goodness of the
[npm](https://npmjs.org/) workflow for your data needs. Run ```dpm
--help``` to see the available options.


## Using dpm programaticaly

You can also use ```dpm``` programaticaly.

    var Dpm = require('dpm);
    var dpm = new Dpm(conf);
    
    dpm.install(['mydpkg@0.0.0', 'mydata@1.0.0'], {cache: true}, function(err, dpkgs){
      //done!
    });
    dpm.on('log', console.log); //if you like stuff on stdout


See ```bin/dpm``` for examples


## Using dpm with npm


```dpm``` use the ```dataDependencies``` property of
```package.json``` and store the dependencies in a ```data_modules/```
directory so it can be used safely, without conflict as a
[post-install script](https://npmjs.org/doc/misc/npm-scripts.html) of
[npm](https://npmjs.org/).


Registry
========

By default, ```dpm``` uses our CouchDB powered
[data registry](https://github.com/standard-analytics/data-registry)
hosted on [cloudant](https://sballesteros.cloudant.com).


References
==========

Previous `dpm` (python-based) can still be found at
http://github.com/okfn/dpm-old.

Most relevant may be the documentation at:
http://dpm.readthedocs.org/en/latest/


