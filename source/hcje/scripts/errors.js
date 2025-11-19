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
 * @module hcje/errors
 * @description
 * Error handling utilities.
 * Including this module will automatically handle 'error' and 'unhandledrejection' events if not caught.
 */

/**
 * Show a fatal error. NB we don't use translation in case the error occurred in translation.
 * There is no return as the function either reloads or goes back in the history.
 * @param {string} message
 */
export function showAndHandleFatalError(message) {
  console.trace(message);
  const choice = confirm(`Whoops! A serious error has occurred: ${message}\n\nDo you want to reload the page? If you cancel, we'll try to go back to the previous page.`);
  if (choice) {
    location.reload();
  } else {
    history.back();
  }
}

/**
 * Logger class. This is used for logging messages that may need to be displayed later. 
 * It will also redirect to the console. The console methods are not hijacked so that the log does not become polluted
 * with multiple messages that may not need to be logged.
 */
export class Logger {
  /** Log messages @type {string[]} */
  #log;
  /** Max number of lines retained @type{number} */
  #maxSize;

  /** 
   * Construct the logger. 
   * @param {number} [maxSize = 100] maximum number of messages retained.
   */
  constructor(maxSize = 100) {
    this.#log = [];
    this.#maxSize = maxSize;
  }

  /**
   * Append message to the queue.
   * @param {string} message - the text to add to the log.
   */
  #append(message) {
    if (this.#log.length >= this.#maxSize) {
      this.#log.shift();
    }
    this.#log.push(message);
  }

  /**
   * Get the log as markdown list.
   * @returns {string}
   */
  get markdown() {
    let result = '';
    for (const line of this.#log) {
      result += `+ ${line}\n`;
    }
    return result;
  }

  /**
   * Clear the log.
   */
  clear() {
    this.#log = [];
  }
  /**
   * Normal log message.
   * @param {string} message - text to add to the log.
   */ 
  log(message) {
    this.#append(message);
    console.log(message);
  }
  /**
   * Debug log message.
   * @param {string} message - text to add to the log.
   */ 
  debug(message) {
    this.#append(`debug: ${message}`);
    console.log(message);
  }
  /**
   * Debug log message.
   * @param {string} message - text to add to the log.
   */ 
  error(message) {
    this.#append(`error: ${message}`);
    console.error(message);
  }
  /**
   * Info log message.
   * @param {string} message - text to add to the log.
   */ 
  info(message) {
    this.#append(`info: ${message}`);
    console.info(message);
  }
  /**
   * Warn log message.
   * @param {string} message - text to add to the log.
   */ 
  warn(message) {
    this.#append(`warn: ${message}`);
    console.warn(message);
  }
}

/* Add handlers for unexpected events. */
window.addEventListener('error', ((error) => {
  showAndHandleFatalError(`${error.message} ${error.filename}[${error.lineno}:${error.colno}]`);
}));

window.addEventListener('unhandledrejection', ((event) => {
  showAndHandleFatalError(`Unhandled promise rejection: ${event.reason}`);
}));




