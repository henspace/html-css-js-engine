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
 * Listener for use with server.js
 */

import * as fsPromise from 'node:fs/promises';
import * as url from 'node:url';
import * as path from 'node:path';

/**
 * Escape sequences for terminal output. Key/value pairs
 * @type {Object<string, string>}
 */
const Escape = {
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_WHITE: '\x1b[47m',
  FG_BLACK: '\x1b[30m',
  FG_RED: '\x1b[31m',
  FG_WHITE: '\x1b[37m',
  RESET: '\x1b[0m',
};

/**
 * Enumerated status codes.
 * @enum {number}
 */
const StatusCode = {
  OK: 200,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

/**
 * @typedef {Object} HeaderInfo
 * @property {string} name
 * @property {string} value
 */

/**
 * Header keys for arrays of {@link HeaderInfo} objects.
 * @type {Object<string, HeaderInfo[]> }
 */
const HEADERS = {
  css: [{ name: 'Content-Type', value: 'text/css' }],
  csv: [
    { name: 'Content-Type', value: 'text/csv' },
    { name: 'Content-Disposition', value: 'attachment;filename=__filename__' },
  ],
  cur: [{ name: 'Content-Type', value: 'image/x-icon' }],
  gif: [{ name: 'Content-Type', value: 'image/gif' }],
  html: [{ name: 'Content-Type', value: 'text/html' }],
  ico: [{ name: 'Content-Type', value: 'image/x-icon' }],
  jpeg: [{ name: 'Content-Type', value: 'image/jpeg' }],
  jpg: [{ name: 'Content-Type', value: 'image/jpeg' }],
  json: [{ name: 'Content-Type', value: 'application/json' }],
  js: [{ name: 'Content-Type', value: 'text/javascript' }],
  map: [{ name: 'Content-Type', value: 'application/json' }],
  md: [{ name: 'Content-Type', value: 'text/markdown' }],
  mp3: [{ name: 'Content-Type', value: 'audio/mpeg' }],
  mp4: [{ name: 'Content-Type', value: 'video/mp4' }],
  mpeg: [{ name: 'Content-Type', value: 'video/mpeg' }],
  png: [{ name: 'Content-Type', value: 'image/png' }],
  svg: [{ name: 'Content-Type', value: 'image/svg+xml' }],
  ttf: [{ name: 'Content-Type', value: 'font/ttf' }],
  txt: [{ name: 'Content-Type', value: 'text/plain' }],
  woff: [{ name: 'Content-Type', value: 'font/woff' }],
  woff2: [{ name: 'Content-Type', value: 'font/woff2' }],
};

/**
 *
 * @param {*} pathname
 * @returns {HeaderInfo[]}
 */
function getHeadersForPath(pathname) {
  const extension = path.extname(pathname);
  return HEADERS[extension.substring(1).toLowerCase()];
}

/**
 * @typedef {Object} ResponseDetail
 * @property {number} status
 * @property {HeaderInfo[]} headers
 * @property {string | Buffer} content
 */

/**
 * Get response details for a plain text message. This is normally used for
 * 404 or 500 messages.
 * @returns {ResponseDetail}
 */
function getTextResponseDetails(status, message) {
  console.log(
    `${Escape.BG_RED}${Escape.FG_WHITE}Status: ${status}. Message: ${message}${Escape.RESET}`
  );
  return {
    status: status,
    headers: [{ name: 'Content-Type', value: 'text/plain' }],
    content: message,
  };
}

/**
 * Get details for the response.
 * @param {string} root - the root path
 * @param {URL} requestedUrl - the requested path
 * @returns {ResponseDetail}
 */
function getResponseDetail(root, requestedUrl) {
  let detail = {};
  let pathname = decodeURIComponent(requestedUrl.pathname);
  if (pathname === '' || pathname === '/') {
    pathname = 'index.html';
  }
  const fullpath = path.join(root, pathname);
  const relativePath = path.relative(root, fullpath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return Promise.resolve(
      getTextResponseDetails(
        StatusCode.FORBIDDEN,
        `Access to path ${pathname} is forbidden.`
      )
    );
  }
  const filename = path.basename(pathname);
  detail.headers = getHeadersForPath(pathname);
  if (!detail.headers) {
    return Promise.resolve(
      getTextResponseDetails(
        StatusCode.SERVER_ERROR,
        `Filetype for ${filename} is not currently supported by the test server.`
      )
    );
  }
  detail.headers.forEach((header) => {
    header.value.replace('__filename__', filename);
  });

  return fsPromise
    .readFile(fullpath)
    .then((fileContent) => {
      detail.status = StatusCode.OK;
      detail.content = fileContent;
      return detail;
    })
    .catch((error) => {
      return getTextResponseDetails(StatusCode.NOT_FOUND, error.message);
    });
}

/**
 * RequestListener for use by http server.
 */
export class RequestListener {
  #root;
  /**
   * Listener for hander
   * @param {string} root - path from where files are served
   */
  constructor(root) {
    if (!root) {
      throw new Error('No root folder provided');
    }
    this.#root = root;
  }

  /**
   * Get a listener fuction for use with the http server.
   * @returns {function(ClientRequest, ServerResponse)}
   */
  get listener() {
    return (req, res) => {
      const requestedUrl = url.parse(req.url);
      const filename = path.basename(requestedUrl.pathname);
      console.log(
        `Request. path="${requestedUrl.pathname}", filename="${filename}"`
      );
      getResponseDetail(this.#root, requestedUrl).then((detail) => {
        detail.headers.forEach((header) => {
          res.setHeader(header.name, header.value);
        });
        res.writeHead(detail.status);
        res.end(detail.content);
      });
    };
  }
}

