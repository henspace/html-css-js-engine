# HTML-CSS-JavaScript-Engine (HCJE)

The code is currently underdevelopment to improve its use as a submodule.

This is the launch page for the HTML-CSS-JavaScript Engine or HCJE. 

The engine itself is designed to help with the creation of simple games that do not use a canvas element. It's more of a
test tool than a full blown engine, but you might find some interesting bits in it. 

## Documentation

Documentation for the engine and associated build tools can be found below. This documentation is far from complete.

+ [Engine](./jsdoc/engine/index.html)
+ [Associated tools](./jsdoc/tools/index.html)

## Using the library

The library has been designed to facilitate incorporation into a project as a 
[Git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules). The build tools assume that if included as a
submodule, the default name, `hcje-css-js-engine`, will have been used and it will have been added to the root. So the 
structure for your files is expected to be:

```
myProject
    + source
        + index.html
        + other source files and required folders
    + hcje-css-js-engine
        + all the hcje files
```

When incorporating the hcje library, it should be referenced in the main `index.html` file as follows:

```
<link rel='stylesheet' href='../html-css-js-engine/source/hcje/styles/style.css'>
...
<script type = 'module' src='../html-css-js-engine/source/hcje/scripts/hcje-lib.js'></script>
```
These commands allow the css and js files to be accessed from the index.html in the project's source folder. However,
this is not appropriate for the build. As such, the build tools will flatten the engine folder and modify the link and
script lines above. The resulting output will be:

```
outputFolder
  + index.html
  + other source files and required folders
  + _hcje
```

```
<link rel='stylesheet' href='_hcje/styles/style.css'>
...
<script type = 'module' src='_hcje/scripts/hcje-lib.js'></script>
```

### Using the tools via package.json

To utilise the build tools when the engine has been incorporated as a submodule, the following scripts can be used.
The `prebuild`, `postbuild` and `document` scripts assume [JSDoc](https://jsdoc.app/) has been installed, but those
scripts are not required for the build. The build output is directed to a folder called `docs` to facilite serving the
resulting build via [GitHub Pages](https://docs.github.com/en/pages).

```
"scripts": {
  "prebuild": "npm run test",
  "build": "node ./html-css-js-engine/tools/build/build.js ./build-config.json",
  "postbuild": "npm run document",
  "document": "jsdoc ./source --destination ./docs/jsdoc -c jsdoc-config.json --readme ./README.md",
  "test": "node ./html-css-js-engine/tools/testing/runner.js test-config.json",
  "serve-build": "node ./html-css-js-engine/tools/server/server.js 8080 docs/game",
  "serve": "node ./html-css-js-engine/tools/server/server.js 8080 ."
},
```

## Test games 

A test game, [Bridge Over Jupiter](./games/index.html) is available to show the engine in use. You can check this out to
investigate the engine further or just to have a bit of fun.
