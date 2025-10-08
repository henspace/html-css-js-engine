
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
 * @module hcje/images
 * @description
 * Functions to aid with the management of images.
 */

import * as utils from "./utils.js";

/**
 * @typedef {Object} CellPainterData
 * @propery {CanvasRenderingContext2D} context - rendering context
 * @property {module:hcje/utils~Dimension} imageSize
 * @property {module:hcje/utils~Rectangle} cell
 * @property {Object} custom - additional painter specific data
 */

/**
 * @typedef {function(CellPainterData)} CellPainter
 */ 




/**
 * @see module:hcje/images~CellPainter
 * @param {module:hcje/images~CellPainterData} data
 * @param {string} data.custom.fontName - CSS font name
 * @param {string | Array<string>} data.custom.text
 * @param {boolean} [data.custom.fitWidth] - normally text is fitted to the height of a cell.
 */
export function textCellPainter(data) {
  const word = utils.getRandomMember(data.custom?.text ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
  let fontSize = data.cell.height;
  data.context.font = `${fontSize}px ${data.custom?.fontName ?? 'sans-serif'}`;
  data.context.textBaseline = 'middle';
  if (data.custom?.fitWidth) {
    const textMetrics = data.context.measureText(word);
    fontSize = fontSize * data.cell.width / textMetrics.width;
    data.context.font = `${fontSize}px ${data.custom?.fontName ?? 'sans-serif'}`;
  }
  if (data.custom?.fill) {
    data.context.fillText(word, data.cell.x, data.cell.y + data.cell.height / 2);
  } else {
    data.context.strokeText(word, data.cell.x, data.cell.y + data.cell.height / 2);
  }
}

/**
 * @see module:hcje/images~CellPainter
 * @param {module:hcje/images~CellPainterData} data
 * @param {HTMLImageElement | SVGImageElement | ImageBitmap} data.custom.image
 */
export function imageCellPainter(data) {
  if (!data.custom?.image) {
    console.error(`Image not provided in data.custom.image.`);
    return;
  }
  data.context.drawImage(data.custom.image, data.cell.x, data.cell.y, data.cell.width, data.cell.height);
}

/**
 * @see module:hcje/images~CellPainter
 * @param {module:hcje/images~CellPainterData} data
 */
export function circleCellPainter(data) {
  data.context.beginPath();
  data.context.arc(data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2,
    data.cell.width / 2, 0, 2 * Math.PI);
  if (data.custom?.fill) {
    data.context.fill();
  } else {
    data.context.stroke();
  }
}

/**
 * @see module:hcje/images~CellPainter
 * @param {module:hcje/images~CellPainterData} data
 */
export function triangleCellPainter(data) {
  const custom = data.custom ?? {};
  custom.points = [
    {x: data.cell.x, y: data.cell.y + data.cell.height},
    {x: data.cell.x + data.cell.width / 2, y: data.cell.y},
    {x: data.cell.x + data.cell.width, y: data.cell.y + data.cell.height},
  ];
  const pathData = {
    context: data.context,
    imageSize: data.imageSize,
    cell: data.cell,
    custom,
  }
  pathCellPainter(pathData);
}

/**
 * @see module:hcje/images~CellPainter
 * @param {module:hcje/images~CellPainterData} data
 */
export function randomPathCellPainter(data) {
  const custom = data.custom ?? {};
  let vertices = Math.max(4, data.custom.vertices ?? 0);
  const points = [];
  points.push({x: data.cell.x + data.cell.width / 2, y: data.cell.y});
  points.push({x: data.cell.x + data.cell.width, y: data.cell.y + data.cell.height / 2});
  points.push({x: data.cell.x + data.cell.width / 2, y: data.cell.y + data.cell.height});
  points.push({x: data.cell.x, y: data.cell.y + data.cell.height / 2});

  for (let index = 4; index < data.cell.vertices; index++) {
    const x = utils.getRandomIntInclusive(data.cell.x, data.cell.x + data.cell.width);
    const y = utils.getRandomIntInclusive(data.cell.y, data.cell.y + data.cell.height);
    points.push({x, y});
  }
  custom.points = utils.shuffle(points);
  const pathData = {
    context: data.context,
    imageSize: data.imageSize,
    cell: data.cell,
    custom,
  }
  pathCellPainter(pathData);
}

/**
 * @see module:hcje/images~CellPainter
 * @param {module:hcje/images~CellPainterData} data
 * @param {Array<module:hcje/utils~Point> data.custom.points
 * @param {boolean} data.custom.fill
 */
export function pathCellPainter(data) {
  const points = data.custom.points;
  if (!points || points.length < 2) {
    console.error('Attempt to draw path with less than 2 points ignored.');
    return;
  }
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index++) {
    path.lineTo(points[index].x, points[index].y)
  }
  path.closePath();
  if (data.custom?.fill) {
    data.context.fill(path);
  } else {
    data.context.stroke(path);
  }
}

/**
 * @typedef {Object} ImageConfig
 * @property {module:hcje/utils~Dimension} imageSize
 * @property {CellPainter} cellPainter
 * @property {Object} cellConfig
 * @property {string} [cellConfig.backgroundColor = 'transparent'] - CSS color of background
 * @property {number} [cellConfig.jitter = 0] - proportion of cell size by which a cell can be repositioned.
 * @property {number} [cellConfig.minScale = 1] - minimum scale applied to cell size
 * @property {number} [cellConfig.maxScale = 1] - maximum scale applied to cell size
 * @property {Array<string>} [cellConfig.palette = ['black']] - array of CSS colors used for foreground colors
 * @property {number} [cellConfig.rowCount = 1] - number of rows
 * @property {number} [cellConfig.strokeWidth = 8] - stroke width
 * @property {boolean} [cellConfig.strokeWithinCell = false] - if true, the cell size passed to painters is reduced so 
 * that strokes up to the border will fit within the original cell size.
 * @property {Object} [custom] - additional information that might be required by a specific painter
 */

/**
 * Create a image generator. This can create data urls for automatically generated images.
 */
export class ImageGenerator {
  /** Cache of dynamic images held as object urls. @type {Map<string, string>} */
  #cache = new Map();

  /**
   * Revoke a url when it's no longer needed and remove from the cache.
   * @param {string} cacheId
   */
  revokeCacheId(cacheId) {
    if (!this.#cache.has(cacheId)) {
      console.error(`Ignored attempt to revoke missing cache Id ${cacheId}`);
      return;
    }
    this.#cache.get(cacheId).revokeObjectURL();
    this.#cache.delete(cacheId);
    console.debug(`Revoked cache Id ${cacheId}`);
  }

  /**
   * Revoke all cached urls and clear the cache.
   */
  revokeAll() {
    this.#cache.forEach((url)=> url.revokeObjectURL());
    this.#cache.clear();
  }

  /**
   * Create an object URL or take from the cache if it exists..
   * @param {string} cacheId - the image will be held in a cache for future retrieval or revocation. 
   * @param {ImageConfig} config
   * @returns {Promise} fulfils to a string containing a blob URL. 
   * {@link https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob}
   */
  createObjectUrlOrUseCache(cacheId, config) {
    if (!cacheId) {
      return Promise.reject(new Error(`Attempt to create an image with no cache id rejected.`));
    }
    if (this.#cache.has(cacheId)) {
      return Promise.resolve(this.#cache.get(cacheId));
    } else {
      return this.createObjectUrl(config)
        .then((url) => {
          if (cacheId) {
            this.#cache.set(cacheId, url);
          }
          return url;
        });
    }
  }
  
  /**
   * Create an object URL.
   * @param {ImageConfig} config
   * @returns {Promise} fulfils to a string containing a blob URL. 
   * {@link https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob}
   */
  createObjectUrl(config) {
    const backgroundColor = config.cellConfig?.backgroundColor ?? 'transparent';
    const jitter = config.cellConfig?.jitter ?? 0;
    const maxScale = config.cellConfig?.maxScale ?? 1;
    const minScale = config.cellConfig?.minScale ?? 1;
    const palette = config.cellConfig?.palette ?? ['black'];
    const rowCount = config.cellConfig?.rowCount ?? 1;
    const strokeWidth = config.cellConfig?.strokeWidth ?? 4;
    const strokeWithinCell = config.cellConfig?.strokeWithinCell ?? false;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = config.imageSize.width;
    canvas.height = config.imageSize.height;
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, config.imageSize.width, config.imageSize.height);
    if (rowCount <= 0) {
      return Promise.reject(new Error(`Attempt made to create image with invalid rowCount of ${rowCount}`));
    }
    const cellSide = config.imageSize.height / rowCount;
    const columns = Math.ceil(config.imageSize.width / cellSide);
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < columns; col++) {
        const color = utils.getRandomMember(palette);
        const cellMargin = strokeWithinCell ? strokeWidth / 2 : 0;
        const cell = {
          x: cellMargin + col * cellSide + utils.getRandomNumberBetween(-cellSide * jitter, cellSide * jitter),
          y: cellMargin + row * cellSide + utils.getRandomNumberBetween(-cellSide * jitter, cellSide * jitter),
          width: utils.getRandomNumberBetween(cellSide * minScale, cellSide * maxScale) - 2 * cellMargin,
          height: utils.getRandomNumberBetween(cellSide * minScale, cellSide * maxScale) - 2 * cellMargin,
        }
        context.fillStyle = color;
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
        context.lineJoin = 'round';
        if (!config.cellPainter) {
          return Promise.reject(new Error(`No cell painter so image cannot be drawn.`));
        }
        config.cellPainter({
          context, 
          imageSize: config.imageSize, 
          cell,
          custom: config.custom
        })
      }
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        console.log(blob);
        resolve(URL.createObjectURL(blob));
      });
    });
  }
}


