# The HTML-CSS-JS Engine (HCJE)

The HCJE is a very simple set of utilities designed to help with the creation of apps that use vanilla JavaScript and
no canvas. It's more an experiment to create a simple framework for games that just use DOM elements rather than
drawing on a canvas.

The philosophy behind the engine is to avoid any dependencies on third-party libraries in the developed app.
In addition, the build process, which runs under Node.js, also avoids any additional dependencies, with the exception
of **JSDoc**, which is used to generate the documentation. This constraint does result in a number of limitations:

+ There is no sophisticated rolling-up or packaging of modules.
+ Compression is limited to the removal of comments.

Despite these limitations, there are some possible advantages:

+ Testing can be undertaken by serving the source code directly without waiting for any intermediate packaging process.
+ The maintenance of the code does not require ongoing checks for vulnerabilities that may appear over time in external
libraries.

## Source code

The source code is open source and available in the GitHub
[html-css-js-engine](https://github.com/henspace/html-css-js-engine) repository.

