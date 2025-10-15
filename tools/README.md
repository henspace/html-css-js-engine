# The HTML-CSS-JS Engine (HCJE) &mdash; Tools

This documentation is for the tools that accompany the HTML-CSS-JS Engine (HCJE). 

The tools section of the HCJE provide scripts for use with Node.js which can help with simple builds and also provide
a server for local testing. These tools are independent of the HCJE itself and can be used with other projects. The
following tools are provided.

In keeping with the philosophy of the HCJE, with the exception of the **jsdoc** package, there are no external
dependencies.

+ build.js: a simple build script that can be used to copy source files to a destination. It does minimal compression,
merely removing comments. It also replaces an number of template variables in files to help with the inclusion of build
data in the source.
+ server.js: a simple web server for test purposes only.
+ runner.js: a very simple test framework.

