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
 * @module hcje/utils
 * @description
 * General miscellaneous utilities.
 */

/**
 * @typedef Dimensions
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef Coordinate
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef RectData
 * @property {number} x - left position
 * @property {number} y - top position
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef PositionData
 * @property {number} x - x position.
 * @property {number} y - y - position.
 * @property {number} angle - radians.
 */

/**
 * Safely parse an integer.
 * @param {string} str - String to parse.
 * @param {number} [defaultValue = 0] - Value to return on failure. Note this should be an integer, but it is not
 * validated.
 */
export function parseInt(str, defaultValue = 0) {
  const result = Number.parseInt(str);
  return Number.isNaN(result) ? defaultValue : result;
}

/**
 * Get random number between min (inclusive) and max (exclusive).
 * @param {number} min - Minimum value inclusive.
 * @param {number} max - Maximum value exclusive.
 * @returns {number}
 */
export function getRandomNumberBetween(min, max) {
  return Math.random() * (max - min) + min; 
}

/** 
 * Get random integer in range.
 * If max <= min, returns min.
 * @param {number} min - Minimum value inclusive
 * @param {number} max - Maximum value exclusive
 */
export function getRandomIntExclusive(min, max) {
  if (max <= min) {
    return Math.ceil(min);
  }
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

/** 
 * Get random integer in range.
 * If max <= min, returns min.
 * @param {number} min - Minimum value inclusive.
 * @param {number} max - Maximum value inclusive.
 */
export function getRandomIntInclusive(min, max) {
  if (max <= min) {
    return Math.ceil(min);
  }
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

/**
 * Get dice roll.
 * @param {number} [sides = 6] - Number of sides on the dice.
 * @returns {number}
 */
export function rollDice(sides = 6) {
  return getRandomIntInclusive(1, sides);
}

/**
 * Get coin toss.
 * @returns {boolean}
 */
export function tossCoin() {
  return Math.random() >= 0.5;
}

/** 
 * Get a random entry from an array or string.
 * @param {Array<*>} arr - Array from which to get entry.
 * @returns {*} Entry; undefined if arr undefined or empty.
 */
export function getRandomMember(arr) {
  if (!arr || arr.length < 1) {
    return;
  }
  const index = getRandomIntExclusive(0, arr.length);
  return arr instanceof Array ? arr[index] : arr.charAt(index);
}


/** 
 * Get greatest common divisor.
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number}
 */
export function greatestCommonDivisor(valueA, valueB) {
  /**
   * Perform calculation without ensuring integers.
   */
  function calculate(a, b) {
    return b === 0 ? a : calculate(b, a % b);
  }
  return calculate(Math.floor(valueA), Math.floor(valueB));
}

/**
 * Calculate the lowest common multiple of two numbers.
 * @param {number} valueA - First number.
 * @param {number} valueB - Second number.
 * @returns {number}
 */ 
export function lowestCommonMultiple(valueA, valueB) {
  return valueA * valueB / greatestCommonDivisor(valueA, valueB);
} 

/**
 * Get lowest common multiple of an array of values.
 * @param {Array<number>} values - Array of numbers.
 * @returns {number}
 */ 
export function lowestCommonMultipleOfArray(values) {
  return values.reduce((a, b) => lowestCommonMultiple(a, b));
}

/**
 * Get a random number based on a value and variation. For a value of **N** and variation of **V** the result
 * will be a random number between N&nbsp;*&nbsp;(1&nbsp;-&nbsp;V) and N&nbsp;*&nbsp;(1&nbsp;+&nbsp;V).
 * @param {number} value - Number to adjust.
 * @param {number} variation - Variation to apply to the value. This is a proportion of the value, not an absolute
 *   value.
 * @returns {number}
 */
export function jitter(value, variation) {
  if (!variation) {
    return value;
  }
  const min = value * (1 - variation);
  const max = value * (1 + variation);
  return getRandomNumberBetween(min, max);
}

/**
 * Clamp a value between range: inclusive.
 * @param {number} value - Number to clamp.
 * @param {number} min - Minimum value inclusive.
 * @param {number} max - Maximum value inclusive.
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Sleep for time.
 * @param {number} ms - Period to sleep in milliseconds.
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}


/**
 * Create a [Waiter]{@link module:hcje/utils~Waiter} object. This object allow the program to wait until the
 * application calls its **end** method.
 * @returns {module:utils~Waiter}
 */
export function createWaiter() {
  /** Function called to resolve Promise. @type {function()} */
  let resolver;

  /**
   * Object to allow the program to wait for an unspecified event. Call the wait method will start the the waiter.
   * This will return a Promise that will not be fulfilled until the waiter's **end** method is called. Successive
   * calls to wait will be rejected.
   * @interface
   * @alias module:utils~Waiter
   */ 
  const waiter = {
    /**
     * Wait until the end method is called.
     * A subsequent call to wait will reject.
     * @returns {Promise} Fulfils to the value passed to the **end** method.
     */
    wait: () => {
      return new Promise((resolve, reject) => {
        if (resolver) {
          reject(new Error(`Attempt to call wait on Waiter that is already awaiting resolution.`));
        } else {
          resolver = resolve;
          console.debug('Waiter set to wait for continue to be called.');
        }
      })
    },

    /**
     * End wait. This will cause the original Promise to fulfil to the provided value.
     * @param {*} value - Fulfillment value.
     */
    end: (value) => {
      if (!resolver) {
        console.error("Ignoring call made to end wait on a Waiter that hasn't been started.");
      } else {
        console.debug(`End wait. Fulfil as ${value}`);
        resolver(value);
        resolver = undefined;
      }
    },

    /**
     * Test whether the waiter is waiting.
     * @returns {boolean}
     */ 
    isWaiting: () => !!resolver,
  };

  return waiter;

}

/**
 * Shuffle array. This uses Sattolo's algorithm to ensure every item is
 * always in a new position. The original array **IS** modified.
 * See [Fisher Yates shuffle]{@link https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shufflehttps://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle}
 * and [Sattolo cycle]{@link https://rosettacode.org/wiki/Sattolo_cycle}
 * @param {Array<*>} arr - The array to shuffle.
 * @returns {Array<*>}
 */
export function shuffle(arr) {
  for (let i = arr.length-1; i > 0; i--) {
    var j = Math.floor(Math.random() * i);
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Content types used to determine the appropriate response header's content type base on the file type.
 * @type {Object<string, HeaderInfo[]> }
 * @private
 */
const ContentType = {
  css: 'text/css',
  csv: 'text/csv',
  cur: 'image/x-icon',
  gif: 'image/gif',
  html: 'text/html',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  json: 'application/json',
  js: 'text/javascript',
  map: 'application/json',
  md: 'text/markdown',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  txt: 'text/plain',
  woff: 'font/woff',
  woff2: 'font/woff2',
};





/**
 * Call to fetch to get text.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch}
 * @param {string | URL | Request} url - Url to fetch.
 * @param {boolean} asJson - If true pass the result as JSON.
 * @param {string | Object} fallbackResult - Result to return if error.
 * @returns {Promise} Fulfils to text or json. On error, fulfils to
 *  fallbackResult. If fallbackResult is undefined, an error is thrown.
 * @throws {Error} Thrown if error occurs and fallbackResult is undefined. Null is a valid fallbackResult
 */
export function fetchTextOrJson(url, asJson, fallbackResult) {
  return fetch(url)
    .then((response) => {
      if (response.ok) {
        return asJson ? response.json() : response.text();
      } else {
        throw new Error(`HTTP error! Status :${response.status}`);
      }
    })
    .catch((error) => {
      console.error(error.message);
      if (fallbackResult === undefined) {
        throw new Error(`Failed to load ${url}: ${error}`);
      }
      return fallbackResult;
    });
}


/**
 * Call to fetch to get text.
 * @param {string | URL | Request} url - Url to fetch.
 * @param {string} fallbackResult - Result if error
 * @returns {Promise} Fulfils to text. On error, fulfils to
 *  fallbackResult or throws error.
 * @throws {Error} Thrown if error occurs and fallbackResult is undefined. Null is a valid fallbackResult
 */
export function fetchText(url, fallbackResult) {
  return fetchTextOrJson(url, false, fallbackResult);
}


/**
 * Call to fetch to get json.
 * @param {string | URL | Request} url - Url to fetch.
 * @param {Object} fallbackResult - Result if error
 * @returns {Promise} Fulfils to Object. On error, fulfils to
 *  fallbackResult or throws error.
 * @throws {Error} Thrown if error occurs and fallbackResult is undefined. Null is a valid fallbackResult
 */
export function fetchJson(url, fallbackResult) {
  return fetchTextOrJson(url, true, fallbackResult);
}


/**
 * Call to fetch to get an array buffer from a media file.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch}
 * @param {string | URL | Request} url - Url to fetch.
 * @param {Object} headers - The [Headers]{@link https://developer.mozilla.org/en-US/docs/Web/API/Headers} to add to
 * the request.
 * @param {RequestInit} options - If null, the content type is derived from the url.
 *  See [RequestInit]{@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit}.
 * @returns {Promise} Fulfils to the ArrayBuffer. 
 * @throws {Error}
 */
export function fetchArrayBuffer(url, options) {
  let requestInit = options; 
  if (!requestInit) {
    const fileType = url?.match(/\.([\w\d]+)$/)?.[1];
    if (fileType) {
      requestInit = {
        method: 'GET',
        headers: {
          'Content-Type' :ContentType[fileType],
        }
      }; 
      console.debug(`Fetch ${url} with Content-Type = ${requestInit.headers['Content-Type']}`);
    }
  }
  return fetch(url, requestInit)
    .then((response) => {
      if (response.ok) {
        return response.arrayBuffer();
      } else {
        throw new Error(`HTTP error! Status :${response.status}`);
      }
    })
}


