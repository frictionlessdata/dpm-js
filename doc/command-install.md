Install a list of normalized data packages in a directory named
"datapackages".

The list of data packages to install either comes from stdin, or (if
no data packages are specified to stdin), from the "dataDependencies"
object of the datapackage.json file of the current working directory.

By default, each data package is installed in a directory (named after
the data package "name" property) and located inside the datapackages
directory. The installation of each data package corresponds to what
is done by

    dpm get <datapackage name@version> [-c, --cache]

The resource's data won't be retrieved unless the -c, --cache option
is invoked.
