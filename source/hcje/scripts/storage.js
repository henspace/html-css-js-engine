
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

import * as constants from './constants.js';

/**
 * @module hcje/storage
 * @description
 * Functions for managing localStorage. All keys are prefixed. This is to
 * prevent clashes with other apps on the same domain sharing the same 
 * localStorage.
 */

/** Unique ID added to the key. @type {string} */
let safeId = '';



/**
 * Get the storage prefix. This created from the application's storage
 * prefix and the safeId.
 * @returns {string}
 */
function getKeyPrefix() {
  return `${constants.STORAGE_KEY_PREFIX}_${safeId}`;
}

/**
 * Convert key to a safe key. 
 * @param {string} key
 * @returns {string}
 */ 
function getSafeKey(key) {
  return `${getKeyPrefix()}_${key}`;
}

/**
 * Set storage ID. This is added to the key just after the main prefix.
 *  Non word characters are replaced with an underscore.
 * @param {string} [id = '']
 */
export function setId(id = '') {
  safeId = id.replace(/\W+/g, '_');

  console.debug(`Storage id set to ${safeId}`);
}

/**
 * Set item. Data is automatically stringified.
 * @param {string} key
 * @param {*} value
 */
export function setItem(key, value) {
  return localStorage.setItem(getSafeKey(key), JSON.stringify(value));
}

/**
 * Get item. The data is assumed to be json and is parsed.
 * @param {string} key
 * @returns {*} undefined on error or non-existance.
 */
export function getItem(key) {
  const safeKey = getSafeKey(key);
  try {
    const json = localStorage.getItem(safeKey);
    if (json) {
      return JSON.parse(json);
   }
  } catch (error) {
    localStorage.removeItem(safeKey);
    console.error(`Failed to parse ${safeKey} so item removed: ${error.message}`);
  }
  return undefined;
}

/**
 * Remove item.
 * @param {string} key
 */
export function removeItem(key) {
  return localStorage.removeItem(getSafeKey(key));
}

/**
 * Clear all keys. Note only keys associated with this app are removed.
 */
export function clear() {
  const keyPrefix = getKeyPrefix();
  const appKeys = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key.startsWith(keyPrefix)) {
      appKeys.push(key);
    }
  }

  for (const key of appKeys) {
    localStorage.removeItem(key);
    console.debug(`Removed ${key} from localStorage.`);
  }
}
