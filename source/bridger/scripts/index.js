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
 * Bridge over Jupiter is a simple test game for the hcje engine.
 * It's supposed to be based on an old Amstrad PC1512 game which I can't find anything about.
 * The game is used as a test bed for the hcje engine.
 */

/** Storage key prefix */
const STORAGE_KEY_PREFIX = 'BridgeOverJupiter';

/** Game design width @type {number} */
const GAME_WIDTH = 720;
/** Game design width @type {number} */
const GAME_HEIGHT = 450;

/** Drop initial speed @type {number} */
const DROP_VY = 20;
/** Drop acceleration @type {number} */
const DROP_AY = 100;
/** Scaffold speed @type {number} */
const SCAFFOLD_SPEED_X = 800;
/** Spaceship speed @type {number} */
const SPACESHIP_SPEED_X = 360;
/** Bridge lead in. These tiles are never broken. @type {number} */
const BRIDGE_SAFE_IN = 2;
/** Bridge lead out. These tiles are never broken. @type {number} */
const BRIDGE_SAFE_OUT = 1;


/** Key for SFX when falling @type {string} */
const FALL_SFX_KEY = 'FALL';
/** Sound definition for falling SFX @type {module:hcje/audio~SynthAudioDefinition} */
const FALL_SFX_DEFINITION = {
  title: FALL_SFX_KEY,
  bpm: 120,
  fadeSeconds: 0.1,
  tracks:[
    {
      instrument: {
        adsr: [0.01, 0.25, 0.7, 0.5],
        allowMerge: false,
        maxGain: 1,
        sustainTime: 0.1,
        sweepFactor: 0.2,
        waveform: 'sine',
      },
      notes: 'C',
      octave: 5
    },
  ]
};

/** Key for rocket SFX when flying */
const ROCKET_SFX_KEY = 'ROCKET';
/** Sound definition for rocket SFX @type {module:hcje/audio~SynthAudioDefinition} */
const ROCKET_SFX_DEFINITION = {
  title: ROCKET_SFX_KEY,
  bpm: 60,
  fadeSeconds: 0.1,
  tracks:[
    {
      instrument: {
        adsr: [0.01, 0, 1, 0.1],
        allowMerge: true,
        maxGain: 1,
        sustainTime: 1,
        sweepFactor: 1,
        waveform: 'noise',
      },
      notes: 'EE',
      octave: 2
    },
  ]
};


const SYNTH_DEFINITION = {
  bpm: 190,
  fadeSeconds: 0.1,
  loop: true,
  tracks:[
    {
      instrument: hcjeLib.audio.Instrument.PIANO,
      notes: 'C C8Eb8 D8-Bb8|Eb8F8 Eb D|C8D8 C -Bb|-G2 -G8-Bb8||C C8Eb8 D8-Bb8|Eb8F8 G G|G8F8 Eb F|Eb2 Bb8G8||F F Eb8G8|F -Bb Bb8G8|F F G8Bb8|+C2 +C8+D8||+Eb +D +C|Bb +Eb G|F8Eb8 FG |Bb2 -G8-Bb8|',
      octave: 4
    },
    {
      instrument: {
        adsr: [0.1, 0.25, 0.5, 0.1],
        allowMerge: false,
        maxGain: 0.5,
        sustainTime: 0.1,
        sweepFactor: 1,
        waveform: 'sine',
      },
      notes: 'Ab ~     Bb   |G     ~  G|Ab   ~  Bb|+C2  Bb    ||Ab ~     Bb   |G     ~ Eb8G8|Ab   ~ +C|~ +Eb G    ||Bb ~ +C    |+D  ~  G    |Bb ~ +Eb   |+Ab +G +F    ||++C  +Bb +Ab|+G  +F +Eb|+Ab    +F +Eb|+D +C Bb    | ',
      octave: 2
    },
    {
      instrument: hcjeLib.audio.Instrument.SNARE,
      notes: '~G~',
      octave: 6
    },
    {
      instrument: hcjeLib.audio.Instrument.DRUM,
      notes: 'C ~ ~ C C ~',
      octave: 2
    },
  ]
};
/**
 * Modify the sprite name to allow different types of sprite to be used.
 * @param {string} spriteName - name to modify.
 * @returns {string}
 */
function formSpriteName(spriteName) {
  return spriteName.replace('sprites', 'sprites_retro');
}

/**
 * Form the background name.
 * @param {string} backgroundName - name to modify.
 * @returns {string}
 */
function formBackgroundName(backgroundName) {
  return backgroundName.replace(/\.(png|jpg)/, '-retro.$1');
}

/**
 * Create the texture manager.
 * @param {module:hcje/domTools~GameArea} gameArea - the main area for the game.
 * @param {string} textureDataUrl - url of the texture JSON file.
 * @param {string} textureUrl - url of the texture image.
 * @returns {Promise} fulfils to module:hcje/sprites~TextureManager
 */ 
function createTextureManager(gameArea, textureDataUrl, textureUrl) {
  return hcjeLib.sprites.loadSpriteSheet(textureDataUrl, textureUrl,
    new hcjeLib.domTools.TimeLimitedBusyIndicator({
      label:'loading',
      timeoutS: 15,
      timeoutMessage: 'Failed to load sprite sheet in time. Click OK to keep waiting.'
    }))
    .then((textureManager) => {
      textureManager.spriteFactory = new hcjeLib.sprites.DomImageSpriteFactory(gameArea);
      return textureManager;
    });
}

/**
 * Create a spaceship.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite}
 */
function createSpaceship(textureManager) {
  const sprite = textureManager.createSprite(formSpriteName('sprites_spaceship.png'), [
    {
      name:'fly', interval: 100, 
      cycleType: hcjeLib.sprites.CycleType.OSCILLATE
    }
  ]);
  sprite.renderer.classList.add('bridger-spaceship');
  sprite.dynamics = new hcjeLib.sprites.Dynamics();
  return sprite;
}

/**
 * Create a walker.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite}
 */
function createWalker(textureManager) {
  const sprite = textureManager.createSprite(formSpriteName('sprites_spaceman.png'), [
    {name:'walk', interval:(dynamics) => hcjeLib.sprites.Sprite.deriveWalk(dynamics, 2)},
    {
      name:'fall', interval: 100, 
      cycleType: hcjeLib.sprites.CycleType.OSCILLATE
    }
  ]);
  sprite.renderer.classList.add('bridger-walker');
  sprite.dynamics = new hcjeLib.sprites.Dynamics();
  return sprite;
}

/**
 * Create a rock.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite}
 */
function createRock(textureManager) {
  const sprite = textureManager.createSprite(formSpriteName('sprites_rock.png'));
  sprite.dynamics = new hcjeLib.sprites.Dynamics();
  return sprite;
}

/**
 * Create a scaffold.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {module:hcje/sprites~Sprite}
 */
function createScaffold(textureManager) {
  const sprite = textureManager.createSprite(formSpriteName('sprites_scaffold.png'));
  sprite.dynamics = new hcjeLib.sprites.Dynamics();
  return sprite;
}


/**
 * Create a complete bridge.
 * @param {module:hcje/sprites~Animator} animator - animator for the sprites.
 * @param {module:hcje/domTools~GameArea} gameArea - the main area for the game.
 * @param {module:hcje/sprites~TextureManager} textureManager - manager used to create sprites.
 * @returns {Promise} fulfils to [Sprite]{@link module:hcje/sprites~Sprite}[]. 
 */
function createBridge(animator, gameArea, textureManager) {
  const gameDims = gameArea.designDims;
  const floorLevel = Math.floor(gameDims.height / 3);
  const bridge = [];
  let rock = createRock(textureManager);
  bridge.push(rock);
  animator.addTarget(rock);
  const rockDims = bridge[0].dimensions;
  const rockCount = Math.ceil(gameDims.width / rockDims.width);
  for (let rockIndex = 0; rockIndex < rockCount; rockIndex++) {
    if (rockIndex > 0) {
      rock = createRock(textureManager);
      bridge.push(rock);
      animator.addTarget(rock);
    }
    bridge[rockIndex].position = {x: rockIndex * rockDims.width, y: -rockDims.height};
  }
  const promises = [];
  const randomBridge = hcjeLib.utils.shuffle([...bridge]);
  let delay = 0;
  for (const rock of hcjeLib.utils.shuffle([...bridge])) {
    promises.push(new Promise((resolve) => {
      setTimeout(() => {
        rock.dynamics.vy = DROP_VY;
        rock.dynamics.ay = DROP_AY;
        const adjuster = new hcjeLib.sprites.ReachTargetXY(rock, rock.position.x, floorLevel); 
        adjuster.onCompletion = (reason) => resolve();
        rock.adjuster = adjuster;
      }, delay);
    }));
    delay += 100;
  }
  animator.active = true;
  return Promise.all(promises)
    .then(() => {
      animator.active = false;
      return bridge;
    });
}

/**
 * Break the bridge. The animator is paused at the end.
 * @param {Object} config
 * @param {module:hcje/utils~RectData} config.gameBounds - boundary for the game.
 * @param {module:hcje/sprites~Animator} config.animator - animator for the sprites.
 * @param {module:hcje/sprites~Sprite[]} config.bridge - the array of rocks that form the bridge from left to right.
 * @param {number} [config.gaps = 2] - number of gaps in the bridge.
 * @param {number} [config.safeIn = 2] - number of rocks at the left that are guaranteed to be unbroken.
 * @param {number} [config.safeOut = 1] - number of rocks at the right that are guaranteed to be unbroken.
 * @returns {Promise} fulfils to an array of the bridge positions where there are gaps in ascending order.
 */
function breakBridge(config) {
  const promises = []
  const indexes = [];
  const gaps = config?.gaps || 2;
  const safeIn = config?.safeIn || 2;
  const safeOut = config?.safeOut || 1;
  const firstPossible = safeIn + (hcjeLib.utils.tossCoin() ? 1 : 0);
  for (let n = firstPossible; n < config.bridge.length - safeOut; n += 2) {
    indexes.push(n);
  }
  hcjeLib.utils.shuffle(indexes);
  
  const gapIndexes = [];
  for (let gap = 0; gap < gaps; gap++) {
    const index = indexes[gap];
    gapIndexes.push(index);
    const brokenRock = config.bridge[index];
    brokenRock.dynamics.vy = DROP_VY;
    brokenRock.dynamics.ay = DROP_AY;
    const promise = new Promise((resolve) => {
      const adjuster = new hcjeLib.sprites.TerminateOutOfBounds(brokenRock, config.gameBounds); 
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
        const adjuster = new hcjeLib.sprites.ReachTargetXY(rock, rock.position.x, config.floorY); 
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
 * @param {number} [lag = 1] - the number of rocks back for the walker. If zero the walker will be immediately behind
 * its gap, so as the leader exits its gap the walker will walk into its. You will normally want the lag to be one or
 * greater.
 * @returns {number[]} 
 */
function findNoGoIndices(leaderIndex, bridgeGaps, lag) {
  console.debug(`Lag ${lag}`);
  let noGoIndices = [];
  for (let n = 0; n < lag; n++) {
    noGoIndices.push(leaderIndex + 1 + n);
  }
  for (let n = 1; n < bridgeGaps.length; n++) {
    const gapIndex = bridgeGaps[n];
    for (let lookBehind = n - 1; lookBehind >= 0; lookBehind--) {
      let noGoIndex = leaderIndex + gapIndex - bridgeGaps[lookBehind]; 
      noGoIndices.push(noGoIndex + -1);
      for (let n = 0; n <= lag; n++) {
        noGoIndices.push(noGoIndex + n);
      }
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
 * @param {number} [options.spread = 1] - randomly select the position of the next walker. Spread represents the number
 *  of possible start positions. If 1, the first is taken. If 2, then the first or second is taken, and so on.
 * @param {number} [options.walkerLag] - lag for the walker. See findNoGoIndices.
 *  means the gap needs to be increased.
 */
function getProcessionIndices(count, bridgeGaps, options) {
  const spread = options?.spread ?? 1;
  const processionIndices = [0];
  let leaderIndex = 0;
  let noGoIndices = [];
  while (--count) {
    noGoIndices = [...noGoIndices, ...findNoGoIndices(leaderIndex, bridgeGaps, options.walkerLag)];
    let spreadPlace = spread <= 1 ? 1 : hcjeLib.utils.getRandomIntInclusive(1, spread);
    console.debug(`Place walker in possible position ${spreadPlace}; allowed spread was ${spread}`);
    while (spreadPlace-- > 0) {
      console.debug(`Find place for walker`);
      leaderIndex = getWalkerIndex(leaderIndex + 1, noGoIndices);  
    }
    processionIndices.push(leaderIndex);
  }
  console.debug(`  Bridge gaps: ${bridgeGaps.join(', ')}`);
  console.debug(`No go indices: ${[... new Set(noGoIndices)].sort((a,b) => a- b).join(', ')}`);
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

  let allWalkers = [];

  for (const index of config.indices) {
    const walker = createWalker(config.textureManager);
    allWalkers.push(walker);
    const walkerDims = walker.dimensions;
    walker.position = {
      x: -index * config.rockWidth - walkerDims.width, 
      y: config.floorY - walkerDims.height
    }
    walker.dynamics.vx = config.walkSpeed;

    config.animator.addTarget(walker);
    const adjuster = new WalkerAdjuster(walker, {
      allowance: 8,
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
            killWalkers(allWalkers);
            allWalkers = undefined;
            result.success = true;
            resolve(result);
          }
        } else {
          killWalkers(allWalkers);
          allWalkers = undefined;
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
 * Kill the current walkers.
 * @param {module:hcje/sprites~Sprite} walkers - the walkers to kill
 */
function killWalkers(walkers) {
    if (!walkers) {
      return;
    }
    for (const walker of walkers) {
      walker.renderer.style.opacity = 0;
    }
    setTimeout(() => {
      for (const walker of walkers) {
        walker.kill();
      }
    }, 2000);
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
  const adjuster = new hcjeLib.sprites.ReachTargetXY(config.scaffold, 0, config.floorY);
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
 * Fly spacemen in. This just flies a spaceship from right to left. The animator is started and stopped on completion.
 * @param {Object} config
 * @param {module:hcje/sprites~Animator} config.animator - animator to drop in the sprite.
 * @param {module:hcje/utils~Rect} config.bounds - boundary of game.
 * @param {module:hcje/sprites~Sprite} config.spaceship - the ship to fly across.
 * @param {number} speed - speed in the x direction.
 * @param {number} config.y - y coordinate of flight.
 * returns {Promise}
 */
function flySpaceshipAcross(config) {
  config.spaceship.position = {x: config.bounds.x + config.bounds.width, y: config.y};
  config.spaceship.dynamics.vx = -Math.abs(config.speed);
  const adjuster = new hcjeLib.sprites.ReachTargetXY(config.spaceship, config.bounds.x - config.spaceship.dimensions.width, config.y);
  config.spaceship.adjuster = adjuster;
  hcjeLib.audio.getAudioManager().playAudioSfx(ROCKET_SFX_KEY);
  return new Promise((resolve) => {
    adjuster.onCompletion = () => resolve();
    config.animator.active = true;
  }).then(() => config.animator.active = false);
}

/**
 * Wrapper for both control buttons.
 */
class ControlButtons {
  /** Left button @type {module:hcje/domTools~Button} */
  #left;
  /** Right button @type {module:hcje/domTools~Button} */
  #right;

  /** Construct buttons.
   * @param {ElementWrapper} container - button container.
   */
  constructor(container) {
    this.#left = new hcjeLib.domTools.Button({
      parentElement: container,
      className: 'bridger-control',
      url: './bridger/assets/images/retro_buttons_left.png',
      label: '',
      onClick: () => hcjeLib.device.Keyboard.simulateKeydown('ArrowLeft'),
      interval: hcjeLib.domTools.SIM_KBD_INTERVAL,   
    });
    this.#right = new hcjeLib.domTools.Button({
      parentElement: container,
      className: 'bridger-control',
      url: './bridger/assets/images/retro_buttons_right.png',
      label: '',
      onClick: () => hcjeLib.device.Keyboard.simulateKeydown('ArrowRight'),
      interval: hcjeLib.domTools.SIM_KBD_INTERVAL,   
    });
    this.#left.classList.add('bridger-control--left');
    this.#right.classList.add('bridger-control--right');  
  }

  /** Set disabled state.
   * @param {boolean} disabled - state of both buttons.
   */
  set disabled(disabled) {
    this.#left.disabled = disabled;
    this.#right.disabled = disabled;
  }

  /**
   * Hide the buttons.
   */
  hide() {
    this.#left.style.opacity = 0;
    this.#right.style.opacity = 0;
  }
  /**
   * Show the buttons.
   */
  show() {
    this.#left.style.opacity = 1;
    this.#right.style.opacity = 1;
  }
}

/**
 * Start the music.
 */ 
function startMusic() {
  const audio = hcjeLib.audio.getAudioManager();
  audio.gain = 0.5;
  audio.setMusic(SYNTH_DEFINITION);
}
/**
 * The main game loop
 * @param {module:bridgeOverJupiter~DifficultlyEnumValue} config.difficulty - the game difficulty.
 * @param {module:hcje/domTools~GameArea} config.gameArea - the main area for the game.
 * @param {module:bridgeOverJupiter~ControlButtons} config.controls - left and right controls.
 * @param {module:hcje/sprites~TextureManager} config.textureManager - texture manager for sprite creation.
 */
async function gameLoop(config) {
  startMusic();
  hcjeLib.audio.getAudioManager().addAudioSfx(FALL_SFX_DEFINITION);
  hcjeLib.audio.getAudioManager().addAudioSfx(ROCKET_SFX_DEFINITION);
  let walkers = [];
  let playing = true;
  const scoreboard = new Scoreboard('Astronauts across: ', '');
  config.gameArea.appendChild(scoreboard)
  const animator = new hcjeLib.sprites.Animator();
  
  const bridge = await createBridge(animator, config.gameArea, config.textureManager);
  const rockFloor = bridge[0].position.y;
  const rockWidth = bridge[0].dimensions.width;
  const scaffold = createScaffold(config.textureManager);
  const spaceship = createSpaceship(config.textureManager);
  spaceship.position = {x: -spaceship.dimensions.width, y: -spaceship.dimensions.height};
  animator.addTarget(spaceship);
  config.controls.disabled = true;
  await dropInScaffold({
    animator, 
    scaffold,
    floorY: rockFloor
  });
  config.controls.disabled = false;
  scaffold.adjuster = new ScaffoldAdjuster(scaffold, {bridge, speed: SCAFFOLD_SPEED_X });
  const difficultyMgr = new DifficultyManager({
    bridgeLength: bridge.length, 
    bridgeSafeLeft: BRIDGE_SAFE_IN, 
    bridgeSafeRight: BRIDGE_SAFE_OUT,
  });
  difficultyMgr.difficulty = config.difficulty;
  while (playing) {
    const walkerLag = 1;
    animator.active = false;
    const bridgeGaps = await breakBridge({
      animator, 
      bridge, 
      gameBounds: config.gameArea.designBounds, 
      gaps: difficultyMgr.gapCount,
      safeIn: BRIDGE_SAFE_IN,
      safeOut: BRIDGE_SAFE_OUT,
    });
    const processionIndices = getProcessionIndices(difficultyMgr.processionLength, bridgeGaps, {
      spread: difficultyMgr.walkerSpread,
      walkerLag
    });
    const walkSpeed = difficultyMgr.calcWalkSpeed({
      bridgeGaps,
      rockWidth: bridge[0].dimensions.width,
      scaffoldSpeed: SCAFFOLD_SPEED_X,
      walkerLag,
    });
    await flySpaceshipAcross({
      animator,
      spaceship,
      bounds: config.gameArea.designBounds,
      speed: SPACESHIP_SPEED_X,
      y: rockFloor - 1.2 * spaceship.dimensions.height
    });
    await hcjeLib.utils.sleep(750);
    await startProcession({
      animator,
      gameBounds: config.gameArea.designBounds,
      bridgeGaps,
      indices: processionIndices,
      floorY: rockFloor,
      rockWidth,
      scaffold,
      scoreboard,
      textureManager: config.textureManager,
      walkSpeed 
    })
      .then((result) => {
        if (result.success) {
          difficultyMgr.incrementProcessions();
        } else {
          scoreboard.saveIfNewBest();
          difficultyMgr.reset();
          const spacemenAcross = scoreboard.score;
          scoreboard.clear();
          return showResultAndReplay(config.gameArea, config.controls, spacemenAcross);
        }
      }) 
      .then((difficulty) => {
        if (difficulty) {
          difficultyMgr.difficulty = difficulty;
        }
      })
      .then(() => repairBridge({
          animator,
          bridge,
          floorY: rockFloor
        }));
  }
}

/** @typedef {string} DifficultyEnumValue */
/** @enum {module:hcje/bridger~DifficultyEnumValue} */
const Difficulty = {
  SLOW: 0,
  NORMAL: 1,
  FAST: 2,
}

/**
 * Class to manage the game difficultly.
 */
class DifficultyManager {
  /** Number of processions across bridge @type {number} */
  #processions;

  /** Manager difficulty. @type {module:bridgeOverJupiter~DifficultyEnumValue} */
  difficulty;

  /** Maximum number of gaps. @type {number} */
  #maxGaps;

  /**
   * Construct the difficulty manager.
   * @param {Object} config
   * @param {number} config.bridgeLength - number of rocks in the bridge.
   * @param {number} config.bridgeSafeLeft - number of rocks at the left that are never broken.
   * @param {number} config.bridgeSafeRight - number of rocks at the right that are never broken.
   */
  constructor(config) {
    const breakableRocks =  config.bridgeLength - config.bridgeSafeLeft - config.bridgeSafeRight; 
    this.#maxGaps = Math.ceil(breakableRocks / 3);
    this.reset();
  }

  /**
   * Reset the difficulty manager.
   */
  reset() {
    this.#processions = 0;
  }

  /**
   * Get the spread of possible start positions for the next walker. See getProcessionIndices.
   * @returns {number}
   * @readonly
   */
  get walkerSpread() {
    return 1;
  }

  /** 
   * Calculate the maximum walker speed to allow scaffold to traverse gaps.
   * @param {Object} config
   * @param {number[]} config.bridgeGaps - indices, sorted left to right of gaps in bridge.
   * @param {number} config.rockWidth - width of a rock
   * @param {number} config.scaffoldSpeed - speed of the scaffold
   * @param {number} config.walkerLag - Amount a walker must lag a gap when leader is over one.
   * @returns {number}
   */ 
  calcMaxWalkSpeed(config) {
    const maxIndicesToMove = config.bridgeGaps[config.bridgeGaps.length - 1] - config.bridgeGaps[0]; 
    const movementInterval = hcjeLib.domTools.SIM_KBD_INTERVAL;
    const timeToMoveOneGap = config.rockWidth / config.scaffoldSpeed;
    const maxTraversalTime = maxIndicesToMove * timeToMoveOneGap + movementInterval.delay / 1000 + 
      maxIndicesToMove * movementInterval.repeat / 1000;
    const maxWalkerSpeed = config.walkerLag * config.rockWidth / maxTraversalTime;
    console.debug(`Walker space ${config.walkerLag} rocks; speed ${config.scaffoldSpeed} px/s; max traversal time ${maxTraversalTime} s; max walker speed ${maxWalkerSpeed}`);
    return maxWalkerSpeed;
  }

  /**
   * Calculate the walker speed.
   * @param {Object} config
   * @param {number[]} config.bridgeGaps - indices, sorted left to right of gaps in bridge.
   * @param {number} config.rockWidth - width of a rock
   * @param {number} config.scaffoldSpeed - speed of the scaffold
   * @param {number} config.walkerLag - Amount a walker must lag a gap when leader is over one.
   * @returns {number}
   */
  calcWalkSpeed(config) {
    let minFactor;
    switch (this.difficulty) {
      case Difficulty.SLOW: 
        minFactor = 0.5;
        break;
      case Difficulty.FAST: 
        minFactor = 0.8;
        break;
      default:
        minFactor = 0.65;
        break;
    }
    minFactor = 1;
    const factor = Math.min(1, minFactor + 0.02 * this.#processions);
    const walkSpeed = factor * this.calcMaxWalkSpeed(config);
    console.debug(`Speed factor ${factor}; walker speed ${walkSpeed}`);
    return walkSpeed;
  }

  /**
   * Get the number of gaps in the bridge.
   * @returns {number}
   * @readonly
   */
  get gapCount() {
    return Math.min(this.#maxGaps, 2 + Math.floor(this.#processions / 2));
  }

  /**
   * Get the number of walkers.
   * @returns {number}
   * @readonly
   */
  get processionLength() {
    return 1 + this.#processions;
  }

  /** 
   * Increment the number of successful processions.
   */
  incrementProcessions() {
    this.#processions++;
  }

}

/**
 * @implements module:hcje/sprites~SpriteAdjuster
 */ 
class WalkerAdjuster extends hcjeLib.sprites.BaseSpriteAdjuster {
  /** Allowance added to the scaffold. @type {number} */
  #allowance;
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
   * @param {number} config.allowance - extra amount added to each side of the scaffold effectively increasing its
   *   width.
   */
  constructor(sprite, config) {
    super(sprite);
    this.#allowance = config.allowance ?? 0;
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
      if (centreX < scaffoldBounds.x - this.#allowance || 
            centreX > scaffoldBounds.x + scaffoldBounds.width + this.#allowance) {
        this.#falling = true;
        sprite.dynamics.vAngle = 3;
        sprite.dynamics.vy = 40;
        sprite.dynamics.ay = 100;
        sprite.state = 'fall';
        setTimeout(()=> hcjeLib.audio.getAudioManager().playAudioSfx(FALL_SFX_KEY), 250);
      }
    }
  }
}


/**
 * Scaffold adjuster. Moves the scaffold according to keypresses.
 */
export class ScaffoldAdjuster extends hcjeLib.sprites.BaseSpriteAdjuster {
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
    this.#keyboard = new hcjeLib.device.Keyboard();
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
    if (!this.#targetX) {
      if (this.#index < this.bridge.length - 1) {
        this.#index++;
        this.#updateTargetX();
      }
    }
  }
  /**
   * Move the scaffold left
   */
  moveLeft() {
    if (!this.#targetX) {
      if (this.#index > 0) {
        this.#index--;
        this.#updateTargetX();
      }  
    }
  }
}

/**
 * Simple Score element
 */
class Scoreboard extends hcjeLib.domTools.TextElement {
  /** Prefix added to text. @type {string} */
  prefix;
  /** Prefix added to text. @type {string} */
  suffix;
  /** Current score @type {number} */
  #score;
  /** Best ever score @type {number} */
  #bestEverScore;

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
    this.#bestEverScore = hcjeLib.storage.getItem('BEST_SCORE') ?? 0;
    this.classList.add('bridger-score');
    this.#updateText();
  }
  
  /**
   * Get the current score.
   * @returns {number}
   * @readonly
   */
  get score() {
    return this.#score;
  }
  /**
   * Update the displayed text.
   */
  #updateText() {
    let bestSuffix = '';
    if (this.#bestEverScore > 0) {
      bestSuffix = `: previous best was ${this.#bestEverScore}`;  
    }
    this.innerText = `${this.prefix}${this.#score}${this.suffix}${bestSuffix}`;
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

  /** 
   * Save if new best.
   */
  saveIfNewBest() {
    if (this.#score > this.#bestEverScore) {
      this.#bestEverScore = this.#score;
      hcjeLib.storage.setItem('BEST_SCORE', this.#score);
    }  
  }
}

/**
 * Perform factory reset if confirmed.
 * @returns {Promise}
 */
function factoryReset() {
  return hcjeLib.domTools.createDialog({
    title : 'Confirm factory reset',
    text: 'Are you sure you want to clear all saved data. This will get rid of your best score.',
    buttonDefns: [
      {id:'OK', url: './bridger/assets/images/retro_buttons_ok.png'},
      {id:'CANCEL', url: './bridger/assets/images/retro_buttons_cancel.png'},
    ]
  })
    .then((id) => {
      if (id === 'OK') {
        hcjeLib.storage.clear(STORAGE_KEY_PREFIX);
      }
    });
}
/**
 * Show about dialog.
 * @returns {Promise}
 */
function showAboutDialog() {
  const reset = new hcjeLib.domTools.ButtonControl({
    label: 'Factory reset',
    url: './bridger/assets/images/retro_buttons_factory_reset.png',
    onClick: () => factoryReset()
  });
  return hcjeLib.utils.fetchText('./bridger/assets/data/about.md', 'Cannot find about information.')
    .then((aboutContent) => hcjeLib.domTools.createDialog({
      title: 'Bridge over Jupiter',
      markdown: aboutContent, 
      children: [reset],
      buttonDefns: [{id:'OK', url: './bridger/assets/images/retro_buttons_ok.png'}]
    }));
}
/**
 * Show play dialog with message. This is displayed on the screen along with a button to close.
 * @param {Element|ElementWrapper} parentElement - element containing the message.
 * @param {module:bridgeOverJupiter~ControlButtons} controls - left and right controls.
 * @param {string} message - text to display. Supports Markdown.
 * @returns {Promise} fulfils to {@link module:bridgeOverJupiter~DifficultyEnumValue}
 */
function showPlayDialog(parentElement, controls, message) {
  controls.disabled = true;
  const about = new hcjeLib.domTools.Button({
    className: 'bridger-dialog__about_button',
    label: 'About', 
    url: './bridger/assets/images/retro_buttons_info.png',
    onClick: () => showAboutDialog() 
  });
  return hcjeLib.domTools.createDialog({
    title: '',
    markdown: message,
    children: [about],
    buttonDefns: [
      {id: 'SLOW', label: 'Slow', url: './bridger/assets/images/retro_buttons_play_slow.png'},
      {id: 'NORMAL', label: 'Normal', url: './bridger/assets/images/retro_buttons_play.png'},
      {id: 'FAST', label: 'Fast', url: './bridger/assets/images/retro_buttons_play_fast.png'},
    ]
  })
    .then((id) => {
      controls.disabled = false;
      switch (id) {
        case 'SLOW': return Difficulty.SLOW;
        case 'FAST': return Difficulty.FAST;
        default: return Difficulty.NORMAL;
      }
    });
}

/**
 * Show welcome page along with play selection buttons.
 * @param {Element|ElementWrapper} container - element containing the message.
 * @param {module:bridgeOverJupiter~ControlButtons} controls - left and right controls.
 * @returns {Promise} fulfils to selected difficulty.
 */
function showWelcomeAndPlay(container, controls) {
  return hcjeLib.utils.fetchText('./bridger/assets/data/welcome.md', 'Could not load text. Please check your internet connection.').
    then((content) => showPlayDialog(container, controls, content));
}

/** 
 * Show the completion/try again message along with play selection buttons.
 * @param {Element|ElementWrapper} container - element containing the message.
 * @param {module:bridgeOverJupiter~ControlButtons} controls - left and right controls.
 * @param {number} walkersAcross - result of game.
 * @returns {Promise} fulfils to selected difficulty.
 */
function showResultAndReplay(container, controls, walkersAcross) {
  const message = `You managed to get ${walkersAcross} ${walkersAcross === 1 ? 'astronaut' : 'astronauts'} across. Better luck next time.`;
  return showPlayDialog(container, controls, message);
}


/** 
 * Add the menu.
 * @param {module:hcje/sprites~Animator} animator - the current animator.
 * @returns {Promise} fulfils to [MenuBar]{@link module:hcje/domTools~MenuBar}
 */
function addMenu(animator) {
  return hcjeLib.utils.fetchText('./bridger/assets/data/about.md', 'Cannot find about information.')
    .then((aboutContent) => {
      const about = new hcjeLib.domTools.Button({label: 'About', url: './bridger/assets/images/retro_buttons_info.png', onClick: () => {
          animator.pause();
          hcjeLib.domTools.createDialog({
            title: 'Bridge over Jupiter',
            markdown: aboutContent, 
            buttonDefns: [{id:'OK', url: './bridger/assets/images/retro_buttons_ok.png'}]
          })
            .then(() => animator.resume());
        }
      });
      const menu = new hcjeLib.domTools.MenuBar({
        opener: new hcjeLib.domTools.Button({label: 'Open menu', url: './bridger/assets/images/retro_buttons_menu.png'}),
        closer: new hcjeLib.domTools.Button({label: 'Close menu', url: './bridger/assets/images/retro_buttons_cancel.png'}),
        children: [about],
      });
      return menu;
    });
}


/**
 * Start the game.
 */ 
async function startGame() {
  const loading = document.getElementById('bridger-loading');
  loading.style.opacity = 0;
  setTimeout(()=>loading.remove(), 1000);
  hcjeLib.storage.setStorageKeyPrefix(STORAGE_KEY_PREFIX);
  const gameArea = new hcjeLib.domTools.GameArea({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  });
  const title = new hcjeLib.domTools.createChild(gameArea, 'p', 'bridger-title');
  title.innerText = 'Bridge over Jupiter';
  const textureManager = await createTextureManager(gameArea, 'bridger/assets/images/sprites.json', 'bridger/assets/images/sprites.png');
  const controls = new ControlButtons(document.getElementsByClassName('hcje-game-area-container')[0]);
  controls.hide();
  showWelcomeAndPlay(gameArea, controls)
    .then((difficulty) => {
      if (!/itch.io$/.test(window.location.hostname)) {
        hcjeLib.device.enterFullscreen(); // not needed on itch.
      }
      gameLoop({gameArea, controls, difficulty, textureManager});
    });
}


startGame();


