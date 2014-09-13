$0 ckan {ckan-instance-url}

Push the Data Package in the current directory into CKAN instance at
{ckan-instance-url}.

This will also import data from the Data Package resources into the DataStore
(if of appropriate format i.e. CSVs).

If you need to set the owner organization in CKAN use --owner_org e.g.

    dpm ckan http://datahub.io --owner_org=my-organization

## Configuration - Important

To push to CKAN you will need to set an API Key for that instance. To do this
add ckan config to your .dpmrc file as follows (see "dpm help dpmrc" for more
on configuration files):

```
; you have one 'ckan.XXX' section per ckan instance you want to interact with
; XXX can be anything but must not contain '.' and can be used as shorthand
; e.g. you can do
;     dpm push datahub
; rather than
;     dpm push http://datahub.io/
[ckan.datahub]
url = http://datahub.io/
apikey = XXX

[ckan.local]
url = http://localhost:5000
apikey = XXX
```


