
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
 * @module hcje/constants
 * @description
 * Data that is added by the build function
 */
export const BUILD_DATA = {
  author: '%%_AUTHOR_%%',
  buildDateIso: '%%_BUILD_DATE_ISO_%%',
  buildId: '%%_BUILD_ID_%%',
  buildYear: '%%_BUILD_YEAR_%%',
  description: '%%_DESCRIPTION_%%',
  licence: '%%_LICENCE_%%',
  name: '%%_NAME_%%',
  version: '%%_VERSION_%%',
}

export const STORAGE_KEY_PREFIX = '%%_NAME_%%'.replace(/[ ]/g,'_').toUpperCase() + '_';

/** Sounds @type {{name: string, module:audio~SoundDefinition}} */
export const AUDIO = {
  tileClick: {
    url: 'assets/audio/tile_click.mp3',
    key: 'TILE_CLICK'
  },
  music: {
    url:'assets/audio/Troubadeck 54 Infinity.mp3',
    key: 'BACKGROUND_MUSIC',
    fadeSeconds: 1.0,
  }
}

/** Available translations @type {Array<string>} */
export const TRANSLATIONS = ['en'];
