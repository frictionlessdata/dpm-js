# dpm = data package manager

dpm is a library and command line manager for [Data Packages][dp].

[dp]: http://dataprotocols.org/data-packages/

[![NPM](https://nodei.co/npm/datapackage.png)](https://nodei.co/npm/datapackage/)  
[![Build Status](https://travis-ci.org/okfn/dpm.svg?branch=master)](https://travis-ci.org/okfn/dpm)

## Install

**Note: `dpm` is provided by a node package named `datapackage` (not `dpm`)**

`dpm` is implemented in node, so to install `dpm` just do:

    npm install datapackage -g

## Command Line Usage

To get an overview and list of commands check out the command line help:

    dpm --help

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

* v0.7.0: new ckan command
* v0.6.0: much better validation via v0.2 of datapackage-validate

## References

Previous `dpm` (python-based) can still be found at
http://github.com/okfn/dpm-old.
