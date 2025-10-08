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
 * @name "server.js"
 * @global
 * @description
 * Simple test server.
 * Usage server folder [port]
 */

/*global process */
import * as  http from 'http';
import * as path from 'node:path';
import { existsSync, lstatSync } from 'node:fs';
import { RequestListener } from './request_listener.js';

if (process.argv.length < 4 || process.argv.length > 5) {
  throw new Error('Incorrect arguments.\nUsage server port folder [subfolder]');
}

const HOST = '127.0.0.1';
const PORT = process.argv[2];

if (!/^(?:8080|8008)$/.test(PORT)) {
  throw new Error(`Only ports 8008 and 8080 supported. Cannot serve on ${PORT}`);
}

const FOLDER  = process.argv[3];
const SUBFOLDER = process.argv[4] ?? '';
const ROOT = path.join(process.cwd(), FOLDER, SUBFOLDER);
const relativePath = path.relative(process.cwd(), ROOT);

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

const reqListener = new RequestListener(ROOT);

http.createServer(reqListener.listener).listen(PORT, HOST, () => {
  console.log(
    `Server running on http://${HOST}:${PORT}.\nServing from ${ROOT}`
  );
});
