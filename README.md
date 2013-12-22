Data Package Manager is a command line tool for managing [Data Packages][dp]
including publishing and install.

[dp]: http://data.okfn.org/standards/data-package

## Install

[![NPM](https://nodei.co/npm/datapm.png)](https://nodei.co/npm/datapm/)

Install node and npm and then install `datapm`:

```
npm install -g datapm
```

*Note*: datapm is a temporary name whilst we see if dpm is available.

## Get Started

Get a list of the commands:

    dpm -h

Initialize a data package in current directory (that is, create package.json):

    dpm init 

Publish your data package:

    dpm publish


## Plans

We aim to support these commands:

```
init      # create a data package
install   # download and install a data package
publish   # publish a datapackage to the registry
cat       # stream a data package resource to stdout
```

## References

Previous `dpm` (python-based) can still be found at
http://github.com/okfn/dpm-old.

Most relevant may be the documentation at:
http://dpm.readthedocs.org/en/latest/


