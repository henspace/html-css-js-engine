
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
 * @module tools/testing/runner
 * @description
 * Script for running tests. This is intended to be run as a Node.js script.
 *
 * Usage:
 *
 * + runner configFile
 *     + configFile: configuration file for testing; see below.
 *
 * ## Configuration file
 *
 * The configuration file is a JSON string representation of the following object:
 * ```
 * {
 *   source: "" // [string] the folder to search for test files. This is a recursive search of the folder and all subfolders.
 * }
 * ```
 *
 * ## Testing a module
 *
 * In order to be tested, a module requires a test module to be created and its name must end with **.test.js**.
 *
 * At a minimum it must export an array named **tests** containing the 
 *   [TestDefinition]{@link module:tools/testing/utils~TestDefinition} objects.
 *
 * It can also export the following optional functions:
 *
 * + beforeModuleTests(): run at the start of the module test.
 * + beforeEachTest(): run before each individual test described by its 
 *    [TestDefinition]{@link module:tools/testing/utils~TestDefinition} 
 * + afterEachTest(): run after each individual test described by its 
 *    [TestDefinition]{@link module:tools/testing/utils~TestDefinition} 
 * + afterModuleTests(): run at the end of the module test.
 *
 * Note that each [TestDefinition]{@link module:tools/testing/utils~TestDefinition} is run synchronously to ensure
 * tests are run in the order described in the **tests** object.
 *
 * The runner script will look for all test modules, **\*.test.js**, in the **source** folder and its subfolders and
 * run every test described by the exported **tests** objects. 
 */

import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import * as url from "url";
import * as testUtils from "./utils.js";

const SCRIPT_PATH = url.fileURLToPath(new URL('.', import.meta.url));

/* ANSI colors see https://blog.logrocket.com/using-console-colors-node-js/ */
const DEFAULT_COLOR = `\x1b[0m`;
const BLACK = `\x1b[30m`;
const RED = `\x1b[31m`;
const GREEN = `\x1b[32m`;
const YELLOW = `\x1b[33m`;
const BLUE = `\x1b[34m`;
const WHITE = `\x1b[37m`;
const BG_BLACK = `\x1b[40m`;
const BG_RED = `\x1b[41m`;
const BG_GREEN = `\x1b[42m`;
const BG_WHITE = `\x1b[47m`;
const WHITE_ON_RED = `${WHITE}${BG_RED}`;
const BLACK_ON_WHITE = `${BLACK}${BG_WHITE}`;


/**
 * Module that is to be tested.
 * @typedef {Object} TestModule
 * @param {function():Promise} beforeModuleTests - function to run before any tests in the module run.
 * @param {function():Promise} beforeEachTest - function to run before each test.
 * @param {function():Promise} afterEachTest - function to run after each test.
 * @param {function():Promise} afterModuleTests - function to run after all tests in the module have run.
 * @param {Array<module:testing/utils~TestResult>} tests - tests that are to be run
 * @private
 */ 

/**
 * Show usage.
 * @param {string} message
 * @private
 */
function showUsageAndExit(message) {
  console.error(message);
  console.error('\nUsage: run_test configFile');
  process.exit(1);
}


/**
 * Await function if it exists.
 * @param {function} [fn] async function to await.
 * @private
 */
async function runIfExists(fn) {
  if (fn) {
    await fn();
  }
}

/**
 * Run tests. The tests in the module are run synchronously so that each test can rely on the results of running 
 * the previous test.
 * @param {string} moduleName
 * @param {module:tools/testing/runner~TestModule} testModule
 * @returns {Promise} fulfils to array of module:testing/utils~TestResult>
 * @private
 */
async function runTestDefinitions(moduleName, module) {
  return new Promise((resolve) => {
    const allResults = [];
    (async () => {
      await runIfExists(module.beforeModuleTests);
      for (const testDefn of module.tests) {
        await runIfExists(module.beforeEachTest);
        const result = await testUtils.it(moduleName, testDefn);
        await runIfExists(module.afterEachTest);
        allResults.push(result);
      }
      await runIfExists(module.afterModuleTests);
      resolve(allResults);
    })();
  });
}

// Execute tests
if (process.argv.length < 3) {
  showUsageAndExit('Incorrect arguments.');
} 

/**
 * Process scripts in directory
 * @param {string} sourceDir
 * @returns {Promise} fulfils to array of {@link module:testing/utils~TestResult}
 * @private
 */ 
function runTests(sourceDir) {
  let results = [];
  return fsPromises.readdir(sourceDir, {
      encoding: 'utf-8',
      withFileTypes: true,
      recursive: false
    })
    .then((result) => {
      const promises = [];
      for (const dirent of result) {
        const direntPath = path.join(sourceDir, dirent.name);
        if (dirent.isFile() && /\.test\.js$/.test(dirent.name)) {
          const importName = path.relative(SCRIPT_PATH, direntPath).replaceAll('\\', '/');
          const promise = import(importName)
            .then((module) => runTestDefinitions(dirent.name, module))
            .then((result) => results = [...results, ...result]);
          promises.push(promise);
        } else if (dirent.isDirectory()) {
            const promise = runTests(direntPath)
              .then((result) => results = [...results, ...result]);
            promises.push(promise);
        }
      }
      return Promise.all(promises).then(()=> results);
    }) 
}

let configFile = process.argv[2];
console.log(`Loading options from ${configFile}`);
let options;


await fsPromises.readFile(configFile, {encoding: 'utf-8'})
  .then((json) => {
    options = JSON.parse(json);
  })
  .then(() => runTests(options.source))
  .then((testResults) => {
    let passes = 0;
    let fails = 0;
    console.log('\n\n============\nTest Results\n============\n');
    for (const testResult of testResults) {
      if (testResult.error) {
        fails++;
        console.log(`${WHITE_ON_RED}FAIL: ${testResult.description}: ${testResult.error}${DEFAULT_COLOR}`);
        if (testResult.error.stack) {
          console.log(`${YELLOW}\nStacktrace:\n===========\n`, testResult.error.stack,`${DEFAULT_COLOR}`);
        }
      } else {
        passes++;
        console.log(`${GREEN}PASS: ${testResult.description}; Result: ${testResult.result}${DEFAULT_COLOR}`);
      } 
    }
    console.log(`\n\n${GREEN}${passes + fails} tests; ${passes} passed; ${WHITE_ON_RED}${fails} failed.${DEFAULT_COLOR}`);
  })


