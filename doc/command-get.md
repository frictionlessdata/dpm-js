Download a normalized data package into a directory named after the
data package "name" property.

By default, a normalized data package only contains a normalized
datapackage.json file where all the "path" or "data" properties of the
data package resources have been replaced by URLs.

With the -c, --cache option, the URL of each resource is resolved and
the content is stored into a directory named "data". The data package
resources each acquire a "path" property, replacing the "url" one. If
the datapackage.json file has a non empty "dataDependencies" object,
only the data of resources explicitly requiring the dependencies,
e.g.,

    {
      "name": "mydpkg",
      "version": "0.0.0",
      "dataDependencies": {
        "a-dep": "0.0.0"
      },    
      "resources": [
        {
          "name": "myresource",
          "require": {"datapackage": "a-dep", "resource": "myresource"}
        }
      ]
    }


are cached.
