
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
 * @module hcje/utilsTest
 * @description
 * Test module for the utils.
 */

import * as utils from './utils.js';

/**
 * Class for checking a collection numbers.
 */
class NumberCollection {
  /** @type {boolean} */
  #allIntegers;
  /** @type {number} */
  #min;
  /** @type {number} */
  #max;
  /**
   * Construct the collection.
   */
  constructor(initialValues) {
    this.#allIntegers = true;
    this.#min = Number.MAX_VALUE;
    this.#max = Number.MIN_VALUE;
  }

  /**
   * Create a collection from an array.
   * @returns {module:hcje/utilsTest.NumberCollection}
   */
  static createFromArray(values) {
    const collection = new NumberCollection();
    for (const num of values) {
      collection.add(num);
    }
    return collection;
  }
  /**
   * All integers
   * @type {boolean}
   * @readonly
   */
  get allIntegers() {
    return this.#allIntegers;
  }
  
  /**
   * Maximum value
   * @type {number}
   * @readonly
   */
  get max() {
    return this.#max;
  }

  /**
   * Minimum value
   * @type {number}
   * @readonly
   */
  get min() {
    return this.#min;
  }

  /** 
   * Add a number to the collection.
   * @param {number}
   */
  add(num) {
    if (!Number.isInteger(num)) {
      this.#allIntegers = false;
    }
    this.#min = Math.min(this.#min, num);
    this.#max = Math.max(this.#max, num);
  }

  /**
   * Compare collection. The number of entries is not compared.
   * @throws {Error} Thrown if comparison fails.
   * @param {module:hcje/utilsTest.NumberCollection} expected - expected value to compare against.
   * @param {number} [dp = 1] - number of decimal places for comparison.
   */
  compareMinMax(expected, dp = 1) {
    let errMessage = '';
    if (this.min.toFixed(1) !== expected.min.toFixed(1)) {
      errMessage += `Minimum ${this.min} does not match expected ${expected.min} to ${dp} decimal places. `;
    }
    if (this.max.toFixed(1) !== expected.max.toFixed(1)) {
      errMessage += `Maximum ${this.max} does not match expected ${expected.max} to ${dp} decimal place.`;
    }
    if (errMessage) {
      throw new Error(errMessage);
    }
  }

}

export const tests = [
  {
    description: 'parseInt() - normal float to int',
    run: () => utils.parseInt('4.5'),
    expected: 4,
    compare: '===',
  },
  {
    description: 'parseInt() - invalid int returns default',
    run: () => utils.parseInt('four point five', 4),
    expected: 4,
    compare: '===',
  },
  {
    description: 'getRandomNumberBetween()',
    run: () => {
      const collection = new NumberCollection();
      for (let n = 0; n < 2000; n++) {
        collection.add(utils.getRandomNumberBetween(3, 10));
      }
      return collection;
    },
    expected: NumberCollection.createFromArray([3, 10]),
    check: (result) => {
      if (result.allIntegers) {
        throw new Error('Results were all integers but they should be floating point values.');
      }
    },
    compare: (result, expected) => result.compareMinMax(expected)
  },
  {
    description: 'getRandomIntExclusive()',
    run: () => {
      const collection = new NumberCollection();
      for (let n = 0; n < 2000; n++) {
        collection.add(utils.getRandomIntExclusive(3, 10));
      }
      return collection;
    },
    expected: NumberCollection.createFromArray([3, 9]),
    check: (result) => {
      if (!result.allIntegers) {
        throw new Error('Results were not all integers.');
      }
    },
    compare: (result, expected) => result.compareMinMax(expected)
  },
  {
    description: 'getRandomIntInclusive()',
    run: () => {
      const collection = new NumberCollection();
      for (let n = 0; n < 2000; n++) {
        collection.add(utils.getRandomIntInclusive(3, 10));
      }
      return collection;
    },
    expected: NumberCollection.createFromArray([3, 10]),
    check: (result) => {
      if (!result.allIntegers) {
        throw new Error('Results were not all integers.');
      }
    },
    compare: (result, expected) => result.compareMinMax(expected)
  },
  {
    description: 'rollDice() - default to six sided',
    run: () => {
      const collection = new NumberCollection();
      for (let n = 0; n < 2000; n++) {
        collection.add(utils.rollDice());
      }
      return collection;
    },
    expected: NumberCollection.createFromArray([1, 2, 3, 4, 5, 6]),
    check: (result) => {
      if (!result.allIntegers) {
        throw new Error('Results were not all integers.');
      }
    },
    compare: (result, expected) => result.compareMinMax(expected)
  },
  {
    description: 'rollDice(20)',
    run: () => {
      const collection = new NumberCollection();
      for (let n = 0; n < 2000; n++) {
        collection.add(utils.rollDice(20));
      }
      return collection;
    },
    expected: NumberCollection.createFromArray([1, 20]),
    check: (result) => {
      if (!result.allIntegers) {
        throw new Error('Results were not all integers.');
      }
    },
    compare: (result, expected) => result.compareMinMax(expected)
  },
  {
    description: 'tossCoin()',
    run: () => {
      if (typeof utils.tossCoin() !== 'boolean') {
        throw new Error('The tossCoin function did not return a boolean value.');
      } 
      const collection = new NumberCollection();
      for (let n = 0; n < 2000; n++) {
        collection.add(utils.tossCoin() ? 0 : 1);
      }
      return collection;
    },
    expected: NumberCollection.createFromArray([0, 1]),
    compare: (result, expected) => result.compareMinMax(expected)
  },
  {
    description: 'getRandomMember()',
    run: () => {
      const values = [];
      const source = ['one', 'two', 'three'];
      for (let n = 0; n < 100; n++) {
        values.push(utils.getRandomMember(source));
      }
      return {values, source}
    },
    check: (result) => {
      for (const sourceMember of result.source) {
        if (!result.values.includes(sourceMember)) {
          throw new Error(`Results did not include ${sourceMember} from the array.`);
        }
      }
    }
  },
  {
    description: 'greatestCommonDivisor()',
    run: () => utils.greatestCommonDivisor(11 * 37, 11 * 29),
    expected: 11,
    compare: '==='
  },
  {
    description: 'lowestCommonMultiple()',
    run: () => utils.lowestCommonMultiple(11, 29),
    expected: 11 * 29,
    compare: '==='
  },
  {
    description: 'lowestCommonMultipleOfArray()',
    run: () => utils.lowestCommonMultipleOfArray([3, 4, 5, 8]),
    expected: 3 * 5 * 8,
    compare: '==='
  },
  {
    description: 'jitter()',
    run: () => {
      const collection = new NumberCollection();
      for (let n = 0; n < 2000; n++) {
        collection.add(utils.jitter(6, 0.5));
      }
      return collection;
    },
    expected: NumberCollection.createFromArray([6 * .5, 6 * 1.5]),
    check: (result) => {
      if (result.allIntegers) {
        throw new Error('Result were all integers but they should be floating point values.');
      }
    },
    compare: (result, expected) => result.compareMinMax(expected)
  },
  { 
    description: 'clamp() - within bounds',
    run: () => utils.clamp(32, 21, 65),
    expected: 32,
    compare: '==='
  },
  { 
    description: 'clamp() - below bounds',
    run: () => utils.clamp(11, 21, 65),
    expected: 21,
    compare: '==='
  },
  { 
    description: 'clamp() - above bounds',
    run: () => utils.clamp(69, 21, 65),
    expected: 65,
    compare: '==='
  },
  {
    description: 'sleep()',
    run: () => {
      const startTime = Date.now();
      const sleepTime = 200;
      return utils.sleep(sleepTime)
       .then(() => Date.now() - startTime);
    },
    expected: 200,
    compare: (result, expected) => {
      if (Math.abs(result - expected) > 20) {
        throw new Error(`Slept ${result} ms but expected ${expected} ms. Difference exceeds 20 ms`);
      }
    }
  },
  {
    description: 'Waiter wait() and end()',
    run: () => {
      const waiter = utils.createWaiter();
      const preWaitTime = 100;
      const waitTime = 200;
      return utils.sleep(preWaitTime)
        .then(() => {
          const startTime = Date.now();
          setTimeout(() => waiter.end(Date.now() - startTime), waitTime);
          return waiter.wait();
        });
    },
    expected: 200,
    compare: (result, expected) => {
      if (Math.abs(result - expected) > 20) {
        throw new Error(`Slept ${result} ms but expected ${expected} ms. Difference exceeds 20 ms`);
      }
    }
  },
  {
    description: 'shuffle()',
    run: () => {
      const source = [1, 2, 3, 4, 5];
      return {
        source,
        shuffled: utils.shuffle([...source])
      }
    },
    check: (result) => {
      if (result.source.length !== result.shuffled.length) {
        throw new Error(`Shuffled array length ${result.shuffled.length} does not match source length ${result.source.length}`);
      }
      for (let n = 0; n < result.source.length; n++) {
        const index = result.shuffled.indexOf(result.source[n]);
        if (index < 0) {
          throw new Error(`Element at original index ${n} does not appear in shuffled array`);
        }
        if (n === index) {
          throw new Error(`Element at original index ${n} is in the same position in shuffled array`);
        }
      }
    }
  }
];


