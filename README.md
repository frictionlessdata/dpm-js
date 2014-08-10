# dpm = data package manager

dpm is a library and command line manager for [Data Packages][dp].

[dp]: http://dataprotocols.org/data-packages/

[![NPM](https://nodei.co/npm/datapackage.png)](https://nodei.co/npm/datapackage/)

## Install

**Note: `dpm` is provided by a node package named `datapackage` (not `dpm`)**

`dpm` is implemented in node, so to install `dpm` just do:

    npm install datapackage

## Command Line Usage

To get a full overview check out the command line help:

    dpm --help

### Initialize (Create) a Data Package

    dpm init [PATH]

For more see `doc/command-init.md` (or do `dpm help init`)

### Validate a Data Package

Check that a Data Package is valid (in particular, that its `datapackage.json`
looks ok):

    dpm validate [PATH]

For more see `doc/command-validate.md` (or do `dpm help validate`)

### Installing Data Packages


    dpm install [url]

For more see `doc/command-install.md` (or do `dpm help install`)

----

## Using DPM programaticaly

You can also use `dpm` programatically.

    var Dpm = require('datapackage);
    var dpm = new Dpm(conf);
    
    dpm.install(['mydpkg@0.0.0', 'mydata@1.0.0'], {cache: true}, function(err, dpkgs){
      //done!
    });
    dpm.on('log', console.log); //if you like stuff on stdout

----

## Changelog

* v0.6.0: much better validation via v0.2 of datapackage-validate

## References

Previous `dpm` (python-based) can still be found at
http://github.com/okfn/dpm-old.

Most relevant may be the documentation at:
http://dpm.readthedocs.org/en/latest/

