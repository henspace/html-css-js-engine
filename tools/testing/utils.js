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
 * @module tools/testing/utils
 * @description
 * Very simple tools for unit testing. These are used by {@link module:tools/testing/runner} to test JavaScript files.
 *
 * The module is written so that test scripts do not need to import the module. Importing is handled by the
 * {@link module:tools/testing/runner} script.
 *
 */


/**
 * Run test function ensuring result is a promise
 * @param {function()} fn - the function to run.
 * @returns {Promise}
 */
function runAsPromise(fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result;
    } else {
      return Promise.resolve(result);
    }
  } catch(error) {
    return Promise.reject(error);
  }
}

/**
 * Function used for running tests.
 * @function module:tools/testing/utils~RunTest
 * @returns {*|Promise} the result. 
 */

/**
 * Function used for comparing the results from {@link module:tools/testing/utils~RunTest} against an expected result.
 * @function module:tools/testing/utils~Compare
 * @param {*} result - the actual result
 * @param {*} expected - the expected result
 * @throws {Error} on failure.
 */

/**
 * Throw error using standardised message format.
 * @param {string} message - start of message which will be followed by the received and expected values.
 * @param {*} received - value received as result of test.
 * @param {*} expected - expected value.
 * @throws {Error}
 * @private
 */
function throwFailure(message, received, expected) {
  throw new Error(`${message}\nReceived: ${received}\nExpected: ${expected}`);
}

/**
 * Test if the result matches a regex.
 * @param {*} result - result to test. This is coerced to a string.
 * @param {RegExp} testRegex - test regex
 * @throws {Error} on test failure.
 * @private
 */
function match(result, testRegex) {
  if (!(testRegex instanceof RegExp)) {
    throw new Error('This comparision requires a regular expression as the expected result.');
  }
  if (!testRegex.test(String(result))) {
    throwFailure('Result does not match regex!', result, testRegex);
  }
} 

/**
 * Test if result and error are equal.
 * @param {Error} result
 * @param {Error} expected
 * @return {Promise} fulfils to undefined if equal. Rejects if the result and expected are not regarded as equal.
 * @see module:tools/testing/utils~Compare
 * @private
 */

export function areEqual(result, expected) {
  if (result != expected) {
    throwFailure('Result != expected!', result, expected);
  }
}

/**
 * Test if result and error strictly equal.
 * @param {Error} result
 * @param {Error} expected
 * @return {Promise} Fulfils to undefined if equal. Rejects if the result and expected are not regarded as equal.
 * @see module:tools/testing/utils~Compare
 * @private
 */

export function areStrictlyEqual(result, expected) {
  if (result !== expected) {
    throwFailure('Result !== expected!', result, expected);
  }
}

/**
 * Test if result and error equivalent. The test is done by stringify both and then comparing.
 * @param {Error} result
 * @param {Error} expected
 * @return {Promise} Fulfils to undefined if equal. Rejects if the result and expected are not regarded as equal.
 * @see module:tools/testing/utils~Compare
 * @private
 */

export function areEquivalent(result, expected) {
  return areEqual(JSON.stringify(result), JSON.stringify(expected));
}

/**
 * @typedef {Object} TestDefinition
 * @property {module:tools/testing/utils~RunTest} run - the test function to run. This should return the result or a promise that
 * fulfils to the result;
 * @property {*} expected - the expected result. If this is an Error object, an exception is expected and 
 * the exception error message is checked against the incoming message.
 * @property {module:tools/testing/utils~Compare|string} compare - function to run to compare the result. If a string is provided
 * it is used as a lookup into the standard comparisons:
 * + "equivalent": both the expected and result values are converted using `JSON.stringify` and then an an exception is expected to be thrown. A "match" test described below is then used.
 * + "exception": an exception is expected to be thrown. A "match" test described below is then used.
 * + "match": the expected result should be a RegExp. The result is coerced into a string and then a simple equality 
 * test used as the comparison.
 * `expected.test(result)` used as the comparison.
 * + "==": a simple equality test is used.
 * + "===": a strict equality test is used.
 */

/**
 * Encapsulation of the result of running a test.
 * @typedef {Object} TestResult
 * @property {string} description - test description
 * @property {*} result - the result of the test. This will be undefined if test failed.
 * @property {Error} error - error if test failed. This will be undefined if test passed.
 */ 



/**
 * Map of comparisons @type{Map<string,module:tools/testing/utils~Compare>}
 * @private
 */ 
const CompareFunctions = new Map([
  ['match', match],
  ['==', areEqual],
  ['===', areStrictlyEqual],
  ['exception', match],
  ['equivalent', areEquivalent],
]);

/**
 * Get the compare function. If the value parameter is a function, it is just 
 * returned as the compare function.
 * @param {string|function} [value] - the name of the function. If not provided simple == test is applied.
 * @returns {module:tools/testing/utils~Compare}
 * @throws {Error} if value is not a valid comparison value.
 * @private
 */
function getCompareFunction(value) {
  if (!value) {
    return areEqual;
  } else if (typeof value === 'function') {
    return value;
  } else {
    const fn = CompareFunctions.get(value);
    if (fn) {
      return fn;
    } 
  }
  throw new Error(`Compare function "${value}" does not exist.`);
}

/** 
 * Run a test.
 * @param {string} moduleName - name of the module under test.
 * @param {module:tools/testing/utils~TestDefinition} definition - details of the test.
 * @returns {module:tools/testing/utils~TestResult}
 */ 
export function it(moduleName, definition) {
  let testResult = {
    description: `${moduleName}: ${definition.description}`,
  };
  const compare = getCompareFunction(definition.compare);
  console.log(`Run it: ${definition.description}`);
  return runAsPromise(definition.run)
    .then((result) => {
      compare(result, definition.expected);
      testResult.result = result;
      return testResult;
    })
    .catch((error) => {
      if (definition.compare === 'exception') {
        compare(error, definition.expected);
        testResult.result = error;
        return testResult;
      } else {
        testResult.error = error;
        return testResult;
      }
    })
    .catch((error) => {
      testResult.error = error;
      return testResult;
    });
        
}


