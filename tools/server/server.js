/**
 * MIT license
 * Copyright © 2025 Steve Butler (henspace.com)
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the “Software”),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/**
 * @module hcjeTools/server/server
 * @description
 * Simple test server.
 *
 * This module is intended to be run as node script.
 *
 * Usage:
 * + server port folder [subfolder]
 *     + port: only ports 8080 or 8008 are accepted
 *     + folder: root folder from which files are served. Note that files can only be served from directories within
 *     the script's current working directory.
 *     + subfolder: optional subfolder. If provided, files are served from **folder/subfolder**
 */

import * as  http from 'http';
import * as path from 'node:path';
import { existsSync, lstatSync } from 'node:fs';
import { createRequestListener } from './request-listener.js';






if (process.argv.length < 4 || process.argv.length > 5) {
  throw new Error('Incorrect arguments.\nUsage server port folder [subfolder]');
}

/** 
 * Host @type{string}
 * @private
 */
const HOST = '127.0.0.1';
/** 
 * Port @type{string|number}
 * @private
 */
const PORT = process.argv[2];

if (!/^(?:8080|8008)$/.test(PORT)) {
  throw new Error(`Only ports 8008 and 8080 supported. Cannot serve on ${PORT}`);
}


/** 
 * Folder used to form the root folder from which files are served. @type{string}
 * @private
 */
const FOLDER  = process.argv[3];
/** 
 * Optional subfolder within the FOLDER @type{string}
 * @private
 */
const SUBFOLDER = process.argv[4] ?? '';
/** 
 * Root folder which is formed as FOLDER/SUBFOLDER @type{string}
 * @private
 */
const ROOT = path.join(process.cwd(), FOLDER, SUBFOLDER);
/** 
 * Path to the root folder relative to the current working directory @type{string}
 * @private
 */
const relativePath = path.relative(process.cwd(), ROOT);

/* Ensure that files outside the current working directory are not served. */
if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
  throw new Error(
    `The test server can only serve files from within the current working folder.`
  );
}

if (!existsSync(ROOT)) {
  throw new Error(`The root folder ${ROOT} does not exist.`);
}

if (!lstatSync(ROOT).isDirectory()) {
  throw new Error(`The root ${ROOT} is not a folder.`);
}

/**
 * The server's request listener. @type{module:hcjeTools/server/request_listener~RequestListener}
 * @private
 */
const reqListener = createRequestListener(ROOT);

http.createServer(reqListener).listen(PORT, HOST, () => {
  console.log(
    `Server running on http://${HOST}:${PORT}.\nServing from ${ROOT}`
  );
});
