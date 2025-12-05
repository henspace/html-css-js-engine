/**
 * @license MIT
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
 * @module hcje/build-constants
 * @description
 * Data that is added by the build script.
 */

/** @type {Object}
 * @property {string} author - Author taken from package.json.
 * @property {string} buildDateIso - Date of the build.
 * @property {string} buildId - ID based upon the date and time of the build.
 * @property {string} buildYear - Four digit year of the build.
 * @property {string} description - Description taken from package.json.
 * @property {string} licence - Licence taken from package.json.
 * @property {string} name - Name of the app taken from package.json.
 * @property {string} version - Version taken from package.json.
 * @readonly
 */
export const BUILD_DATA = {
  author: '%%_AUTHOR_%%',
  buildDateIso: '%%_BUILD_DATE_ISO_%%',
  buildId: '%%_BUILD_ID_%%',
  buildYear: '%%_BUILD_YEAR_%%',
  description: '%%_DESCRIPTION_%%',
  licence: '%%_LICENCE_%%',
  name: '%%_NAME_%%',
  version: '%%_VERSION_%%',
}

