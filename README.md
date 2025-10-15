# The HTML-CSS-JS Engine (HCJE)

The HCJE is a very simple set of utilities designed to help with the creation of apps that use vanilla JavaScript.
The philosophy behind the engine is to avoid any dependencies on third-party libraries in the developed app.
In addition, the build process, which runs under Node.js, also avoids any additional dependencies, with the exception
of **JSDoc**, which is used to generate the documentation. This philosophy does result in a number of limitations:

+ There is no sophisticated rolling-up or packaging of modules.
+ Compression is limited to the removal of comments.

Despite these limitations, there are some advantages:

+ Testing can be undertaken by serving the source code directly without waiting for any intermediate packaging process.
+ The maintenance of the code does not require ongoing checks for vulnerabilities that may appear over time in external
libraries.


