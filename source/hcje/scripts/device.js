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
 * @module hcje/device
 * @description
 * Various utilities for managing the device the app is running on. In this context, the window size is also regarded
 * as device information as not controlled by the app itself and more represents the environment in which it is
 * running.
 */

/**
 * Get the dimensions of an element. 
 * @param {Element} [element = window] - Element to check. Defaults to the window.
 * @returns {{width: number, height: number}}
 */
export function getDimensions(element) {
  let width;
  let height;
  if (element) {
    width = element.clientWidth || Number.parseInt(element.style.width);
    height = element.clientHeight || Number.parseInt(element.style.height);
  } else {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  return {width, height};
}

/** 
 * Get an appropriate scale to allow a rectangle to fit in the body.
 * Typically no element is provided and the body will have been set in css to fit the screen.
 * @param {number} width - Rectangle width
 * @param {height} height - Rectangle height
 * @param {boolean} cover - Should scale result in the rectangle covering the element or fitting within it. Fits if
 *   false.
 * @param {Object} options
 * @param {number} options.margin - Margin around the rectangle.
 * @param {Element} options.element - Element to use for bounds.
 *  Defaults to using the window.
 * @returns {number}
 */
export function getScaleToFitOrCover(width, height, cover, options) {
  const margin = options.margin ?? 0;
  const dimensions = getDimensions(options.element);
  const availableWidth = dimensions.width - 2 * margin;
  const availableHeight = dimensions.height - 2 * margin;
  
  let scale;
  if (cover) {
    scale = Math.max(availableWidth / width, availableHeight / height);
  } else {
    scale = Math.min(availableWidth / width, availableHeight / height);
  }
  console.debug(`${cover ? 'Cover' : 'Fit'} [${width}x${height}] into [${availableWidth}x${availableHeight} at scale ${scale.toFixed(2)}]`);
  return scale;
}

/** 
 * Get an appropriate scale to allow a rectangle to fit in the body.
 * The body should have been set in css to fit the screen.
 * @param {number} width - Rectangle width
 * @param {height} height - Rectangle height
 * @param {Object} options
 * @param {number} options.margin - Margin around rectangle
 * @param {Element} options.element - Element to use for bounds.
 *  Defaults to window innerWidth;
 * @returns {number}
 */
export function getScaleToFit(width, height, options) {
  return getScaleToFitOrCover(width, height, false, options ?? {});
}

/** 
 * Get an appropriate scale to allow a rectangle to cover the body.
 * The body should have been set in css to fit the screen.
 * @param {number} width - Rectangle width
 * @param {height} height - Rectangle height
 * @param {Object} options
 * @param {number} options.margin - Margin around rectangle
 * @param {Element} options.element - Element to use for bounds.
 *  Defaults to window innerWidth;
 * @returns {number}
 */
export function getScaleToCover(width, height, options) {
  return getScaleToFitOrCover(width, height, true, options ?? {});
}



/**
 * Detail provided in the details property of the options object provided to the 
 * [CustomEvent]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent}.
 * @typedef {Object} VirtualKeyDetail
 * @property {string} key - see the 
 *    [KeyboardEvent.key property]{@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key}.
 */

/**
 * @typedef {Object} KeyEventListener
 * @property {function()} callback - Function to call on event
 * @property {boolean} noRepeat - If true, key repeats are ignored.
 */

/**
 * Keyboard handler.
 */
export class Keyboard {
  /** @type {string} */
  static #VIRTUAL_KEYDOWN_EVENT = 'virtualKeyDown';

  /** Map of listeners.
   * @type {Map<string, function>} */
  #listeners;
  
  /**
   * Construct the keyboard handler.
   */ 
  constructor() {
    this.#listeners = new Map();
    addEventListener('keydown', (evt) => {
      const listener = this.#listeners.get(evt.key);
      if (listener && !(listener.noRepeat && evt.repeat)) {
        listener.callback()
      }
    });
    addEventListener(Keyboard.#VIRTUAL_KEYDOWN_EVENT, (evt) => {
      this.#listeners.get(evt.detail.key)?.callback();
    });
  }
  /**
   * Add keydown listener.
   * @param {string} key - String representation of key. 
   *   See the [KeyboardEvent.key property]{@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key}.
   * @param {function()} listener - Callback function.
   */
  addDownListener(key, listener) {
    this.#listeners.set(key, listener);
  }
  /**
   * Remove keydown listener previously added via a call to [addDownListener]{@link module:hcje/device.Keyboard#addDownListener}.
   * @param {string} key - String representation of key. 
   */
  removeDownListener(key) {
    this.#listeners.delete(key);
  }

  /**
   * Dispatch a virtual key down event.
   * @param {string} key - String representation of key. 
   *   See the [KeyboardEvent.key property]{@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key}.
   * @param {EventTarget} [dispatcher = window] - Event target used to dispatch the event.
   */
  static simulateKeydown(key, dispatcher = window) {
    dispatcher.dispatchEvent(new CustomEvent(Keyboard.#VIRTUAL_KEYDOWN_EVENT, {detail: {key}}));
  }
}


/**
 * Put the element into fullscreen mode.
 * @param {Element} [element = Document.documentElement] - The element to go into fullscreen.
 * @param {Object} [options] - See [requestFullscreen options]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen#options}
 */ 
export function enterFullscreen(element = document.documentElement, options) {
  if (!document.fullscreenElement) {
    element.requestFullscreen()
      .then(() => console.debug(`Into fullscreen`))
      .catch((error) => {
        console.error(`Could not enter fullscreen mode: %{error.message}`);
      });
  }
}

/**
 * Exit fullscreen mode.
 */
export function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
      .then(() => console.debug('Exited fullscreen mode.'))
      .catch((err) => console.error('Failed to exit fullscreen mode:', err));
  }
}

/**
 * Test if touch api supported.
 * @returns {boolean}
 */
export function supportsTouch() {
  return window.hasOwnProperty('ontouchstart');
}
