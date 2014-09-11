dpm supports loading common configuration using the rc library:
https://www.npmjs.org/package/rc

It therefore can load configuration via any of the methods supported by rc.

The recommended method is to create an .dpmrc file in your home directory in
ini format.

Here's an example:

```
; start of the file

; you have to have something at top level or subsections are not correctly loaded
doesNotMatter = 1

[mysubsection]
foo = bar
```
