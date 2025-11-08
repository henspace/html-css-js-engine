
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
 * @module hcje/storage.test
 * @description
 * Test the storage module.
 */
import * as storage from './storage.js';

/**
 * Mock storage class.
 * @implements Storage
 */
class MockLocalStorage {
  /** local store @type{Map<string, string>} */
  #store;
  
  /**
   * Construct mock local storage.
   */
  constructor() {
    this.#store = new Map();
  }

  /** 
   * Validate value.
   * @throws {Error} if not a string.
   */ 
  #validateValue(value) {
    if (typeof value !== 'string') {
      throw new Error(`Local storage value is not a string. Received ${value}`);
    }
  }
  /** 
   * Validate key.
   * @throws {Error} if not a string.
   */ 
  #validateKey(key) {
    if (typeof key !== 'string') {
      throw new Error(`Local storage key is not a string. Received ${key}`);
    }
  }

  /**
   * Clear all items.
   */
  clear() {
    this.#store.clear();
  }

  /**
   * Length property
   * @returns {number}
   */
  get length() {
    return this.#store.size;
  }

  /**
   * Get item
   * @param {string} key
   */
  getItem(key) {
    this.#validateKey(key);
    console.log(`Mock storage get ${key}`);
    return this.#store.get(key); 
  }

  /** 
   * Get key at index.
   * @param {string} index
   * @returns {string}
   */
  key(index) {
    const keys = Array.from(this.#store.keys());
    return keys[index];
  }
  
  /**
   * Remove an item.
   * @param {string} key
   */
  removeItem(key) {
    this.#validateKey(key);
    this.#store.delete(key);
    console.log(`Mock storage remove ${key}`);
  }
  
  /**
   * Set item value
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    this.#validateKey(key);
    this.#validateValue(value);
    this.#store.set(key, value);
    console.log(`Mock storage set ${key} to ${value}`);
  }

}


/**
 * Function to run before testing.
 * @see {module:hcje/testing/runner~TestModule}
 **/
export function beforeModuleTests() {
  console.log('Running beforeModuleTests function.');
}
/**
 * Function to run before each test.
 * @see {module:hcje/testing/runner~TestModule}
 **/
export function beforeEachTest() {
  console.log('Running beforeEachTest function.');
  global.localStorage = new MockLocalStorage();
}

/**
 * Function to run after each test.
 * @see {module:hcje/testing/runner~TestModule}
 **/
export function afterEachTest() {
  console.log('Running afterEachTest function.');
}
/**
 * Function to run before testing.
 * @see {module:hcje/testing/runner~TestModule}
 **/
export function afterModuleTests() {
  console.log('Running afterModuleTests function.');
  global.localStorage = undefined;
}

/** Test value @type{Object} */
const itemValue =  {item1: 99, item2: 'test'};

/** Tests to run.  * @type {Array<module:hcje/utils~TestDefinition>} */
export const tests = [
  {
    description: 'Exception thrown if no storage key set',
    run: () => {
      global.localStorag
      return storage.getItem('TEST_VALUE');
    },
    expected: /storageKeyPrefix has not been set/,
    compare: 'exception',
  },
  {
    description: 'setStorageKeyPrefix() and setItem()',
    run: () => {
      const key = 'TESTING KEY';
      const itemName = 'ITEM NAME';
      storage.setStorageKeyPrefix('TESTING KEY');
      const expectedKey = `TESTING_KEY__ITEM NAME`;
      storage.setItem(itemName, itemValue);
      return localStorage.getItem(expectedKey);
    },
    expected: JSON.stringify(itemValue),
    compare: '===',
  },
  {
    description: 'setVariantId()',
    run: () => {
      const key = 'TESTING KEY';
      const id = 'TEST ID';
      const itemName = 'ITEM NAME';
      storage.setStorageKeyPrefix('TESTING KEY');
      storage.setVariantId(id);
      const expectedKey = `TESTING_KEY_TEST_ID_ITEM NAME`;
      storage.setItem(itemName, itemValue);
      return localStorage.getItem(expectedKey);
    },
    expected: JSON.stringify(itemValue),
    compare: '===',
  },
  {
    description: 'getItem()',
    run: () => {
      const key = 'TESTING KEY';
      const id = 'TEST ID';
      const itemName = 'ITEM NAME';
      storage.setStorageKeyPrefix('TESTING KEY');
      storage.setVariantId(id);
      const expectedKey = `TESTING_KEY_TEST_ID_ITEM NAME`;
      localStorage.setItem(expectedKey, JSON.stringify(itemValue));
      return storage.getItem(itemName);
    },
    expected: itemValue,
    compare: 'equivalent',
  },
  {
    description: 'removeItem()',
    run: () => {
      const key = 'TESTING KEY';
      const id = 'TEST ID';
      storage.setStorageKeyPrefix('TESTING KEY');
      storage.setVariantId(id);
      const expectedKey = `TESTING_KEY_TEST_ID_ITEM NAME`;
      storage.setItem('ItemToLeaveAlone', 'ItemToLeaveAloneValue');
      storage.setItem('ItemToRemove', 'ItemToRemoveValue');
      return storage.removeItem('ItemToRemove');
    },
    expected: JSON.stringify(itemValue),
    compare: () => {
      if (storage.getItem('ItemToRemove')) {
        throw new Error(`ItemToRemove still exists`);
      }
      if (storage.getItem('ItemToLeaveAlone') !== 'ItemToLeaveAloneValue') {
        throw new Error(`ItemToLeaveAlone corrupted`);
      }
      if (localStorage.length !== 1) {
        throw new Error(`Only expected 1 item left in localStorage`);
      }
    },
  },
  {
    description: 'clear()',
    run: () => {
      const key = 'TESTING KEY';
      const id = 'TEST ID';
      storage.setStorageKeyPrefix('TESTING KEY');
      storage.setVariantId(id);
      const expectedKey = `TESTING_KEY_TEST_ID_ITEM NAME`;
      localStorage.setItem('ItemToLeaveAlone', 'ItemToLeaveAloneValue');
      storage.setItem('ItemToRemove', 'ItemToRemoveValue');
      storage.setItem('ItemToRemove2', 'ItemToRemoveValue2');
      return storage.clear();
    },
    expected: JSON.stringify(itemValue),
    compare: () => {
      if (storage.getItem('ItemToRemove')) {
        throw new Error(`ItemToRemove still exists`);
      }
      if (storage.getItem('ItemToRemove2')) {
        throw new Error(`ItemToRemove2 still exists`);
      }
      if (localStorage.getItem('ItemToLeaveAlone') !== 'ItemToLeaveAloneValue') {
        throw new Error(`ItemToLeaveAlone corrupted`);
      }
    },
  },
]




