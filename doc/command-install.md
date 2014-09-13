$0 install {url}

Install Data Package at {url} into subdirectory of current directory named
"datapackages".

The list of data packages to install either comes from stdin, or (if
no data packages are specified to stdin), from the "dataDependencies"
object of the datapackage.json file of the current working directory.

By default, each data package is installed in a directory (named after
the data package "name" property) and located inside the datapackages
directory.

