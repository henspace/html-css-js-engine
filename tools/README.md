# The HTML-CSS-JS Engine (HCJE) &mdash; Tools

This documentation is for the tools that accompany the HTML-CSS-JS Engine (HCJE). 
In keeping with the philosophy of the HCJE, with the exception of the **JSDdoc** package, there are no external
dependencies.

The tools section of the HCJE provides scripts for use with Node.js which can help with simple builds. A simple server
is also provided for local testing. 

These tools are independent of the HCJE itself and can be used with other projects. They
are intended to be run via npm scripts. The following tools are provided:


+ [build.js]{@link module:hcjeTools/build/build}: a simple build script that can be used to copy source files to a destination. It does minimal compression,
merely removing comments. It also replaces an number of template variables in files to help with the inclusion of build
data in the source.
+ [server.js]{@link module:hcjeTools/server/server}: a simple web server for test purposes only.
+ [runner.js]{@link module:hcjeTools/testing/runner}: a very simple test script.

