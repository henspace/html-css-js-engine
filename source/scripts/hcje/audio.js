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
 * @module hcje/audio
 * @description
 * Module containing utilities for managing audio.
 */

import * as utils from './utils.js';
/**
 * @typedef {Object} AudioDefinition
 * @property {string} url - url to sound file.
 * @property {string} key - used to identify the sound in the audio module.
 * @property {number} fadeSeconds - only used for music. Allows soft start and stop.
 */

/** Map of sound effects. @type {Map<string, HTMLAudioElement>} 
 * @private
 **/
const soundEffects = new Map();

/** Map of music. @type {Map<string, module:hcje/audio~MusicChannel>} 
 * @private
 **/
const musicChannels = new Map();


/** Array of channels that need to restart on focus. @type {Array<module:hcje/audio~MusicChannel>} 
 * @private
 **/
let suspendedChannels = [];

/** Flag to identify if music is automatically stopping and starting on focus loss  @type {boolean} 
 * @private
 **/
let autoStartStopCalled = false;

/**
 * Add automatic start and stop handling to the window.
 * Both blur and focus events are handled to ensure music stops when focus is lost and resumes when
 * it's regained.
 *
 * The method can only be called once and is ignored on subsequent calls.
 */
export function autoStopStart() {
  if (autoStartStopCalled) {
    console.debug(`Multiple calls to autoStopStart ignored.`);
    return;
  }
  autoStartStopCalled = true;
  window.addEventListener('blur', () => {
    musicChannels.forEach((channel) => {
      if (channel.isPlaying()) {
        console.debug(`Stopping music ${channel.getKey()} as focus lost.`);
        channel.stop();
        suspendedChannels.push(channel);
      }
    })
  });

  window.addEventListener('focus', () => {
    for (const channel of suspendedChannels) {
        console.debug(`Restarting music ${channel.getKey()} as focus regained.`);
        channel.start();
    }
    suspendedChannels = [];
  });
}

/**
 * Music channel class used for handling music via the Web Audio API 
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API}
 * @private
 */
class MusicChannel {
  /**
   * @typedef {number} MusicCommandEnum
   * @private
   */

  /** 
   * Possible commands sent to a music channel
   * @enum {module:hcje/audio~MusicCommandEnum}
   */
  static MusicCommand = {
    NONE: 0, 
    START: 1,
    STOP: 2
  };

  /** Audio context @type {AudioContext} */
  #audioContext;
  /** Gain node @type {GainNode} */
  #gainNode;
  
  /** Audio buffer @type {AudioBuffer} */
  #audioBuffer;

  /** @type {AudioBufferSourceNode} */
  #trackSource;

  /** @type {number} */
  #fadeSeconds;

  /** @type {string} */
  #key;

  /** Cached command @type{module:hcje/audio~MusicCommandEnum} */
  #cachedCommand = MusicChannel.MusicCommand.NONE;

  /**
   * Create an audio channel. This is just a wrapper for an AudioContext and
   * GainNode.
   * @param {module:hcje/audio~AudioDefintiion} definition
   * @returns {module:hcje/audio~MusicChannel}
   */ 
  constructor(definition) {
    this.#audioContext = new AudioContext();
    this.#key = definition.key;
    try {
      this.#gainNode = this.#audioContext.createGain();
      this.#gainNode.connect(this.#audioContext.destination);
    } catch (error) {
      console.error(`Unable to create gain node: ${error}`);
      this.#gainNode = undefined;
    }
    this.#fadeSeconds = definition.fadeSeconds ?? 0;
    
  }
  
  /**
   * Set gain to value.
   * @param {number} value.
   */
  #setGain(value) {
    if (this.#gainNode) {
      this.#gainNode.gain.setValueAtTime(value, this.#audioContext.currentTime);
    }
  }
 
  /**
   * Fade in music.
   */
  #fadeIn() {
    if (this.#fadeSeconds <= 0 || !this.#gainNode) {
      return;
    }
    try {
      this.#setGain(0);
      this.#gainNode.gain.setTargetAtTime(
        1.0, this.#audioContext.currentTime, this.#fadeSeconds / 3);
    } catch (error) {
      console.error(`Unable to fade in ${this.#key}: ${error}`);
    }
  }

  /**
   * Fade out music.
   */
  #fadeOut() {
    if (this.#fadeSeconds <= 0 || !this.#gainNode) {
      return;
    }
    try {
      this.#gainNode.gain.setTargetAtTime(
        0.0, this.#audioContext.currentTime, this.#fadeSeconds / 3);
    } catch (error) {
      console.error(`Unable to fade out ${this.#key}: ${error}`);
    }
  }


  /**
   * Play music. If audioBuffer not set, the command is cached.
   */
  start() {
    if (!this.#audioBuffer) {
      this.#cachedCommand = MusicChannel.MusicCommand.START;
      return;
    }
    if (this.#trackSource) {
      console.debug(`Attempt to start ${this.#key} while already started ignored.`);
      return;
    }
    console.debug(`Start music ${this.#key}`);
    this.#cachedCommand = MusicChannel.MusicCommand.NONE;
    try {
      this.#trackSource = new AudioBufferSourceNode(this.#audioContext, {
        buffer: this.#audioBuffer,
        loop: true
      })
     
      if (this.#gainNode) {
        this.#trackSource.connect(this.#gainNode);
      } else {
        this.#trackSource.connect(this.#audioContext.destination)
      }
      if (this.#fadeSeconds) {
        this.#fadeIn();
      }
      this.#trackSource.start();
    } catch (error) {
      console.error(`Unable to start music: ${error}`);
    }
  }
  
  /**
   * Stop music. If audioBuffer not set, the command is cached. 
   */
  stop() {
    if (!this.#audioBuffer) {
      console.debug(`Audio buffer for ${this.#key} not ready so STOP command cached.`);
      this.#cachedCommand = MusicChannel.MusicCommand.STOP;
      return;
    }
    console.debug(`Stop music ${this.#key}`);
    try {
      this.#fadeOut();
      this.#trackSource.stop(this.#audioContext.currentTime + this.#fadeSeconds); 
    } catch (error) {
      console.error(`Unable to start music: ${error}`);
    } finally {
      this.#trackSource = undefined;
    }
  }

    /**
     * Get the key.
     * @returns {string}
     */
    getKey() {
      return this.#key;
    }

    /**
     * Decode audio data
     * @param {ArrayBuffer} buffer
     * @returns {Promise}
     */
    setArrayBuffer(buffer) {
      return this.#audioContext.decodeAudioData(buffer)
        .then((buffer) => this.#audioBuffer = buffer)
        .catch((error) => {
          console.debug(`Unable to decode audio data: ${error}`);
        });
    }
  
    /**
     * Action cached command. Clears the cached command.
     */
    actionCachedCommand() {
      if (!this.#audioBuffer) {
        console.debug('Attempt to action cached command before track is ready ignored.');
      } else if (this.#cachedCommand === MusicChannel.MusicCommand.START) {
        this.start();
      }
      this.#cachedCommand = MusicChannel.MusicCommand.NONE;
    }

    /**
     * Test if the channel is playing.
     * @returns {boolean}
     */
    isPlaying() {
      return !!this.#trackSource;
    }
}

/**
 * Create an HTMLAudioElement for the sound. It is stored in a map of 
 * sound effects. It is only stored once ready to play, so it may not 
 * be available in the map immediately. The options loop and autoStart are
 * ignored for sound effects.
 * @param {module:hcje/audio~AudioDefinition} definition - details of the sound to add
 * @returns {function()} function that will play the sound.
 */
export function addSoundEffect(definition) {
  const audioElement = new Audio(definition.url);
  audioElement.addEventListener('canplaythrough',
    (event) => {
      soundEffects.set(definition.key, audioElement)
    }, {once:true});

  return () => playSoundEffect(definition.key);
}


/**
 * Add music. It is stored in a map of music immediately, although it may not play immediately. Start and stop commands
 * sent while the music is being loaded are cached, so it is safe to start the music immediately it is created, even 
 * though the actual start may be delayed.
 * @param {module:hcje/audio~AudioDefinition} definition - details of the music to add.
 * @returns {Promise} fulfils to MusicChannel
 */
export function addMusic(definition) {
  if (musicChannels.get(definition.key)) {
    console.error(`Music ${definition.key} already added.`);
    return Promise.resolve();
  }
  const musicChannel = new MusicChannel(definition);
  musicChannels.set(definition.key, musicChannel);
  return utils.fetchArrayBuffer(definition.url)
    .then((arrayBuffer) => musicChannel.setArrayBuffer(arrayBuffer))
    .then((audioBuffer) => {
      musicChannel.actionCachedCommand();
      return musicChannel;
    })
    .catch((error) => {
      console.error(`Unable to create music channel ${definition.key}: ${error}`);
      musicChannels.delete(definition.key);
    });
}

/**
 * Play a sound.
 * @param {string} key - key of the sound in the map.
 */
export function playSoundEffect(key) {
  try {
    soundEffects.get(key)?.play();
  } catch (error) {
    console.error(`Unable to play sound effect. ${error}`);
  }
}

/**
 * Pause audio sound.
 * @param {string} key - key of the sound in the map.
 */
export function pauseEffect(key) {
  soundEffects.get(key)?.pause();
}

/**
 * Stop music.
 * @param {string} key - key of music 
 */
export function stopMusic(key) {
  musicChannels.get(key)?.stop();
}

/**
 * Start playing the music.
 * @param {string} key - key of music 
 */
export function startMusic(key) {
  musicChannels.get(key)?.start();
}
