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
 * @module mainGame
 * @description
 * Main entry point for game
 */
import * as hcje from '../../hcje/scripts/hcje.js';

const PREFERRED_IMAGE_WIDTH = 540;
const PREFERRED_IMAGE_HEIGHT = 540;
const SLICE_COUNTS = [3, 4, 5];
const DELTA_PER_CLICK = 10; 
const CONTROL_MARGIN = 50;
const PALETTE = ['#06AED5', '#F0C808', '#DD1C1A', '#059B15'];
/**
 * @typedef {Object} GameSize
 * @property {number} gameWidth - includes control margins.
 * @property {number} gameHeight - includes control margins.
 * @property {number} imageWidth
 * @property {number} imageHeight
 */ 
/**
 * Size the game ensuring image can is a multiple of the possible slice counts and the displacement per click.
 * @returns {GameSize}
 */ 
function sizePuzzle() {
  const values = [...SLICE_COUNTS];
  values.push(DELTA_PER_CLICK);
  const lcm = hcje.utils.lowestCommonMultipleOfArray(values);
  let imageWidth = lcm * Math.round(PREFERRED_IMAGE_WIDTH / lcm);
  let imageHeight = lcm * Math.round(PREFERRED_IMAGE_HEIGHT / lcm);
  console.debug(`Image size for game ${imageWidth} x ${imageHeight}`);
  return {
    gameWidth: imageWidth + 2 * CONTROL_MARGIN,
    gameHeight: imageHeight + 2 * CONTROL_MARGIN,
    imageWidth,
    imageHeight,
  }
}

/** Size for games @type{GameSize} */
const GAME_SIZE = sizePuzzle();
const imageGenerator = new hcje.images.ImageGenerator();


/** Information markdown @type{string} */
const INFORMATION = `
HI!
Welcome to Dream Unraveller. This game was knocked up for the Unpolished Game Jam #4 on itch.io.
In the game you are presented with a image that you need to unravel using the buttons around the scene.

# Credits 

## Music

+ Background music: Troubadeck_14_Life_is_Hard.mp3 by [Abstraction](https://tallbeard.itch.io/music-loop-bundle); licensed as [Public Domain CC-0](https://creativecommons.org/publicdomain/zero/1.0/).

## Images

With the exception of the images listed below, all graphics and illustrations are by the author, Steve Butler.

+ Blue clouds derived from ["Above the clouds"](https://unsplash.com/photos/above-cloud-photo-of-blue-skies-yQorCngxzwI "blue clouds") by [Taylor Van Riper](https://unsplash.com/@taylorvanriper925); licensed under the [Unsplash license](https://unsplash.com/license)
+ Dark clouds derived from ["Stormy clouds in the Bay Area, California"](https://unsplash.com/photos/a-black-and-white-photo-of-clouds-in-the-sky-jItSiRZCkTg "stormy clouds") by [ Levi Meir Clancy](https://unsplash.com/@levimeirclancy); licensed under the [Unsplash license](https://unsplash.com/license)

# Privacy

No data are collected by this game and nothing is stored on your device. The game is served via [itch.io](https://itch.io) and you should refer to its privacy policy that the platform may collect.
`;


/** @typedef {number} SliceOrientation */
/**
 * @enum {SliceOrientation}
 */
const Orientation = {
  HORIZONTAL: 0, 
  VERTICAL: 1,
};


/** @typedef PuzzleDefinition
 * @property {PuzzleTypeValue} type
 * @property {string} url - image url for image types
 * @property {string} text - for text types of image.
 */

const PUZZLE_DEFINITIONS = [
  {
    url: './gamejam/dream_catcher.png',
    cellConfig: {jitter: 0 },
    cellPainter: hcje.images.imageCellPainter,
    backgroundUrl: './gamejam/taylor-van-riper-yQorCngxzwI-unsplash.jpg'
  },
  {
    url: './gamejam/hopesandfears.png',
    cellConfig: {jitter: 0 },
    cellPainter: hcje.images.imageCellPainter
  },
  {
    url: './gamejam/cloud_white.png',
    cellConfig: {jitter: 0.5, maxScale: 1.5, rowCount: 4},
    cellPainter: hcje.images.imageCellPainter,
    backgroundUrl: './gamejam/levi-meir-clancy-jItSiRZCkTg-unsplash.jpg'
  },
  {
    url: './gamejam/waves.png',
    cellConfig: {jitter: 0},
    cellPainter: hcje.images.imageCellPainter,
  },
  { 
    cellConfig: {jitter: 0.5, maxScale: 1.5, rowCount: 4, palette: PALETTE},
    cellPainter: hcje.images.textCellPainter,
    painterData: {fontName: '"Mochiy Pop P One"', text: ['DREAM', 'HOPE', 'FEAR']},
    backgroundUrl: './gamejam/levi-meir-clancy-jItSiRZCkTg-unsplash.jpg'
  },
  { 
    cellConfig: {jitter: 0.5, minScale: 0.5, maxScale: 1.5, rowCount: 5, palette: PALETTE },
    cellPainter: hcje.images.textCellPainter,
    painterData: {fontName: '"Mochiy Pop P One"', text: ['Z'], fill: true },
    backgroundUrl: './gamejam/levi-meir-clancy-jItSiRZCkTg-unsplash.jpg'
  }
];


/**
* Slice control. This controller manages a slice of an image allowing it to be moved vertically or horizontally
* depending on the orientation.
*/ 
class SliceControl {
  /** @type {function(boolean)} */
  #statusListener;
  /** @type {boolean} */
  #isVertical;
  /** @type {Element} */
  #container;
  /** @type {Element} */
  #sliceImage = document.createElement('div');
  
  /** @type {Element} */
  #buttonDecrease;
  /** @type {Element} */
  #buttonIncrease;

  /** Position of the slice in the image @type {module:hcje/utils~Position} */
  #slicePositionInImage;
  /** The amount the image in the slice has been displaced. @type{number} */
  #displacement = 0;

  /** @type {number} */
  #sliceSize;
  /** Index of slice in the image. @type {number} */
  #sliceIndex;
  /** @type {number} */
  #controlMargin;
  /** Width of image @type {number} */
  #imageWidth;
  /** Height of image @type {number} */
  #imageHeight;
  /** Amount to displace image per click @type{number} */
  #deltaPerClick;


  /**
   * Create a slice control for the game.
   * @param {Object} config
   * @param {string} config.url - url for the background image.
   * @param {number} config.imageWidth
   * @param {number} config.imageHeight
   * @param {number} config.sliceSize - either horizontal or vertical size of slice; depends on the config.vertical flag.
   * @param {module:mainGame~SliceOrientation} config.orientation - slice orientation
   * @param {number} config.sliceIndex - index of the slice.
   * @param {number} config.controlMargin - size of the margin allowed for the slice controls.
   * @param {number} config.deltaPerClick -amount to displace image per click.
   */ 
  constructor(config) {
    this.#isVertical = config.orientation === Orientation.VERTICAL;
    this.#container = document.createElement('div');
    this.#container.className = `slice-control slice-control--${this.#isVertical ? 'vertical' : 'horizontal'}`;
    this.#sliceImage = document.createElement('div');
    this.#sliceImage.className = 'slice-image';
    this.#sliceImage.style.backgroundImage = `url(${config.url})`;
    this.#sliceSize = config.sliceSize;
    this.#controlMargin = config.controlMargin;
    this.#imageWidth = config.imageWidth;
    this.#imageHeight = config.imageHeight;
    this.#deltaPerClick = config.deltaPerClick;
    this.#sliceIndex = config.sliceIndex;

    if (this.#isVertical) {
      this.#slicePositionInImage = {x: this.#sliceIndex * this.#sliceSize, y: 0};
      this.#buttonDecrease = hcje.domTools.createButton({
        label:  'Up',
        url: './hcje/assets/images/buttons_up.png',
        listener: () => this.#changeDisplacement(-this.#deltaPerClick)
      });
      this.#buttonIncrease = hcje.domTools.createButton({
        label:  'Down',
        url: './hcje/assets/images/buttons_down.png',
        listener: () => this.#changeDisplacement(this.#deltaPerClick)
      });
    } else {
      this.#slicePositionInImage = {x: 0, y: this.#sliceIndex * this.#sliceSize};
      this.#buttonDecrease = hcje.domTools.createButton({
        label:  'Left',
        url: './hcje/assets/images/buttons_left.png',
        listener: () => this.#changeDisplacement(-this.#deltaPerClick)
      });
      this.#buttonIncrease = hcje.domTools.createButton({
        label:  'Right',
        url: './hcje/assets/images/buttons_right.png',
        listener: () => this.#changeDisplacement(this.#deltaPerClick)
      });
    }

    // sizeContainer();
    this.#sizeButton(this.#buttonDecrease);
    this.#sizeImage();
    this.#sizeButton(this.#buttonIncrease);

    this.#container.appendChild(this.#buttonDecrease);
    this.#container.appendChild(this.#sliceImage);
    this.#container.appendChild(this.#buttonIncrease);
    this.#changeDisplacement(0);
    if (this.#isVertical) {
      this.#container.style.left = `${this.#slicePositionInImage.x + this.#controlMargin}px`;
      this.#container.style.top = `${this.#slicePositionInImage.y}px`;
    } else {
      this.#container.style.left = `${this.#slicePositionInImage.x}px`;
      this.#container.style.top = `${this.#slicePositionInImage.y + this.#controlMargin}px`;
    }
  }

  /**
   * Change button size to fit slice control.
   * @param {Element} button
   */
  #sizeButton(button) {
    if (this.#isVertical) {
      button.style.width = `${this.#sliceSize}px`;
      button.style.height = `${this.#controlMargin}px`;
    } else {
      button.style.width = `${this.#controlMargin}px`;
      button.style.height = `${this.#sliceSize}px`;
    }
  }

  /** 
   * Size the image.
   */
  #sizeImage() {
    if (this.#isVertical) {
      this.#sliceImage.style.width = `${this.#sliceSize}px`;
      this.#sliceImage.style.height = `${this.#imageHeight}px`; 
    } else {
      this.#sliceImage.style.width = `${this.#imageWidth}px`;
      this.#sliceImage.style.height = `${this.#sliceSize}px`; 
    }
  }

  /** 
   * Size the container.
   */
  #sizeContainer() {
    if (this.#isVertical) {
      this.#container.style.width = `${this.#sliceSize}px`;
      this.#container.style.height = `${this.#imageHeight + 2 * this.#controlMargin}px`; 
    } else {
      this.#container.style.width = `${this.#imageWidth + 2 * this.#controlMargin}px`;
      this.#container.style.height = `${this.#sliceSize}px`; 
    }
  }

  /** 
   * Change the image offset.
   * @param {number} delta - amount to change.
   */ 
  #changeDisplacement(delta) {
    this.#displacement += Math.floor(delta);
    let displacementX = 0;
    let displacementY = 0;
    if (this.#isVertical) {
      if (this.#displacement % this.#imageHeight === 0) {
        this.#displacement = 0;
      }
      displacementY = this.#displacement;
    } else {
      if (this.#displacement % this.#imageWidth === 0) {
        this.#displacement = 0;
      }
      displacementX = this.#displacement;
    }
    this.#sliceImage.style.backgroundPosition = 
      `${-this.#slicePositionInImage.x + displacementX}px ${-this.#slicePositionInImage.y + displacementY}px`;
    console.debug(`Displacement ${this.#displacement}`);
    if (this.#displacement === 0) {
      this.#container.classList.add('slice-control--correct');
    } else {
      this.#container.classList.remove('slice-control--correct');
    }
    this.#statusListener?.(this.#displacement === 0);
  }



  /**
   * Randomise the slice displacement.
   */
  randomiseDisplacement() {
    const maxClicks = this.#isVertical ? this.#imageHeight / this.#deltaPerClick : this.#imageWidth / this.#deltaPerClick;
    this.#displacement = 0;
    this.#changeDisplacement(this.#deltaPerClick * hcje.utils.getRandomIntExclusive(1, maxClicks));
  }

  /**
   * Test if image in slice is in its correct position.
   * @return {boolean}
   */
  isCorrect() {
    return this.#displacement === 0;
  }

  /**
   * Add status listener.
   * @param {function(boolean)} statusListener
   */
  addStatusListener(listener) {
    this.#statusListener = listener;
  }

  /**
   * Get the container element.
   * @returns {Element}
   */
  getElement() {
    return this.#container;
  }

  /**
   * Enable displacement buttons.
   */
  enable() {
    this.#buttonDecrease.disabled = false;
    this.#buttonIncrease.disabled = false;
  }
  /**
   * Disable displacement buttons.
   */
  disable() {
    console.debug(`Disable button`);
    this.#buttonDecrease.disabled = true;
    this.#buttonIncrease.disabled = true;
  }

}

/**
 * Slice up an image.
 * @param {SliceOrientation} orientation.
 * @param {Object} config
 * @param {number} config.imageWidth
 * @param {number} config.imageHeight
 * @param {string} config.count - number of slices
 * @param {number} config.controlMargin
 * @returns {Array<module:mainGame~SliceControl}
 */
function sliceUpImageInDirection(orientation, config) {
  const slices = [];
  let sliceSize;
  if (orientation === Orientation.VERTICAL) {
    sliceSize = config.imageWidth / config.count;
  } else {
    sliceSize = config.imageHeight / config.count;
  }

  for (let index = 0; index < config.count; index++) {
    slices.push(new SliceControl({
      orientation,
      deltaPerClick: config.deltaPerClick,
      url: config.url,
      imageWidth: config.imageWidth, 
      imageHeight: config.imageHeight,
      controlMargin: config.controlMargin,
      sliceSize,
      sliceIndex: index
    }));
  }
  return slices;
}

/**
 * Slice up an image in both horizontal and vertical directions.
 * @param {Object} config
 * @param {string} config.url - image url
 * @param {number} config.imageWidth
 * @param {number} config.imageHeight
 * @param {string} config.verticalCount - number of slices
 * @param {string} config.horizontalCount - number of slices
 * @param {number} config.controlMargin
 * @param {number} config.deltaPerClick - amount to displace per click.
 * @returns {Array<module:mainGame~SliceControl}
 */
function sliceUpImage(config) {
  config.count = config.verticalCount;
  const verticalSlices = sliceUpImageInDirection(Orientation.VERTICAL, config);
  config.count = config.horizontalCount;
  const horizontalSlices = sliceUpImageInDirection(Orientation.HORIZONTAL, config);
  return verticalSlices.concat(horizontalSlices);
}

/**
 * Create an Image element
 * @param {string} url
 * @param {Promise} fulfils to HTMLImageElement
 */
function createImageElement(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.addEventListener('load', () => {
      console.debug(`Loaded ${url}`);
      resolve(img);
    });
    img.src = url;
  });
}

/**
 * Create puzzle image.
 * @param {PUzzleDefinition} definition
 * @param {module:hcje/utils~Dimension} imageSize
 * @returns {Promise} fulfils to object url string.
 */
function createPuzzleImage(definition, imageSize) {
  imageGenerator.revokeAll();
  const imageDefinition = {
    imageSize: imageSize,
    cellPainter: definition.cellPainter,
    cellConfig: definition.cellConfig,
    custom: definition.painterData ?? {},
  }
  if (definition.url) {
    return createImageElement(definition.url)
      .then((img) => {
        imageDefinition.custom.image = img;
        return imageGenerator.createObjectUrl(imageDefinition);
      })
  } else {
    return imageGenerator.createObjectUrl(imageDefinition);
  }

}


/**
 * Create a puzzle.
 * @param {number} puzzlesSolved - number of puzzles solved.
 * @param {Object} config
 * @param {module:hcje/domTools~GameArea} config.gameArea;
 * @param {number} config.verticalSlices
 * @param {number} config.horizontalSlices
 */ 
function createPuzzle(puzzlesSolved, config) {
  const imageWidth = GAME_SIZE.imageWidth;
  const imageHeight = GAME_SIZE.imageHeight;
  let resolution;
  let allSlices;

  /** 
   * Handle a slice update.
   * @param {boolean} correct - is slice correct.
   */ 
  function statusUpdate(correct) {
    if (!correct) {
      console.debug(`Slice shifted but not correct.`);
      return;
    } else {
      for (const slice of allSlices) {
        if (!slice.isCorrect()) {
          return;
        }
      }
      for (const slice of allSlices) {
        slice.disable();
      }
      console.debug(`All slices are correct.`);
      resolution?.();
    }
  }

  config.gameArea.removeAllChildren();
  console.debug('Create puzzle');
  const puzzleDefinition = PUZZLE_DEFINITIONS[puzzlesSolved % PUZZLE_DEFINITIONS.length];
  return createPuzzleImage(puzzleDefinition, {width: imageWidth, height: imageHeight})
    .then((url) => {
      allSlices = sliceUpImage({url, imageWidth, imageHeight,
        verticalCount:config.verticalSlices,
        horizontalCount: config.horizontalSlices,
        controlMargin: CONTROL_MARGIN,
        deltaPerClick: DELTA_PER_CLICK,
      });
      return new Promise((resolve) => {
        resolution = resolve;
        const background = hcje.domTools.createChild(config.gameArea, 'div', 'image-background');
        background.style.left = `${CONTROL_MARGIN}px`;
        background.style.top = `${CONTROL_MARGIN}px`;
        background.style.width = `${imageWidth}px`;
        background.style.height = `${imageHeight}px`;
        background.style.backgroundColor = hcje.utils.getRandomMember(PALETTE);
        if (puzzleDefinition.backgroundUrl) {
          background.style.background = `no-repeat center url(${puzzleDefinition.backgroundUrl})`;
        }
        for (const slice of allSlices) {
          //slice.randomiseDisplacement();
          config.gameArea.appendChild(slice.getElement());
          slice.addStatusListener(statusUpdate);
        }
      })
    });
}



/**
 * Add CSS success effect.
 * @param {module:domTools~GameArea} gameArea
 * @parma {string} color - CSS color
 * @param {number} durationMs - duration in milliseconds
 * @returns {Promise}
 */
function showSuccessEffect(gameArea, color, durationMs) {
  const effect = document.createElement('div');
  gameArea.appendChild(effect);
  effect.style.position = 'absolute';
  effect.style.zIndex = 1000;
  effect.style.left = '50%';
  effect.style.top = '50%';
  effect.style.transform = 'translate(-50%, -50%)';
  effect.style.width = '4px';
  effect.style.height = '4px';
  effect.style.opacity = '1';
  effect.style.boxShadow = `${color} 0 0 10px 10px`;  
  effect.style.backgroundColor = color;
  effect.style.borderRadius = '50%';
  effect.style.transition = `width ${durationMs}ms linear, height ${durationMs}ms linear, opacity ${durationMs}ms linear `;
  setTimeout(() => {
    const dims = gameArea.getDesignDims();
    effect.style.width = `${dims.width}px`;
    effect.style.height = `${dims.height}px`;
    effect.style.opacity = '0';
  }, 0);
  return hcje.utils.sleep(durationMs)
    .then(() => effect.remove());
}


/**
 * Main game loop.
 */ 
async function gameLoop() {
  const gameSize = sizePuzzle(DELTA_PER_CLICK)

  const gameArea = new hcje.domTools.GameArea({
    width: GAME_SIZE.gameWidth,
    height: GAME_SIZE.gameHeight,
    margin: 10,
  });
  let puzzlesSolved = 0;
  while (true) {
    const sliceIndex = Math.floor(puzzlesSolved / PUZZLE_DEFINITIONS.length);
    let horizontalSlices;
    let verticalSlices;
    if (sliceIndex >= SLICE_COUNTS.length) {
      horizontalSlices = hcje.utils.getRandomMember(SLICE_COUNTS);
      verticalSlices = hcje.utils.getRandomMember(SLICE_COUNTS);
    } else {
      horizontalSlices = SLICE_COUNTS[sliceIndex];
      verticalSlices = SLICE_COUNTS[sliceIndex];
    }
    await createPuzzle(puzzlesSolved, {gameArea, verticalSlices, horizontalSlices})
      .then(() => showSuccessEffect(gameArea, 'yellow', 500))
      .then(() => hcje.utils.sleep(2000))
      .then(() => hcje.domTools.createDialog({
        title: `Woohoo!`,
        markdown: `You cracked it. Nice. Let's try another`,
        buttonDefns: [ {id:'ok', label: 'OK', url: './hcje/assets/images/buttons_ok.png'}]
      }));
    puzzlesSolved++;
  }
}


/**
 * Set up the menu bar.
 */
function createMenuBar() {
  hcje.domTools.createMenuBar({
    parentElement: document.body,
    opener: hcje.domTools.createButton({
      url: './hcje/assets/images/buttons_menu.png',
      label: 'Menu'
    }),
    closer: hcje.domTools.createButton({
      url: './hcje/assets/images/buttons_cancel.png',
      label: 'Close menu'
    }),
    children: [
      hcje.domTools.createButton({
        url: './hcje/assets/images/buttons_info.png',
        label: 'Information',
        listener: () => hcje.domTools.createDialog({
          title: 'Information',
          markdown: INFORMATION,
          buttonDefns: [ {id:'ok', label: 'OK', url: './hcje/assets/images/buttons_ok.png'}]
        })
      })
    ]
  });

}

const dialog = hcje.domTools.createDialog({
  title: 'Unpolished game jam #4',
  className: 'test-class',
  markdown:"I've been dreaming or possibly having nightmares. Can you unravel my dream. Tap the arrows to unravel it.",
  buttonDefns: [ {id:'ok', label: 'OK', url: './hcje/assets/images/buttons_ok.png'}]
})
  .then(() => createMenuBar())
  .then(() => {hcje.audio.addMusic({
      url: './gamejam/Troubadeck_14_Life_is_Hard.mp3',
      key: 'BACKGROUND',
      fadeSeconds: 0.5
    })
    hcje.audio.startMusic('BACKGROUND');
  })
  .then(() => gameLoop());



