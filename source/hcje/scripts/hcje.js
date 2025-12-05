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
 * @module hcje/engine
 * @description
 * This is a barrel module aggregating the engine modules and provided for convenience only.
 * Note that not all modules are included.
 *
 * Included:
 *
 * + hcje/audio
 * + hcje/build-constants
 * + hcje/device
 * + hcje/domTools
 * + hcje/errors
 * + hcje/images
 * + hcje/sprites
 * + hcje/storage
 * + hcje/utils
 *
 * Not included:
 *
 * + hcje/images
 * + hcje/scenes
 */

export * as audio from './audio.js';
export * as buildConstants from './build-constants.js';
export * as device from './device.js'; 
export * as domTools from './dom-tools.js';
export * as errors from './errors.js';
export * as images from './images.js';
export * as sprites from './sprites.js';
export * as storage from './storage.js';
export * as utils from './utils.js';

