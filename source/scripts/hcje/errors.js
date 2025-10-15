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
  const choice = confirm(`Whoops! A serious error has occurred: ${message}\n\nDo you want to reload the page? If you cancel, we'll try to go back to the previous page.`);
  if (choice) {
    location.reload();
  } else {
    history.back();
  }
}

/* Add handlers for unexpected events. */
window.addEventListener('error', ((error) => {
  showAndHandleFatalError(`${error.message} ${error.filename}[${error.lineno}:${error.colno}]`);
}));

window.addEventListener('unhandledrejection', ((event) => {
  showAndHandleFatalError(`Unhandled promise rejection: ${event.reason}`);
}));



