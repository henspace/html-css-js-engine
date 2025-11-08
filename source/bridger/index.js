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
 * @module bridger
 * @description
 * Bridger is a simple test game for the hcje engine.
 * It's supposed to be based on an old Amstrad game. I think it was called Bridge-It but the screenshots I've seen do
 * not match my recollection. In this game, rather than a long bridge, I've used rocks in space. This is all based on 
 * my poor memory.
 */

import * as hcje from '../hcje/scripts/hcje.js';

/** Drop initial speed @type {number} */
const DROP_VY = 20;
/** Drop acceleration @type {number} */
const DROP_AY = 100;
/** Walk speed @type {number} */
const WALK_VX = 50;

/**
 * Create the texture manager.
 * @param {module:hcje/domTools~GameArea} gameArea - the main area for the game.
 * @param {string} textureDataUrl - url of the texture JSON file.
 * @param {string} textureUrl - url of the texture image.
 * @returns {Promise} fulfils to module:hcje/sprites~TextureManager
 */ 
function createTextureManager(gameArea, textureDataUrl, textureUrl) {
  return hcje.sprites.loadSpriteSheet(textureDataUrl, textureUrl,
    new hcje.domTools.TimeLimitedBusyIndicator({
      label:'loading',
      timeoutS: 15,
      timeoutMessage: 'Failed to load sprite sheet in time. Click OK to keep waiting.'
    }))
    .then((textureManager) => {
      textureManager.spriteFactory = new hcje.sprites.DomSpriteFactory(gameArea);
      return textureManager;
    });
}


/**
 * Create a walker.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite}
 */
function createWalker(textureManager) {
  const sprite = textureManager.createSprite('sprites_spaceman.png', [
    {name:'walk', interval:(dynamics) => hcje.sprites.Sprite.deriveWalk(dynamics, 2)},
    {
      name:'fall', interval: 100, 
      cycleType: hcje.sprites.CycleType.OSCILLATE
    }
  ]);
  sprite.dynamics = new hcje.sprites.Dynamics();
  return sprite;
}

/**
 * Create a rock.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite}
 */
function createRock(textureManager) {
  const sprite = textureManager.createSprite('sprites_rock.png');
  sprite.dynamics = new hcje.sprites.Dynamics();
  return sprite;
}

/**
 * Create a scaffold.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite}
 */
function createScaffold(textureManager) {
  const sprite = textureManager.createSprite('sprites_scaffold.png');
  sprite.dynamics = new hcje.sprites.Dynamics();
  return sprite;
}


/**
 * Create a complete bridge.
 * @param {module:hcje/sprites~Animator} animator - animator for the sprites.
 * @param {module:hcje/domTools~GameArea} gameArea - the main area for the game.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite[]} 
 */
function createBridge(animator, gameArea, textureManager) {
  const gameDims = gameArea.designDims;
  const bridge = [];
  let rock = createRock(textureManager);
  bridge.push(rock);
  animator.addTarget(rock);
  const rockWidth = bridge[0].dimensions.width;
  const rockCount = Math.ceil(gameDims.width / rockWidth);
  for (let rockIndex = 0; rockIndex < rockCount; rockIndex++) {
    if (rockIndex >0) {
      rock = createRock(textureManager);
      bridge.push(rock);
      animator.addTarget(rock);
    }
    bridge[rockIndex].position = {x: rockIndex * rockWidth, y: Math.floor(gameDims.height / 2)};
  }
  return bridge;
}

/**
 * Break the bridge. The animator is paused at the end.
 * @param {Object} config
 * @param {module:hcje/utils~RectData} config.gameBounds - boundary for the game.
 * @param {module:hcje/sprites~Animator} config.animator - animator for the sprites.
 * @param {module:hcje/sprites~Sprite[]} config.bridge - the array of rocks that form the bridge from left to right.
 * @param {number} [config.gaps = 2] - number of gaps in the bridge.
 * @param {number} [config.leadIn = 2] - number of rocks at the left that are guaranteed to be unbroken.
 * @returns {Promise} fulfils to an array of the bridge positions where there are gaps in ascending order.
 */
function breakBridge(config) {
  const promises = []
  const indexes = [];
  const gaps = config?.gaps || 2;
  const leadIn = config?.leadIn || 2;
  for (let n = leadIn; n < config.bridge.length - 1; n++) {
    indexes.push(n);
  }
  hcje.utils.shuffle(indexes);
  
  const gapIndexes = [];
  for (let gap = 0; gap < gaps; gap++) {
    const index = indexes[gap];
    gapIndexes.push(index);
    const brokenRock = config.bridge[index];
    brokenRock.dynamics.vy = DROP_VY;
    brokenRock.dynamics.ay = DROP_AY;
    const promise = new Promise((resolve) => {
      const adjuster = new hcje.sprites.TerminateOutOfBounds(brokenRock, config.gameBounds); 
      adjuster.onCompletion = (reason) => resolve();
      brokenRock.adjuster = adjuster;
    });
    promises.push(promise);
  }
  
  config.animator.active = true;
  return Promise.all(promises)
    .then(() => {
      config.animator.active = false;
      return gapIndexes.sort((a, b) => a - b);
    });
}

/**
 * Fill in the gaps in the bridge. Animator is activated to move the sprites but then deactivated.
 * @param {Object} config
 * @param {module:hcje/sprites~Animator} config.animator - used to move sprites.
 * @param {module:hcje/sprites~Sprite[]} config.bridge - the array of rocks that form the bridge from left to right.
 * @param {number} config.floorY - y position of the top of the bridge..
 * @returns {Promise}
 */ 
function repairBridge(config) {
  const promises = [];
  for (const rock of config.bridge) {
    const rockDims = rock.dimensions;
    if (rock.position.y !== config.floorY) {
      rock.dynamics.vy = DROP_VY;
      rock.dynamics.ay = DROP_AY;
      rock.position = {x: rock.position.x, y: -rockDims.height, angle: 0};
      const promise = new Promise((resolve) => {
        const adjuster = new hcje.sprites.ReachTargetXY(rock, rock.position.x, config.floorY); 
        adjuster.onCompletion = (reason) => resolve();
        rock.adjuster = adjuster;
      });
      promises.push(promise);
    } 
  }
  config.animator.active = true;
  return Promise.all(promises);
} 

/**
 * Find no go indices for a walker following a leader.
 * @param {number} leaderIndex - the index of the current leader in a procession.
 * @param {number[]} bridgeGaps - left to right array of indices in ascending order in the bridge where there are
 * gaps.
 * @returns {number[]} 
 */
function findNoGoIndices(leaderIndex, bridgeGaps) {
  let noGoIndices = [];
  for (let n = 1; n < bridgeGaps.length; n++) {
    const gapIndex = bridgeGaps[n];
    for (let lookBehind = n - 1; lookBehind >= 0; lookBehind--) {
      const noGoIndex = leaderIndex + gapIndex - bridgeGaps[lookBehind]; 
      noGoIndices.push(noGoIndex);
      noGoIndices.push(noGoIndex - 1);
      noGoIndices.push(noGoIndex + 1);
    }
  }
  return noGoIndices;
}

/** 
 * Position a walker.
 * @param {number} startIndex - first possible starting position.
 * @param {number[]} noGoIndices - indices where a walker cannot be placed.
 * @returns {number} index where walker should be placed.
 */
function getWalkerIndex(startIndex, noGoIndices) {
  while (noGoIndices.includes(startIndex)) {
    startIndex++;    
  }
  return startIndex;
}
/**
 * Create the procession of walkers who are crossing the bridge.
 * @param {number} count - the number of walkers on the bridge.
 * @param {number[]} bridgeGaps - left to right array of positions in ascending order in the bridge where there are
 * undefined.
 * @param {Object} [options]
 * @param {number} [options.minGap = 1] - minimum spacing between walkers.
 * @param {number} [options.maxGap = 3] - maximum gap between walkers. This may not be respected if the gaps in the bridge 
 *  means the gap needs to be increased.
 */
function getProcessionIndices(count, bridgeGaps, options) {
  const minGap = options?.minGap ?? 1;
  const maxGap = options?.maxGap ?? 1;
  const processionIndices = [0];
  let leaderIndex = 0;
  let noGoIndices = [];
  while (--count) {
    noGoIndices = [...noGoIndices, ...findNoGoIndices(leaderIndex, bridgeGaps)];
    const startIndex = hcje.utils.getRandomIntInclusive(leaderIndex + 1 + minGap, leaderIndex + 1 + maxGap);
    leaderIndex = getWalkerIndex(startIndex, noGoIndices);  
    processionIndices.push(leaderIndex);
  }
  console.debug(`  Bridge gaps: ${bridgeGaps.join(', ')}`);
  console.debug(`No go indices: ${noGoIndices.join(', ')}`);
  console.debug(`   Procession: ${processionIndices.join(', ')}`);
  return processionIndices;
}

/**
 * Result of a procession.
 * @typedef {Object} ProcessionResult
 * @property {boolean} success - true if everyone got across.
 * @property {number} count - number who successfully crossed.
 */
/**
 * Create a procession of walkers.
 * @param {Object} config
 * @param {module:hcje/sprites~Animator} config.animator - game animator.
 * @param {number[]} config.bridgeGaps - indices of gaps in the bridge.
 * @param {number} config.floorY - y position for where the walkers are placed.
 * @param {module:hcje/utils~RectData} config.gameBounds - design boundary for the game.
 * @param {number[]} config.indices - indices of the procession.
 * @param {number} config.rockWidth - width of a bridge gap or rock.
 * @param {module:hcje/sprites~Sprite} config.scaffold - the scaffold that fills the gap.
 * @param {Scoreboard} config.scoreboard - element holding current score.
 * @param {module:hcje/sprites~TextureManager} config.textureManager - manager used to create sprites.
 * @param {number} config.walkSpeed - walk speed px/s.
 * @returns {Promise} Fulfils to ProcessionResult.
 */
function startProcession(config) {
  const promises = [];
  const result = {
    success: false,
    count: 0,
  };
  const walkerCount = config.indices.length;

  for (const index of config.indices) {
    const walker = createWalker(config.textureManager);
    walker.position = {
      x: -index * config.rockWidth, 
      y: config.floorY - walker.dimensions.height
    }
    walker.dynamics.vx = config.walkSpeed;

    config.animator.addTarget(walker);
    const adjuster = new WalkerAdjuster(walker, {
      bridgeGaps: config.bridgeGaps,
      gameBounds: config.gameBounds,
      onCompletion: (reason) => console.debug(`Walker completed: ${reason}`),
      rockWidth: config.rockWidth,
      scaffold: config.scaffold
    });
    walker.adjuster = adjuster;
    const promise = new Promise((resolve) => {
      adjuster.onCompletion = (reason) => {
        console.debug(`Walker completed: ${reason}`);
        if (reason == 'CROSSED') {
          result.count++;
          console.debug(`Walker crossed. ${result.count}/${walkerCount}`);
          config.scoreboard.increment();
          if (result.count === walkerCount) {
            result.success = true;
            resolve(result);
          }
        } else {
          console.debug(`Walker fell. ${result.count}/${walkerCount}`);
          resolve(result);
        }
      }
    });
    promises.push(promise);
  }
  config.animator.active = true;
  return Promise.any(promises);
} 


/**
 * Drop in the scaffold. The animator is stopped once the scaffold has dropped in.
 * @param {Object} config
 * @param {module:hcje/sprites~Animator} config.animator - animator to drop in the sprite.
 * @param {number} config.floorY - top of the bridge.
 * @param {module:hcje/sprites~Sprite} config.scaffold - the scaffold to drop in.
 * @returns {Promise}
 */
function dropInScaffold(config) {
  const scaffoldDims = config.scaffold.dimensions;
  config.scaffold.position = {x: 0, y: -scaffoldDims.height, angle: 0};
  const adjuster = new hcje.sprites.ReachTargetXY(config.scaffold, 0, config.floorY);
  config.animator.addTarget(config.scaffold);
  config.scaffold.adjuster = adjuster;
  config.scaffold.dynamics.vy = DROP_VY;
  config.scaffold.dynamics.ay = DROP_AY;
  return new Promise((resolve) => {
    adjuster.onCompletion = () => resolve();
    config.animator.active = true;
  }).then(()=> config.animator.active = false);
  
}


/** 
 * Show the completion/try again dialog.
 * @param {module:bridger~ProcessionResult} result - result of game.
 * @return {Promise}
 */
function showResult(result) {
  const saved = result.count;
  return hcje.domTools.createDialog({
    title: 'Game over',
    text: `You managed to get ${saved} ${saved === 1 ? 'person' : 'people'} across. Better luck next time.`,
    buttonDefns: [{label: 'Try again', id: 'AGAIN'}]
  });
}

/**
 * Add left and right control buttons.
 */ 
function addControlButtons(gameArea) {
  const left = new hcje.domTools.Button({
    parentElement: gameArea,
    className: 'bridger-control',
    url: './hcje/assets/buttons_left.png',
    label: 'Move left',
    onClick: () => hcje.device.Keyboard.simulateKeydown('ArrowLeft')
  });
  const right = new hcje.domTools.Button({
    parentElement: gameArea,
    className: 'bridger-control',
    url: './hcje/assets/buttons_right.png',
    label: 'Move right',
    onClick: () => hcje.device.Keyboard.simulateKeydown('ArrowRight')
  });
  left.classList.add('bridger-control--left');
  right.classList.add('bridger-control--right');
  
}

/**
 * The main game loop
 * @param {module:hcje/domTools~GameArea} gameArea - the main area for the game.
 * @param {module:hcje/sprites~TextureManager} textureManager - texture manager for sprite creation.
 */
async function gameLoop(gameArea, textureManager) {
  let walkerCount = 1;
  let gapCount = 2;
  let walkers = [];
  let playing = true;
  const scoreboard = new Scoreboard('People across ', '');
  gameArea.appendChild(scoreboard);
  addControlButtons(gameArea);
  const animator = new hcje.sprites.Animator();
  const bridge = createBridge(animator, gameArea, textureManager);
  const rockFloor = bridge[0].position.y;
  const rockWidth = bridge[0].dimensions.width;
  const scaffold = createScaffold(textureManager);
  await dropInScaffold({
    animator, 
    scaffold,
    floorY: rockFloor
  });
  scaffold.adjuster = new ScaffoldAdjuster(scaffold, {bridge, speed: 500 });
  while (playing) {
    animator.active = false;
    const bridgeGaps = await breakBridge({gameBounds: gameArea.designBounds, animator, bridge, gaps: gapCount});
    const processionIndices = getProcessionIndices(walkerCount, bridgeGaps);
    await startProcession({
      animator,
      gameBounds: gameArea.designBounds,
      bridgeGaps,
      indices: processionIndices,
      floorY: rockFloor,
      rockWidth,
      scaffold,
      scoreboard,
      textureManager,
      walkSpeed: WALK_VX, 
    })
      .then((result) => {
        if (result.success) {
          walkerCount++;
        } else {
          return showResult(result);
        }
      }) 
      .then(() => repairBridge({
          animator,
          bridge,
          floorY: rockFloor
        }));
  }
}

/**
 * @implements module:hcje/sprites~SpriteAdjuster
 */ 
class WalkerAdjuster extends hcje.sprites.BaseSpriteAdjuster {
  /** Bottom of screen when item drops off screen. @type {number} */
  #bottom;
  /** Indices of the gaps in the bridge @type {number[]} */
  #bridgeGaps;
  /** Complete flag @type {boolean} */
  #complete;
  /** Flag for when falling. @type {boolean} */
  #falling;
  /** Callback function on completion @type {function(string)} */
  onCompletion;
  /** Right side that needs to be reached @type {number} */
  #right;
  /** Width of a rock @type {number} */
  #rockWidth;
  /** @type {module:hcje/sprites~Sprite} */
  #scaffold;

  /** 
   * Construct the walker handler.
   * @param {module:hcje/sprites~Sprite} sprite - the target walker sprite.
   * @param {Object} config
   * @param {number[]} config.bridgeGaps - indices in the bridge where there are gaps.
   * @param {function(string)} [config.onCompletion] - function that is called with the reason for completion. This is 
   * either 'FELL' or 'CROSSED'.
   * @param {module:hcje/utils~RectData} config.gameBounds - game bounds.
   * @param {number} config.rockWidth - the width of a bridge rock.
   * @param {module:hcje/sprites~Sprite} scaffold - the scaffold that can support the walker over gaps.
   */
  constructor(sprite, config) {
    super(sprite);
    this.#bridgeGaps = config.bridgeGaps;
    this.onCompletion = config.onCompletion;
    this.#right = config.gameBounds.x + config.gameBounds.width;
    this.#bottom = config.gameBounds.y + config.gameBounds.height;
    this.#rockWidth = config.rockWidth;
    this.#falling = false;
    this.#scaffold = config.scaffold;
  }
  /**
   * @borrows module:hcje/sprites~SpriteAdjuster#adjust
   */
  adjust(timeStamp, deltaT) {
    const sprite = this._sprite;
    const position = sprite.position;
    let reason;
    if (position.x > this.#right && sprite.dynamics.vy === 0) {
      reason = 'CROSSED';
    }
    if (position.y > this.#bottom) {
      reason = 'FELL';
    }
    if (reason) {
      this.markComplete(reason);
      sprite.kill();
      return;
    }
    const centreX = position.x + sprite.dimensions.width / 2;
    const bridgeIndex = Math.floor(centreX / this.#rockWidth); 
    if (!this.#falling && this.#bridgeGaps.includes(bridgeIndex)) {
      const scaffoldBounds = this.#scaffold.bounds;
      if (centreX < scaffoldBounds.x || centreX > scaffoldBounds.x + scaffoldBounds.width) {
        this.#falling = true;
        sprite.dynamics.vAngle = 3;
        sprite.dynamics.vy = 40;
        sprite.dynamics.ay = 100;
        sprite.state = 'fall';
      }
    }
  }
}


/**
 * Scaffold adjuster. Moves the scaffold according to keypresses.
 */
export class ScaffoldAdjuster extends hcje.sprites.BaseSpriteAdjuster {
  /** Bridge @type {module:hcje/sprites~Sprite[]}  */
  bridge;
  /** Keyboard handler @type {module:hcje/device~Keyboard} */
  #keyboard;
  /** Scaffold gap index @type {number} */
  #index;
  /** Last x @type {number} */
  #lastX;
  /** Amount scaffold overlaps gaps @type {number} */
  #overlap;
  /** Target x position @type {number} */
  #targetX;
  /** velocity x @type {number} */
  #vx;
 

  /**
   * Construct the adjuster
   * @param {module:hcje/sprites~Sprite} sprite - the target scaffold sprite.
   * @param {Object} config
   * @param {module:hcje/sprites~Sprite[]} config.bridge - the bridge that is filled in by the scaffold.
   * @param {string[]} [config.leftKeys = ['a','A', 'ArrowLeft']] - Array of string representations of keys to move
   *   left. An uppercase listener is added
   * @param {string[]} [config.rightKeys = ['d','D', 'ArrowRight']] - Array of string representations of keys to move
   *   right.
   * @param {module:hcje/sprites~Sprite} config.scaffold - scaffold sprite.
   * @param {number} speed - movement speed.
   *
   */
  constructor(sprite, config) {
    super(sprite);
    this.bridge = config.bridge;
    this.#vx = Math.abs(config.speed);
    this.#index = 0;
    this.#lastX = 0;
    this.#overlap = 0.5 * (sprite.dimensions.width - config.bridge[0].dimensions.width);
    this.#keyboard = new hcje.device.Keyboard();
    for (const key of config.leftKeys ?? ['a', 'A', 'ArrowLeft']) {
      this.#keyboard.addDownListener(key, () => this.moveLeft());
    }
    for (const key of config.rightKeys ?? ['d', 'D', 'ArrowRight']) {
      this.#keyboard.addDownListener(key, () => this.moveRight());
    }
  }

  /** @borrow module:hcje/sprites~BaseSpriteAdjuster#adjust */
  adjust(timeStamp, deltaT) {
    const sprite = this._sprite;
    if (this.#targetX === undefined) {
      return;
    }
    const position = sprite.position;
    if (this.#vx > 0 && position.x < this.#targetX) {
      sprite.dynamics.vx = this.#vx;
    } else if (this.#vx < 0 && position.x > this.#targetX) {
      sprite.dynamics.vx = this.#vx;
    } else {
      sprite.dynamics.vx = 0;
      position.x = this.#targetX;
      this.#targetX = undefined;
    }
    this.#lastX = position.x;
  }

  /** 
   * Update target x position.
   */ 
  #updateTargetX() {
    this.#targetX = this.bridge[this.#index].position.x - this.#overlap;
    this.#vx = this.#targetX >= this.#lastX ? Math.abs(this.#vx) : -Math.abs(this.#vx);
  }

  /**
   * Move the scaffold right
   */
  moveRight() {
    if (this.#index < this.bridge.length - 1) {
      this.#index++;
      this.#updateTargetX();
    }
  }
  /**
   * Move the scaffold left
   */
  moveLeft() {
    if (this.#index > 0) {
      this.#index--;
      this.#updateTargetX();
    }  
  }
}

/**
 * Simple Score element
 */
class Scoreboard extends hcje.domTools.TextElement {
  /** Prefix added to text. @type {string} */
  prefix;
  /** Prefix added to text. @type {string} */
  suffix;
  /** Current score @type {number} */
  #score;

  /**
   * Construct the score board.
   * @param {string} [prefix = ''] - text added at beginning of score.
   * @param {string} [suffix = ''] - text added at end of score.
   */
  constructor(prefix = '', suffix = '') {
    super('div');
    this.prefix = prefix;
    this.suffix = suffix;
    this.#score = 0;
    this.classList.add('bridger-score');
    this.#updateText();
  }

  /**
   * Update the displayed text.
   */
  #updateText() {
    this.innerText = `${this.prefix}${this.#score}${this.suffix}`;
  }

  /**
   * Increment the score.
   */
  increment() {
    this.#score++;
    this.#updateText();
  }

  /**
   * Clear the score.
   */ 
  clear() {
    this.#score = 0;
    this.#updateText();
  }

}

/**
 * Show welcome page.
 * @returns {Promise}
 */
function showWelcome(gameArea) {
  const container = document.createElement('div');
  container.className = 'bridger-welcome';

  const welcome = new hcje.domTools.TextElement();
  welcome.classList.add('bridger-welcome__text');
  welcome.setMarkdown( 
` # Welcome to Space Bridger

Your job is to get the spacemen across the meteors by moving the platform.

Use the A, D or arrow keys to move, or the left and right buttons.

Good luck;
`);

  return new Promise((resolve) => {
    const playButton = new hcje.domTools.Button({
      url: './hcje/assets/buttons_play.png', 
      label:'Play',
      onClick: () => {
        welcome.remove(); 
        playButton.remove();
        resolve();
      }
    });
    gameArea.appendChild(welcome);
    gameArea.appendChild(playButton);
    playButton._element.focus();
  });
}


/**
 * Start the game.
 */ 
async function startGame() {
  const gameArea = new hcje.domTools.GameArea({
    width: 640,
    height: 400,
  });
  const textureManager = await createTextureManager(gameArea, 'bridger/assets/sprites.json', 'bridger/assets/sprites.png');
  showWelcome(gameArea)
    .then(() => gameLoop(gameArea, textureManager));
}


startGame();


