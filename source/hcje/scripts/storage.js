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
 * @module hcje/storage
 * @description
 * Functions for managing [localStorage]{@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage}.
 *
 * All keys in the storage are prefixed to prevent clashes with other apps on the same domain. 
 *
 * The keys used for storing items are created as follows:
 *
 * + **storageKeyPrefix_variantId_itemKey**
 */

/** Unique ID added to the key. This is typically used for variants of a game and is used along with the
 * [storageKeyPrefix]{@link module:hcje/storage~storageKeyPrefix} to create the full prefix for all stored items.
 * @type {string}
 * @private*/
let variantId = '';

/** Storage prefix. This should be unique for the game. 
 * @type {string}
 * @private
 */
let storageKeyPrefix;


/**
 * Get the storage prefix. This created from the [storageKeyPrefix]{@link module:hcje/storage~storageKeyPrefix} and
 * [variantId]{@link module:hcje/storage~variantId}.
 * @returns {string}
 * @throws {Error} if [storageKeyPrefix]{@link module:hcje/storage~storageKeyPrefix} has not been set.
 * @private
 */
function getKeyPrefix() {
  if (!storageKeyPrefix) {
    throw new Error('The storageKeyPrefix has not been set. Check module hcje/storage, setStorageKeyPrefix()');
  }
  return `${storageKeyPrefix}_${variantId}`;
}

/**
 * Convert item key to the full storage key. 
 * @param {string} itemKey - Specific item key. This is not modified but is added as a suffix to application's
 * key prefix.
 * @see module:hcje/storage~getKeyPrefix
 * @returns {string}
 * @private
 */ 
function getFullKey(itemKey) {
  return `${getKeyPrefix()}_${itemKey}`;
}


/**
 * Set the primary storage prefix. All keys begin with this prefix. Non-word characters are replaced with an underscore.
 * This function must be called prior to using the storage or an exception will be thrown when attempts are made to 
 * access the storage.
 * @param {string} prefix - Prefix for keys. 
 */
export function setStorageKeyPrefix(prefix) {
  storageKeyPrefix = prefix.replace(/\W+/g, '_');
  console.debug(`Storage key prefix set to "${storageKeyPrefix}"`);
}

/**
 * Set the variant ID. This is added to the key just after the primary storage prefix.
 * Non word characters are replaced with an underscore.
 * @param {string} [id = ''] - Variant id.
 */
export function setVariantId(id = '') {
  variantId = id.replace(/\W+/g, '_');

  console.debug(`Storage variant id set to ${variantId}`);
}

/**
 * Store an item.
 * @param {string} key - Item key. NB this will be modified before storage by prefixing with the primary storage key
 * prefix and  variant ID; see [setStorageKeyPrefix]{@link module:hcje/storage.setStorageKeyPrefix} and 
 * [setVariantId]{@link module:hcje/storage.setVariantId}.
 * @param {*} value - Value to store. This is stringified before storage.
 */
export function setItem(key, value) {
  return localStorage.setItem(getFullKey(key), JSON.stringify(value));
}

/**
 * Get item from localStorage. The data is assumed to be json and is parsed prior to returning.
 * If the value cannot be parsed, it is removed from storage.
 * @param {string} key - Item key. NB this will be modified before storage by prefixing with the primary storage key
 * prefix and  variant ID; see [setStorageKeyPrefix]{@link module:hcje/storage.setStorageKeyPrefix} and 
 * [setVariantId]{@link module:hcje/storage.setVariantId}.
 * @returns {*} Undefined on error or non-existence.
 */
export function getItem(key) {
  const safeKey = getFullKey(key);
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
 * Remove item from local storage.
 * @param {string} key - Item key. NB this will be modified before storage by prefixing with the primary storage key
 * prefix and  variant ID; see [setStorageKeyPrefix]{@link module:hcje/storage.setStorageKeyPrefix} and 
 * [setVariantId]{@link module:hcje/storage.setVariantId}.
 */
export function removeItem(key) {
  return localStorage.removeItem(getFullKey(key));
}

/**
 * Clear all storage associated with this application. Note only keys associated with this app are removed.
 * That is keys that begin with the current storage key prefix and variant id; see 
 * [setStorageKeyPrefix]{@link module:hcje/storage.setStorageKeyPrefix} and 
 * [setVariantId]{@link module:hcje/storage.setVariantId}.
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
