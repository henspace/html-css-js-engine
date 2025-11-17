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
 * @param {string} str - string to parse.
 * @param {number} [defaultValue = 0] - value to return on failure. Note this should be an integer but it is not validated.
 */
export function parseInt(str, defaultValue = 0) {
  const result = Number.parseInt(str);
  return Number.isNaN(result) ? defaultValue : result;
}

/**
 * Get random number between min (inclusive) and max (exclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function getRandomNumberBetween(min, max) {
  return Math.random() * (max - min) + min; 
}

/** 
 * Get random integer in range.
 * If max <= min, returns min.
 * @param {number} min - inclusive
 * @param {number} max - exclusive
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
 * @param {number} min - inclusive
 * @param {number} max - inclusive
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
 * @param {number} sides - number of sides on the dice.
 * @returns {number}
 */
export function rollDice(sides = 9) {
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
 * @param {Array<*>} arr
 * @returns {*} undefined if arr undefined or empty.
 */
export function getRandomMember(arr) {
  if (!arr || arr.length < 1) {
    return;
  }
  const index = getRandomIntExclusive(0, arr.length);
  return arr instanceof Array ? arr[index] : arr.charAt(index);
}


/** Get greatest common divisor.
 * @param {number} a
 * @param {number} b
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
 * @param {number} valueA
 * @param {number} valueB
 * @returns {number}
 */ 
export function lowestCommonMultiple(valueA, valueB) {
  return valueA * valueB / greatestCommonDivisor(valueA, valueB);
} 

/**
 * Get lowest common multiple of an array of values.
 * @param {Array<number>} values
 * @returns {number}
 */ 
export function lowestCommonMultipleOfArray(values) {
  return values.reduce((a, b) => lowestCommonMultiple(a, b));
}

/**
 * Jitter value
 * @param {number} value
 * @param {number} variation - result is a random number of value * (1 +/- variation)
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
 * @param {number} value
 * @param {number} min - minimum value
 * @param {number} max - maximum value
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Sleep for time.
 * @param {number} ms
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}


/**
 * Create a Waiter. This object allow the program to wait until the caller 
 * @returns {module:utils~waiter}
 */
export function createWaiter() {
  /** Function called to resolve Promise. @type {function()} */
  let resolver;

  /**
   * Object allowing for programs to wait for an event. Call  the wait method to start the waiter. This will return a
   * Promise that will not be fulfilled until the Waiter's end method is called. Sucessive calls to wait will be
   * rejected.
   * @interface
   * @alias module:utils~Waiter
   */ 
  const waiter = {
    /**
     * Wait until end is called.
     * A subsequent call to wait will reject.
     * @returns {Promise}
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
     * @param {*} value
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
     * Test whether waiter is waiting.
     * @returns {boolean}
     */ 
    isWaiting: () => !!resolver,
  };

  return waiter;

}

/**
 * Shuffle array. This uses Sattolo's algorithm to ensure every item is
 * always in a new position.
 * See {@link https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shufflehttps://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle}
 * and {@link https://rosettacode.org/wiki/Sattolo_cycle}
 * @param {Array<*>} arr
 * @returns {Array<*>} Note original array is changed.
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
 * Content types keys for arrays .
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
 * @param {string | URL | Request} url
 * @param {boolean} asJson - if true pass the result as JSON.
 * @param {string | Object} fallbackResult - result if error
 * @returns {Promise} fulfils to text or json. On error, fulfils to
 *  fallbackResult. If fallbackResult is undefined, an error is thrown.
 * @throws {Error} if fallbackResult is undefined. Null is a valid fallbackResult
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
 * @param {string | URL | Request} url
 * @param {string} fallbackResult - result if error
 * @returns {Promise} fulfils to text. On error, fulfils to
 *  fallbackResult or throws error.
 * @throws {Error} if fallbackResult is undefined. Null is a valid fallbackResult
 */
export function fetchText(url, fallbackResult) {
  return fetchTextOrJson(url, false, fallbackResult);
}


/**
 * Call to fetch to get json.
 * @param {string | URL | Request} url
 * @param {Object} fallbackResult - result if error
 * @returns {Promise} fulfils to Object. On error, fulfils to
 *  fallbackResult or throws error.
 * @throws {Error} if fallbackResult is undefined. Null is a valid fallbackResult
 */
export function fetchJson(url, fallbackResult) {
  return fetchTextOrJson(url, true, fallbackResult);
}


/**
 * Call to fetch to get text.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch}
 * @param {string | URL | Request} url
 * @param {Object} headers - the [Headers]{@link https://developer.mozilla.org/en-US/docs/Web/API/Headers} to add to
 * the request.
 * @param {RequestInit} options - if null, the content type is derived from the url.
 *  See [RequestInit]{@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit}.
 * @returns {Promise} fulfils to the ArrayBuffer. 
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


