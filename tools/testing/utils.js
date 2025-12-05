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
 * @module hcjeTools/testing/utils
 * @description
 * Very simple tools for unit testing. These are used by {@link module:hcjeTools/testing/runner} to test JavaScript files.
 * The module is used soley by the [runner.js]{@link module:hcjeTools/testing/runner} script and there is no need to
 * import it or call its methods directly from any test script.
 */


/**
 * Run test function ensuring result is a promise
 * @param {function()} fn - The function to run.
 * @returns {Promise}
 * @private
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
 * Throw error using standardised message format.
 * @param {string} message - Start of message which will be followed by the received and expected values.
 * @param {*} received - Value received as result of test.
 * @param {*} expected - Expected value.
 * @throws {Error}
 * @private
 */
function throwFailure(message, received, expected) {
  throw new Error(`${message}\n\n+ Received: ${received}\n+ Expected: ${expected}`);
}

/**
 * Test if the result matches a regex.
 * There is normally no need to use this method directly as it is automatically invoked by the 
 *   [runner]{@link module:hcjeTools/testing/runner} script by setting an appropriate value for the compare property 
 *   in the [TestDefinition]{@link module:hcjeTools/testing/runner~TestDefinition}.
 * @param {*} result - Result to test. This is coerced to a string.
 * @param {RegExp} testRegex - Test regex
 * @throws {Error} Error thrown on test failure.
 */
export function match(result, testRegex) {
  if (!(testRegex instanceof RegExp)) {
    throw new Error('This comparision requires a regular expression as the expected result.');
  }
  if (!testRegex.test(String(result))) {
    throwFailure('Result does not match regex!', result, testRegex);
  }
} 

/**
 * Test if result and error are equal.
 * There is normally no need to use this method directly as it is automatically invoked by the 
 *   [runner]{@link module:hcjeTools/testing/runner} script by setting an appropriate value for the compare property 
 *   in the [TestDefinition]{@link module:hcjeTools/testing/runner~TestDefinition}.
 * @param {Error} result - The actual result.
 * @param {Error} expected - The expected result
 * @throws {Error} Throws error if the result and expected are not regarded as equal.
 * @see module:hcjeTools/testing/utils~compare
 */

export function areEqual(result, expected) {
  if (result != expected) {
    throwFailure('Result != expected!', result, expected);
  }
}

/**
 * Test if result and error are equal to a defined number of decimal places.
 * There is normally no need to use this method directly as it is automatically invoked by the 
 *   [runner]{@link module:hcjeTools/testing/runner} script by setting an appropriate value for the compare property 
 *   in the [TestDefinition]{@link module:hcjeTools/testing/runner~TestDefinition}.
 * @param {Error} result - The actual result.
 * @param {Error} expected - The expected result
 * @param {number} - The number of decimal places.
 * @throws {Error} Throws error if the result and expected are not equal when fixed to the specified number of decimal
 * places.
 * @see module:hcjeTools/testing/utils~compare
 */

export function areEqualToDp(result, expected, decimalPlaces) {
  if (result.toFixed(dp) !== expected.toFixed(dp)) {
    throwFailure(`Result !== expected! to ${dp} decimal places.`, result, expected);
  }
}

/**
 * Test if result and error strictly equal.
 * There is normally no need to use this method directly as it is automatically invoked by the 
 *   [runner]{@link module:hcjeTools/testing/runner} script by setting an appropriate value for the compare property 
 *   in the [TestDefinition]{@link module:hcjeTools/testing/runner~TestDefinition}.
 * @param {Error} result
 * @param {Error} expected
 * @throws {Error} Throws error if the result and expected are not regarded as equal.
 * @see module:hcjeTools/testing/utils~compare
 */

export function areStrictlyEqual(result, expected) {
  if (result !== expected) {
    throwFailure('Result !== expected!', result, expected);
  }
}

/**
 * Test if result and error equivalent. The test is done by stringify both and then comparing.
 * There is normally no need to use this method directly as it is automatically invoked by the 
 *   [runner]{@link module:hcjeTools/testing/runner} script by setting an appropriate value for the compare property 
 *   in the [TestDefinition]{@link module:hcjeTools/testing/runner~TestDefinition}.
 * @param {Error} result
 * @param {Error} expected
 * @throws {Error} Throws error if the result and expected are not regarded as equal.
 * @see module:hcjeTools/testing/utils~compare
 */

export function areEquivalent(result, expected) {
  return areEqual(JSON.stringify(result), JSON.stringify(expected));
}




/**
 * Map of comparisons @type{Map<string,module:hcjeTools/testing/utils~compare>}
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
 * @param {string|module:hcjeTools/testing/utils~compare} [value] - A  comparision function or the name of a built-in 
 * function. If not provided simple == test is applied. 
 * @returns {module:hcjeTools/testing/utils~compare}
 * @throws {Error} if value is not a valid comparison value.
 * @private
 */
function getCompareFunction(value) {
  if (!value) {
    return areEqual;
  }
  if (typeof value === 'string') {
    const match = value.match(/^={1,3}(\d+)dp$/i);
    if (match) {
      return (result, expected) => areEqualToDp(result, expected, match[1]);
    }
  }
  if (typeof value === 'function') {
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
 * There is normally no need to use this method directly as it is automatically invoked by the 
 *   [runner]{@link module:hcjeTools/testing/runner} script.
 * @param {string} moduleName - Name of the module under test.
 * @param {module:hcjeTools/testing/runner~TestDefinition} definition - Details of the test.
 * @returns {Promise} Fulfils to [TestResult]{@link module:hcjeTools/testing/runner~TestResult}
 */ 
export function it(moduleName, definition) {
  let testResult = {
    description: `${moduleName}: ${definition.description}`,
  };
  console.log(`Run it: ${definition.description}`);
  const compare = getCompareFunction(definition.compare);
  return runAsPromise(definition.run)
    .then((result) => {
      if (!definition.check && !definition.expected) {
        throw new Error('You must provide either a check function or expected value in the test.');
      }
      if (definition.check) {
        definition.check(result);
      } 
      if (definition.expected) {
        compare(result, definition.expected);
      }
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


