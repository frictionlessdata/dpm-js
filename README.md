# Data Package Manager - in JavaScript

[![NPM Package](https://nodei.co/npm/dpmjs.png)](https://nodei.co/npm/dpmjs/)

[![Build Status](https://travis-ci.org/frictionlessdata/dpm-js.svg?branch=master)](https://travis-ci.org/frictionlessdata/dpm-js)

dpm is a library and command line manager for [Data Packages](http://dataprotocols.org/data-packages/).

> Starting from v0.8.0 package on NPM has been renamed to `dpmjs`.

## Install

`dpm` is implemented in node, so to install `dpm` just do:

```bash
npm install dpmjs -g
```

## Command Line Usage

To get an overview and list of commands check out the command line help:

```bash
dpm --help
```

## Using DPM programaticaly

You can also use `dpm` programatically.

```javascript
var Dpm = require('dpmjs');
var dpm = new Dpm(conf);

dpm.install(['mydpkg@0.0.0', 'mydata@1.0.0'], {cache: true}, function(err, dpkgs){
  //done!
});
dpm.on('log', console.log); //if you like stuff on stdout
```

## Changelog

* v0.7.0: new ckan command
* v0.6.0: much better validation via v0.2 of datapackage-validate

## References

Previous `dpm` (python-based) can still be found at
http://github.com/okfn/dpm-old.
