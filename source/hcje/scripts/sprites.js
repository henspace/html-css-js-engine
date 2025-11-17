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
 * @module hcje/sprites
 * @description
 * Module providing handling for sprite sheets created by
 * [TexturePacker]{@link https://www.codeandweb.com/texturepacker}.
 */

import * as utils from './utils.js';
import * as domTools from './dom-tools.js';
/**
 * Frame name generator for sprite names in a texture.
 * @callback frameNameGenerator
 * @param {string} baseName - the string from which the final name is created.
 * @param {string} state - the state of the sprite. E.g. idle, walking etc.
 * @param {number} index - the 0 based frame index.
 * @returns {string} the frame name.
 */ 

/**
 * @typedef {Object} FrameData
 * @property {number} x - left position.
 * @property {number} y - top position.
 * @property {number} width - width of sprite.
 * @property {number} height - height of sprite.
 * @property {boolean} [flipX] - sprite is flipped in its unrotated x direction.
 * @property {boolean} [flipY] - sprite is flipped in its unrotated y direction.
 */

/** Type of animation cycle.
 * @typedef {number} CycleTypeEnumValue
 */
/**
 * Type of animation cycles.
 * @enum {CycleTypeEnumValue}
 */
export const CycleType = {
  NONE: 0, 
  LOOP: 1,
  OSCILLATE: 2,
  STOP: 3
};

/**
 * Automatic calculation of interval function. This adjusts the interval based on the current dynamics.
 * @callback deriveInterval
 * @param {module:hcje/sprites~Dynamics} dynamics - the current dynamics.
 * @returns {number} required interval in ms.
 */

/**
 * Configuration for an animation state.
 * @typedef {Object} AnimationStateConfig
 * @param {module:hcje/sprites~FrameData[]} frames
 * @property {number|module:hcje/sprites~deriveInterval} interval - animation interval in milliseconds or function to
 *   derive it.
 * @property {CycleTypeEnumValue} cycleType - type of loop. Defaults **CycleType.LOOP**.
 */

/**
 * Sprite renderer.
 * @interface SpriteRenderer
 */
/**
 * Render the sprite.
 * @function module:hcje/sprites~SpriteRenderer#render
 * @param {module:hcje/sprites~FrameData} frameData - details of the current frame to render.
 * @param {module:hcje/utils~PositionData} [position] - position details for the current sprite to render. If not
 * provided, the rendered sprite will be positioned at [0, 0] at an angle of 0 radians.
 * @param {number} [opacity = 1] - opacity value 0 to 1.
 */
/**
 * Function that is called by the sprite to indicate that the sprite is being killed and all resources should be
 * released.
 * @function module:hcje/sprites~SpriteRenderer#kill
 */ 

/**
 * Renderer for a text sprite using the DOM.
 * @implements {module:hcje/sprites~SpriteRenderer}
 */
export class DomTextSpriteRenderer extends domTools.TextElement {
  /**
   * Construct renderer.
   * @param {Element} container - DOM element that holds the sprite. The sprite element is automatically appended to
   * the container.
   * @param {string} txt - the text content for the sprite.
   * @pararm {Object} [options]
   * @param {boolean} options.markdown - true if the txt is markdown.
   */
  constructor(container, txt, options) {
    super();
    container.appendChild(this);
    if (options?.markdown) {
      this.setMarkdown(txt);
    } else {
      this.innerText = txt;
    }
    this.className = 'hcje-sprites-sprite hcje-sprites-sprite--text';
    this.style.position = 'absolute';
  }

  /**
   * Render the sprite.
   */
  render(sprite) {
    const frameData = sprite.frameData;
    const position = sprite.position;
    let transform = '';
    if (frameData.flipX) {
      transform += 'scaleX(-1) ';
    }
    if (frameData.flipY) {
      transform += 'scaleY(-1) ';
    }
    if (position.angle !== 0) {
      transform += ` rotateZ(${position.angle}rad)`;
    }
    this.style.opacity = sprite.opacity;
    this.style.width = `${frameData.width}px`;
    if (frameData.height) {
      this.style.height = `${frameData.height}px`;
    }
    this.style.transform =  transform;
    this.style.left = `${position.x}px`;
    this.style.top = `${position.y}px`;
  }

  /**
   * Release resources used by the renderer. This involves removal of the sprite element.
   */
  kill() {
    this.remove();
  }

}

/**
 * Create a text sprite.
 * @param {Element|ElementWrapper} container - the sprite is appended to the container.
 * @param {string} txt - the contents of the sprite.
 * @param {Object} options - configuration options.
 * @param {boolean} options.markdown - should markdown be used.
 * @param {module:hcje/utils~Dimensions} dimensions - Sprite size. Width must be provided. Use 0 for the height if you
 *  want this to size automatically.
 */
export function createTextSprite(container, txt, options) {
  const sprite = new Sprite('Text');
  const renderer = new DomTextSpriteRenderer(container, txt, options);
  sprite.renderer = renderer;

  const rect = {x: 0, y: 0, width: options.dimensions.width, height: options.dimensions.height};
  sprite.setStateFrames('anon', {
    cycleType: CycleType.NONE,
    frames: [rect],
    interval: 0
  });
  sprite.renderer.render(sprite);
  console.debug(`${renderer.offsetWidth} ${renderer.offsetHeight} `);
  sprite.dimensions = {width: renderer.offsetWidth, height: renderer.offsetHeight}

  return sprite;
}

/**
 * Renderer for sprites using the DOM and images from a texture.
 * @implements {module:hcje/sprites~SpriteRenderer}
 */
export class DomImageSpriteRenderer extends domTools.ElementWrapper {
  /** Texture used for the sprite. @type {HTMLIMageElement} */
  #texture;


  /**
   * Construct renderer.
   * @param {Element} container - DOM element that holds the sprite. The sprite element is automatically appended to
   * the container/
   * @param {HTMLImageElement} - the texture from which the sprite's image is taken.
   */
  constructor(container, texture) {
    super('div');
    container.appendChild(this);
    this.#texture = texture;
    this.className = 'hcje-sprites-sprite hcje-sprites-sprite--texture';
    this.style.backgroundImage = `url(${this.#texture.src})`;
    this.style.position = 'absolute';
  }

  /**
   * Render the sprite.
   */
  render(sprite) {
    const frameData = sprite.frameData;
    const position = sprite.position;
    let transform = '';
    if (frameData.flipX) {
      transform += 'scaleX(-1) ';
    }
    if (frameData.flipY) {
      transform += 'scaleY(-1) ';
    }
    if (position.angle !== 0) {
      transform += ` rotateZ(${position.angle}rad)`;
    }
    this.style.opacity = sprite.opacity;
    this.style.width = `${frameData.width}px`;
    this.style.height = `${frameData.height}px`;
    this.style.transform =  transform;
    this.style.left = `${position.x}px`;
    this.style.top = `${position.y}px`;
    this.style.backgroundPosition = `-${frameData.x}px -${frameData.y}px`;
  }

  /**
   * Release resources used by the renderer. This involves removal of the sprite element.
   */
  kill() {
    this.remove();
  }
}

/**
 * Sprite class.
 * @implements module:hcje/sprites~AnimationTarget
 */
export class Sprite {
  /** @type {module:hcje/sprites~SpriteAdjuster} */
  #adjuster;
  /** Flip in x direction when velocity changes. @type {boolean} */
  autoFlipX;
  /** Flip in y direction when velocity changes. @type {boolean} */
  autoFlipY;
  /** dynamics @type {module:hcje/sprites~Dynamics} */
  dynamics;
  /** Flipped in x direction @type {boolean} */
  #flipX;
  /** Flipped in yx direction @type {boolean} */
  #flipY;
  /** Frame increment value @type {number} */
  #frameInc;
  /** Current frames @type {module:hcje/sprites~FrameData[]} */
  #frames;
  /** Frame index @type {number} */
  #frameIndex;
  /** @type {number} */
  #height;
  /** Id used for debugging purposes @type {string} */
  logId;
  /** Animation interval @type {number|module:hcje/sprites~deriveInterval} */
  #interval;
  /** Opacity of sprite 0 to 1. @type {number} */
  opacity;
  /** Position data for sprite @type {module:hcje/utils~PositionData} */
  #position;
  /** Current state @type {string}*/
  #state;
  /** @type {Map<string,module:hcje/sprites~AnimationStateConfig>} */
  #stateData;
  /** Killed flag @type {boolean} */
  #killed;
  /** Cycle type @type {module:hcje/sprites~CycleTypeEnumValue} */
  #cycleType;
  /** Texture @type(HTMLImageElement} */
  #texture;
  /** @type {number} */
  #width;


  /**
   * Construct a sprite.
   * @param {string} logId - id used for logging purposes only.
   */
  constructor(logId) {
    this.logId = logId;
    this.#interval = 0; 
    this.#frameInc = 1; 
    this.#stateData = new Map();
    this.#position = {x: 0, y: 0, angle: 0};
    this.#killed = false;
  }

  /**
   * Get the adjuster.
   * @returns {module:hcje/sprites~SpriteAdjuster}
   */
  get adjuster() {
    return this.#adjuster;
  }

  /**
   * Set the adjuster. If there is a current adjuster, it is automatically marked as complete with an undefined 
   * reason; however, its **onCompletion* function will not be called. If you need the function to be called, 
   * call the adjusters **markComplete** method first.
   * @param {module:hcje/sprites~SpriteAdjuster} adjuster - new adjuster to use.
   */
  set adjuster(adjuster) {
    if (this.#adjuster) {
      this.#adjuster.onCompletion = undefined;
      this.#adjuster.markComplete();
    }
    this.#adjuster = adjuster;
  }

  /**
   * Interval derivation function to assist with calculation of automatic walk speeds. Typically used for 
   * {@link module:hcje/sprites~deriveInterval} callbacks. E.g. `(dynamics) => Sprite.deriveWalk(dynamics, DPF)` where
   * DPF is the number of pixels the frame animation would move per frame.
   */ 
  static deriveWalk(dynamics, distPerFrame) {
    return 1000 * distPerFrame / Math.abs(dynamics.vx);
  }

  /**
   * Set state frames.
   * @param {string} stateName - key name for this animation.
   * @param {module:hcje/sprites~AnimationStateConfig} stateConfig - configuration.
   */
  setStateFrames(stateName, stateConfig) { 
    if (stateConfig.frames?.length > 0) {
      this.#stateData.set(stateName, stateConfig);
    } else {
      console.warn(`Cannot set state ${stateName} as there are no frames.`);
    }
    if (this.#stateData.size === 1) {
      this.state = stateName;
    }
  }

  /** 
   * Get the size.
   * @returns {module:hcje/utils~Dimensions}
   */
  get dimensions() {
    return {width: this.#width, height: this.#height};
  }

  /**
   * Set the dimensions.
   * @param {module:hcje/utils~Dimensions} dims
   */ 
  set dimensions(dims) {
    this.#width = dims.width;
    this.#height = dims.height;
  }

  /**
   * Get the bounding rectangle for the sprite.
   * @returns {module:hcje/utils~RectData}
   * @readonly
   */
  get bounds() {
    return {x: this.#position.x, y: this.#position.y, width: this.#width, height: this.#height};
  }

  /** 
   * Get the current state.
   * @returns {string}
   */
  get state() {
    return this.#state;
  }

  /**
   * Set the current state.
   * If it does not existing in the map of states, it is ignored.
   * @param {string}
   */
  set state(state) {
    console.debug(`Set ${this.logId} state to ${state}.`); 
    const stateConfig = this.#stateData.get(state);
    if (stateConfig) {
      const frames = stateConfig.frames;
      this.#interval = stateConfig.interval;
      this.#cycleType = stateConfig.cycleType ?? CycleType.LOOP;
      this.#state = state;
      this.#width = frames[0].width;
      this.#height = frames[0].height;
      this.#frames = frames;
      this.#frameIndex = 0;
      this.#updateFrame();
    } else {
      console.debug(`Could not find state ${state} for ${this.logId}`);
    }
  }

  /**
   * Check if the sprite has been killed.
   * @returns {boolean}
   */ 
  isKilled() {
    return this.#killed;
  }

  /**
   * Get the current frame data.
   * @returns {module:hcje/sprites~FrameData} 
   * @readonly
   */
  get frameData() {
    return this.#frames[this.#frameIndex]  
  }

  /**
   * Update the displayed frame.
   */
  #updateFrame() {
    const frameData = this.#frames[this.#frameIndex];
    frameData.flipX = this.#flipX;
    frameData.flipy = this.#flipY;
    this.renderer?.render(this);
  }

  /**
   * Handle dynamics. Do not call if **dynamics** property has not been set.
   * @param {DOMHighResTimeStamp} timeStamp - time stamp for frame.
   * @param {number} deltaSeconds - elapsed time since last update.
   */
  #handleDynamics(timeStamp, deltaT) {
    this.dynamics.adjustSprite(timeStamp, deltaT, this);
    this.#flipX = this.autoFlipX && this.dynamics.vx < 0;
    this.#flipY = this.autoFlipY && this.dynamics.vy < 0;
  }

  /**
   * Update implementation.
   */
  update(timeStamp, deltaT) {
    if (this.dynamics) {
      this.#handleDynamics(timeStamp, deltaT);
    }
    if (this.#adjuster) {
      this.#adjuster.adjust(timeStamp, deltaT);
      if (this.#adjuster.isComplete()) {
        this.#adjuster = undefined;
      }
    }

    const interval = typeof this.#interval === 'function' ? this.#interval(this.dynamics) : this.#interval;
    if (interval > 0 && this.#frames.length > 1) {
      const index = Math.floor((timeStamp / interval)) % this.#frames.length;
      if (index != this.#frameIndex) {
        this.#frameIndex += this.#frameInc;
        if (this.#frameIndex >= this.#frames.length) {
          if (this.cycleType === CycleType.OSCILLATE) {
            this.#frameIndex -= 2;
            this.#frameInc = -1;
          } else if (this.#cycleType === CycleType.STOP) {
            this.#frameIndex--;
            this.#interval = 0;
          }
          else {
            this.#frameIndex = 0;
          }
        } else if (this.#frameIndex < 0) {
          this.#frameIndex = 1;
          this.#frameInc = 1;
        }
      } 
    }
    this.#updateFrame();
  }

  /**
   * Get the current sprite position.
   * @returns {module:hcje/utils~PositionData}
   */
  get position() {
    return this.#position;
  }

  /**
   * Set the position. Note this is instantaneous and can later be modified by the dynamics.
   * @param {module:hcje/utils~PositionData} position, 
   */
  set position(position) {
    this.#position = position;
    if (position.angle === undefined) {
      this.#position.angle = 0;
    }
    this.#updateFrame();
  }

  /**
   * Terminate the sprite.
   * This just calls the renderer's kill method to allow any resources to be released.
   */
  kill() {
    this.renderer?.kill();
    this.#killed = true;
  }

}


/**
 * Limiter for a [Dynamics]{@link module:hcje/sprites~Dynamics} class.
 * @interface DynamicsLimiter
 */

/**
 * Function to limit the **Dynamics** instance.
 * @function module:hcje/sprites~DynamicsLimiter#limit
 * @param {module:hcje/sprites~Sprite} target - the target object to limit.
 * @param {module:hcje/sprites~Dynamics} dynamics - the associated dynamics.
 */

/**
 * Bouncer class.
 * @implements {module:hcje/sprites~DynamicsLimiter}
 */
export class Bouncer {
  /* Boundary bottom @type {number} */
  #bottom;
  /* Boundary left @type {number} */
  #left;
  /* Boundary right @type {number} */
  #right;
  /* Boundary top @type {number} */
  #top;

  /**
   * Construct bouncer with the bounds.
   * @param {module:hcje/utils~Dimensions} actorDims - dimensions of the object being moved. 
   * @param {module:hcje/utils~RectData} boundary - movement boundary.
   */
  constructor(actorDims, boundary) {
    this.#left = boundary.x;
    this.#right = boundary.x + boundary.width - actorDims.width;
    this.#top = boundary.y;
    this.#bottom = boundary.y + boundary.height - actorDims.height;
  }

  /**
   * Implement limits.
   * @borrows {@link module:hcje/sprites~DynamicsLimiter#limit}
   */
  limit(target, dynamics) {
    if (target.position.x < this.#left) {
      target.position.x = this.#left;
      dynamics.vx = Math.abs(dynamics.vx);
    }
    if (target.position.x > this.#right) {
      target.position.x = this.#right;
      dynamics.vx = -Math.abs(dynamics.vx);
    }
    if (target.position.y < this.#top) {
      target.position.y = this.#top;
      dynamics.vy = Math.abs(dynamics.vy);
    }
    if (target.position.y > this.#bottom) {
      target.position.y = this.#bottom;
      dynamics.vy = -Math.abs(dynamics.vy);
    }
  }
}

/**
 * Dynamics class. This handles velocity and acceleration calculations for sprites.
 */
export class Dynamics {
  static #twoPI = 2 * Math.PI;
  /** Acceleration angular @type {number} */
  aAngle;
  /** Acceleration x @type {number} */
  ax;
  /** Accleration y @type {number} */
  ay;
  /** Motion limiter @type {module:hcje/sprites~DynamicsLimiter} */  
  limiter;
  /** Velocity angular @type {number} */
  vAngle;
  /** Velocity x @type {number} */
  vx;
  /** Velocity y @type {number} */
  vy;

  /**
   * Construct the instance setting all motion to zero.
   * @param {module:hcje/sprites~Sprite} sprite - sprite that is controlled.
   * @param {module:hcje/sprites~DynamicsLimiter} [limiter]
   */ 
  constructor(limiter) {
    this.limiter = limiter;
    this.vx = 0;
    this.vy = 0;
    this.vAngle = 0;
    this.ax = 0;
    this.ay = 0;
    this.aAngle = 0;
  }

  /**
   * Update position of the sprite.
   * @borrows module:hcje.sprites~BaseSpriteAdjuster#adjust
   */
  adjustSprite(timeStamp, deltaT, sprite) {
    let position = sprite.position;
    position.x += deltaT * this.vx;
    position.y += deltaT * this.vy;
    position.angle += deltaT * this.vAngle;
    this.vx += deltaT * this.ax;
    this.vy += deltaT * this.ay;
    this.vAngle += deltaT * this.aAngle;
    position.angle = position.angle % Dynamics.#twoPI;
    position.angle = position.angle % Dynamics.#twoPI;
    this.limiter?.limit(sprite, this);
  }
  
  /**
   * Test if the object is in motion.
   * @returns {boolean}
   */
  isMoving() {
    return this.vx || this.vy || this.vAngle || this.aX || this.aY || this.aAngle;
  }

}


/**
 * Sprite factory.
 * @interface ImageSpriteFactory
 */

/**
 * Create a rendered sprite.
 * @function module:hcje/sprites~ImageSpriteFactory#createSprite
 * @param {string} logId - id used for debugging.
 * @param {HTMLImageElement} texture - image used for the texture.
 */


/**
 * Class for creating sprites with images from a texture that are rendered as elements in the DOM.
 * @implements module:hcje/sprites~ImageSpriteFactory
 */
export class DomImageSpriteFactory {
  /** Container @type {Element} */
  parentElement;

  /**
   * Construct the factory.
   * @param {Element|ElementWrapper} container - the container for sprites.
   */
  constructor(parentElement) {
    this.parentElement = parentElement;
  }

  /**
   * @borrows {module:hcje/sprites~ImageSpriteFactory#createSprite}
   */
  createSprite(logId, texture) {
    const sprite = new Sprite(logId);
    sprite.renderer = new DomImageSpriteRenderer(this.parentElement, texture);
    return sprite;
  }
}

/**
 * Class to handle the management of textures.
 */
export class TextureManager {
  /** Data to access sprites in the texture. @type {Object} */
  #data;
  /** Sprite factory @type {module:hcje/sprites~ImageSpriteFactory} */
  spriteFactory;
  /** Texture @type {HTMLImageElement} */
  #texture;

  /**
   * Construct the texture manager.
   * @param {Object} data - texture data from the JSON file created by the file created by TexturePacker JSON (Hash)
   * export.
   * @param {HTMLImageElement} texture - the sprite sheet texture.
   */
  constructor(data, texture, spriteFactory) {
    this.#data = data;
    this.#texture = texture;
  }

  /**
   * Default frame name generator. This simply adds the state and index, unpadded, at the end of the name but in front of any
   * extension. The state is prefixed with an underscore, so for a base name of "spaceman.png", state of "idle" and
   * index of 5, the result would be "spaceman_idle5.png".
   * @borrow {module:hcje/sprites~frameNameGenerator}
   */
  createFrameName(baseName, state, frameIndex) {
    return baseName.replace(/^(?<prefix>.*)(?<suffix>\.[^.]*)$/, `\$<prefix>_${state}${frameIndex}\$<suffix>`);
  }

  /** 
   * Convert a texture packer entry to **RectData**.
   * @param {Object} tpEntry - sprite entry from a Texture Packer data file created using the JSON hash export.
   * @returns {module:hcje/utils~RectData}
   */ 
  createRectData(tpEntry) {
    return {
      x: tpEntry.frame.x,
      y: tpEntry.frame.y,
      width: tpEntry.frame.w,
      height: tpEntry.frame.h,
    }
  }

  /**
   * Create a sprite.
   * @param {string} baseName - the base name for the sprite.
   * @param {Object[]} stateConfigs - states that the state can be in. If stateConfigs is empty, then a single frame
   * is returned using the baseName. Its state name is set to 'anon'.
   * @param {string} stateConfigs[].name - name of the state.
   * @param {number} stateConfigs[].interval - update interval in ms.
   * @param {module:hcje/sprites~CycleTypeEnumValue} stateConfigs[].cycleType - type of animation cycle
   * @param {module:hcje/sprites~frameNameGenerator} [nameGen] - the frame name generator. If not provided, the frame
   * index is simply appended to the base name in front
   * @returns {module:hcje/sprites~Sprite}
   * @throws {Error} if **spriteFactory** property not set.
   */
  createSprite(baseName, stateConfigs, frameNameGenerator) {
    if (!this.spriteFactory) {
      throw new Error(
        "You must set the spriteFactory property before calling the TextureManager's createSprite method."
      );
    }
    const nameGen = frameNameGenerator ?? this.createFrameName;
    const sprite = this.spriteFactory.createSprite(baseName, this.#texture);
    if (!stateConfigs || stateConfigs.length === 0) {
      sprite.setStateFrames('anon', {
        cycleType: CycleType.NONE,
        frames: [this.createRectData(this.#data.frames[baseName])],
        interval: 0
      });
      return sprite;
    }
  
    for (const stateConfig of stateConfigs) {
      let frameInfo;
      /** @type {module:hcje/sprites~FrameData} */
      const frameData = [];
      let frameIndex = 0;
      while(true) {
        const frameName = nameGen(baseName, stateConfig.name, frameIndex++);
        frameInfo = this.#data.frames[frameName];
        if (!frameInfo) {
          break;
        } else {
          frameData.push(this.createRectData(frameInfo));  
        }
      }
      if (frameData.length === 0) {
        frameInfo = this.#data.frames[baseName];
        if (frameInfo) {
          frameData.push(this.createRectData(frameInfo));  
        }
      }
      sprite.setStateFrames(stateConfig.name, {
        cycleType: stateConfig.cycleType ?? CycleType.LOOP,
        frames: frameData,
        interval: stateConfig.interval
      });
    }
    return sprite;
  }
}

/**
 * Load an image.
 * @param {string} source - source url for the image.
 * @returns {Promise} fulfils to HTMLImageElement.
 */
function loadImage(source) {
  const image = new Image();
  return new Promise((resolve) => {
    image.addEventListener('load', () => resolve(image), {once: true});
    image.src = source;
  });

}

/**
 * Load the sprite sheet.
 * @param {string} dataUrl - url used to retrieve the spritesheet data file.
 * @param {string} imagesUrl - url used to retrieve the associated spritesheet.
 * @param {module:hcje/domTools~BusyIndicator} [busyIndicator] -indicator to show loading.
 * @returns {Promise} fulfils to {module:hcje/sprites~TextureManager} undefined on error.
 */
export function loadSpriteSheet(dataUrl, textureUrl, busyIndicator) {
  busyIndicator?.start();
  let textureData;
  let textureManager;
  return utils.fetchJson(dataUrl)
    .then((data) => {
      textureData = data;
      return loadImage(textureUrl);
    })
    .then((image) => textureManager = new TextureManager(textureData, image))
    .catch((error) => {
      console.error(`Failed to load spritesheet.: ${error}`);
    })
    .finally(() => {
      busyIndicator?.end();
      return textureManager;
    });
}

/**
 * Interface for all sprites that can be updated by an [Animator]{@link module:hcje/sprites~Animator}/
 * @interface AnimationTarget
 */

/**
 * Update function called by the **Animator**.
 * @function module:hcje/sprites~AnimationTarget#update
 * @param {DOMHighResTimeStamp} timestamp - milliseconds
 * @param {number} deltaSeconds - elapsed time in seconds since previous update called.
 * @param {module:hcje/utils~Sprite} sprite - the sprite to be updated.
 */

/**
 * Update function called by the **Animator**.
 * @function module:hcje/sprites~AnimationTarget#update
 * @param {DOMHighResTimeStamp} timestamp - milliseconds
 * @param {number} deltaSeconds - elapsed time in seconds since previous update called.
 */

/**
 * Check whether the target has been killed.
 * @function module:hcje/sprites~AnimationTarget#isKilled
 * @returns {boolean}
 */

/**
 * @callback onAdjustmentComplete
 * @param {boolean} success - true if the adjustment was regarded as completed successfully.
 * @param {*} [reason] - argument containing information about the reason for completion. This reflects the value
 *   passed to the markComplete method. It could be undefined depending on the implementation.
 */

/**
 * Base **BaseSpriteAdjuster**. This does nothing and is expected to be overridden.
 */
export class BaseSpriteAdjuster {
  /** Completion flag @type {boolean} */
  #complete = false;
  /** @type {module:hcje/sprites~onAdjustmentComplete} */
  onCompletion;
  /**
   * @type {module:hcje/sprites~Sprite}
   * @protected
   */
  _sprite;

  /**
   * Construct base adjuster.
   * @param {module:hcje/sprites~Sprite} sprite - the target sprite.
   */
  constructor(sprite) {
    this._sprite = sprite;
    this._complete = false;
  }

  /**
   * Get completion state.
   * @return {boolean}
   */
  isComplete() {
    return this.#complete;
  }

  /**
   * Set as complete. 
   * @param {*} reason - Reason for completion. This is passed to the onCompletion callback if provided.
   */
  markComplete(reason) {
    this._sprite = undefined; // releases circular references.
    this.#complete = true;
    this.onCompletion?.(reason);
  } 

  /**
   * Perform the adjustment. This method will be called in the animation cycle.
   * @param {DOMHighResTimeStamp} timeStamp -current time stamp in ms.
   * @param {number} deltaT - change in time in seconds.
   */
  adjust(timeStamp, deltaT) {
  }
}

/**
 * Adjuster that completes when the sprite is out of bounds.
 */
export class TerminateOutOfBounds extends BaseSpriteAdjuster {
  #bottom;
  #kill;
  #left;
  #right;
  #top;

  /**
   * Construct the adjuster
   * @param {module:hcje/sprites~Sprite} sprite - the target sprite.
   * @param {module:hcje/utils~RectData} bounds - game area bounds.
   * @param {boolean} [kill = false] - if true, the sprite is killed on completion.
   */
  constructor(sprite, bounds, kill = false) {
    super(sprite);
    this.#left = bounds.x;
    this.#right = bounds.x + bounds.width;
    this.#top = bounds.y;
    this.#bottom = bounds.y + bounds.height;
    this.#kill = kill;
  }

  /** @borrow module:hcje/sprites~BaseSpriteAdjuster#adjust */
  adjust(timeStamp, deltaT) {
    const bounds = this._sprite.bounds;
    if (bounds.x + bounds.width < this.#left ||
      bounds.x > this.#right ||
      bounds.y + bounds.height < this.#top ||
      bounds.y > this.#bottom
    ) {
      console.debug(`Terminate ${this._sprite.logId} as out of bounds`);
      if (this.#kill) {
        this._sprite.kill();    
      }
      this._sprite.dynamics.vx = 0;
      this._sprite.dynamics.vy = 0;
      this._sprite.dynamics.ax = 0;
      this._sprite.dynamics.ay = 0;
      this.markComplete();
    }
  }
}

/**
 * Adjuster that completes when the sprite reaches a point. Note the dynamics should have been configured first.
 * If not moving, the adjuster is marked as complete. Once completed, the velocity and acceleration are set to zero.
 */
export class ReachTargetXY extends BaseSpriteAdjuster {
  #targetX;
  #targetY;
  /**
   * Construct the adjuster
   * @param {module:hcje/sprites~Sprite} sprite - the target sprite.
   * @param {number} targetX - destination.
   * @param {number} targetY - destination.
   */
  constructor(sprite, targetX, targetY) {
    super(sprite);
    this.#targetX = targetX;
    this.#targetY = targetY;
  }

  /**
   * Check if point reached.
   * @param {number} velocity - approach velocity.
   * @param {number} value - current value.
   * @param {number} target - target value.
   * @returns {boolean} true if reached.
   */
  targetReached(velocity, value, target) {
    if (velocity < 0) {
      return value <= target;
    } else {
      return value >= target;
    }
  }
  /** @borrow module:hcje/sprites~BaseSpriteAdjuster#adjust */
  adjust(timeStamp, deltaT) {
    const position = this._sprite.position;
    if (this.targetReached(this._sprite.dynamics.vx, position.x, this.#targetX)) {
      this._sprite.dynamics.vx = 0;
      this._sprite.dynamics.ax = 0;
      position.x = this.#targetX;
    }
    if (this.targetReached(this._sprite.dynamics.vy, position.y, this.#targetY)) {
      this._sprite.dynamics.vy = 0;
      this._sprite.dynamics.ay = 0;
      position.y = this.#targetY;
    }
    if (this._sprite.dynamics.vx === 0 && this._sprite.dynamics.vy === 0) {
      this.markComplete();
    }
  }
}


/**
 * Animator class.
 * When activated, the Animator requests animation frames and calls update on its children.
 */
export class Animator {
  /** Active property. Set true to start requesting animation frames. @type {boolean} */
  #active;

  /** Animated children with adjusters. This is a map which uses the **AnimationTarget** as the key.
   * @type {Map<Object, module:hcje/sprites~AnimationTarget>}
   */
  #children;

  /** Previous time stamp @type {DOMHighResTimeStamp} */
  #lastTimeStamp;

  /** Flag to indicate that the animation is paused. @type {boolean} */
  #paused;

  /**
   * Construct the animator.
   */
  constructor () {
    this.active = false;
    this.#paused = false;
    this.#children = new Map();
  }

  /**
   * Get the current active state.
   * @returns {boolean}
   */
  get active() {
    return this.#active;
  }

  /**
   * Set the current active state.
   * When set true, animationFrames will start to be requested and children updated.
   * When you have finished using the animator, ensure that it is set to inactive or call **discard**.
   * @param {boolean} state
   */
  set active(state) {
    if (!this.#active && state) {
      this.#active = state;
      this.#animate();
    } else {
      this.#lastTimeStamp = undefined;
      this.#active = state;
    }
  }

  /**
   * Pause the animator. This will pause the animation. The active property is unchanged. The allows the **pause** 
   * and **resume** methods to be safely called without modifying the **active** state of the animator.
   */
  pause() {
    this.#paused = true;
    this.#lastTimeStamp = undefined;
  }

  /**
   * Resume the animator. This will resume animations. Note the animations may still not actually start if the animator
   * is not active. If the animator is not paused, the call is ignored.
   */
  resume() {
    if (this.#paused) {
      this.#paused = false;
      if (this.#active) {
        this.#animate();
      }
    }
  }

  /**
   * Perform the animation cycle and update all children. If timestamp is not set, the children are not updated, and
   * but the animation cycle is initiated.
   * @param {DOMHighResTimeStamp} timeStamp - end time of the previous frame.
   */
  #animate(timeStamp) {
    if (!this.active || this.#paused) {
      return;
    }
    if (timeStamp) {
      const deltaT = this.#lastTimeStamp ? (timeStamp - this.#lastTimeStamp) / 1000 : 0;
      this.#lastTimeStamp = timeStamp;
      this.#children.forEach((target) => {
        target.update(timeStamp, deltaT);
        if (target.isKilled()) {
          this.#children.delete(target);   
        }
      });
    }
    requestAnimationFrame((evtTimeStamp) => this.#animate(evtTimeStamp));
  }

  /**
   * Add target.
   * @param {module:hcje/sprites~AnimationTarget} target
   * @throws {Error} if child does not implement the {@link module:hcje/sprites~AnimationTarget}.
   */
  addTarget(target) {
    if (!target.update) {
      throw new Error('Target does not implement the hcje/sprites~AnimationTarget interface.');
    }
    this.#children.set(target, target);
  }
 
  /**
   * Destroy the target. This kills the sprite and removes it from the animator.
   * @param {module:hcje/sprites~AnimationTarget} target
   */
  killTarget(target) {
    const child = this.#children.get(target);
    if (child) {
      child.kill();
    }
    this.#children.delete(target);
  }

  /**
   * Clear the animator. This destroys all children and deactivates the animator.
   */
  clear() {
    this.#active = false;
    this.#children.forEach((child) => this.killTarget(child));
  }

}

