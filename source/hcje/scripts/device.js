
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
 * Various utilities for getting information from the system
 */

/**
 * Get available dimensions.
 * @param {Element} [element = window] - element to check
 * @returns {{width: number, height: number}}
 */
export function getDimensions(element) {
  let width;
  let height;
  if (element) {
    width = element.clientWidth;
    height = element.clientHeight;
  } else {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  return {width, height};
}

/** 
 * Get an appropriate scale to allow a rectangle to fit in the body.
 * The body should have been set in css to fit the screen.
 * @param {number} width - rectangle width
 * @param {height} height - rectangle height
 * @param {boolean} cover - should rect cover body. Fits if false
 * @param {Object} options
 * @param {number} options.margin - margin around the rectangle.
 * @param {Element} options.element - element to use for bounds.
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
 * @param {number} width - rectangle width
 * @param {height} height - rectangle height
 * @param {Object} options
 * @param {number} options.margin - margin around rectangle
 * @param {Element} options.element - element to use for bounds.
 *  Defaults to window innerWidth;
 * @returns {number}
 */
export function getScaleToFit(width, height, options) {
  return getScaleToFitOrCover(width, height, false, options);
}

/** 
 * Get an appropriate scale to allow a rectangle to cover the body.
 * The body should have been set in css to fit the screen.
 * @param {number} width - rectangle width
 * @param {height} height - rectangle height
 * @param {Object} options
 * @param {number} options.margin - margin around rectangle
 * @param {Element} options.element - element to use for bounds.
 *  Defaults to window innerWidth;
 * @returns {number}
 */
export function getScaleToCover(width, height, options) {
  return getScaleToFitOrCover(width, height, true, options);
}


