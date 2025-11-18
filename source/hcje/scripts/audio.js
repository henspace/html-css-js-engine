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
 * Module containing utilities for managing audio. This includes a simple synthesiser for simple music and effects
 * which do not require a backing 
 */

import * as utils from './utils.js';

/**
 * Definition of sound based on a media file. 
 * @typedef {Object} AudioDefinition
 * @property {string} title - identification for music. This is used as its look up key.
 * @property {string} url - url to sound file.
 * @property {boolean} loop - should the tracks loop. This is ignored if used as a sound effect.
 * @property {number} fadeSeconds - only used for music; ignored for effects. Allows soft start and stop.
 */


/**
 * Definition of synthesised sound or music to play.
 * @typedef {Object} SynthAudioDefinition
 * @property {string} title - identification for music. This is just used in messages.
 * @property {number} bpm - beats per minute.
 * @property {boolean} loop - should the tracks loop. This is ignored if used as a sound effect.
 * @property {number} fadeSeconds - only used for music; ignored for effects. Allows soft start and stop.
 * @property {Array<module:hcje/audio~SynthTrack>} tracks - tracks to play. 
 */

/**
 * Details of an individual track in synthesised sounds..
 * @typedef {Object} SynthTrack 
 * @property {number} detune - value to detune the oscillator.
 * @property {module:hcje/audio~SynthInstrument} - instrument.
 * @property {number} octave - the octave for the notes. There are seven available octaves from 0 to 7 with octave
 * 4 tuned to middle A.
 * @property {SynthNoteSequence} notes - notes to decode; if the string is just an integer value, the notes are derived
 * from the previous track and detuned by the value.
 */

/**
 * The music score for synthesised sounds.
 * Each note in the Notes sequence is defined as follows. Notes can be separated with spaces or pipes '|' but this is
 * not necessary and is typically only used to make the bars more readable. Characters that do not match a note
 * expression are ignored.
 * Note that characters shown in square brackets are optional. The square brackets do not form part of the notation.
 * + [O]N[M][F][.][@]
 *     + O: octave modifier: + or -: shifts the octave for the note up or down one octave from the track octave set
 *     by the [SynthTrack]{@link module:hcje/audiSynthTrack} octave property.
 *     + N: note: A, B, C, D, E, F, G or ~ for a rest.
 *     + M: modifier: # or b for sharps and flats.
 *     + F: fraction of note; e.g. note duration is 1/F. Defaults to a quarter note, 4.
 *     + .: whether the note duration is dotted.
 *     + @: creates an arpeggio using up to 2 extra notes to create a triad. Note that the note duration needs to be 
 *     long enough to fit in the extra notes. An example would be "C2@".
 * @typedef {string} SynthNoteSequence
 */

/**
 * ADSR envelope for synthesised sounds. This is an array of four numbers.
 *
 * + adsr[0]: attack in seconds.
 * + adsr[1]: decay in seconds.
 * + adsr[2]: sustain as proportion of max gain. Note although sustain is normally in percent, for this module it is a proportion.
 * + adsr[3]: release in seconds.
 *
 * @typedef {Array<number>} SynthEnvelope
 */
/**
 * Information for a synthesised instrument.
 * @typedef {Object} SynthInstrument
 * @property {string} waveform - see [OscillatorNode: type property]{@link https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type} 
 * @property {module:hcje/audio~SynthEnvelope} - adsr - ADSR envelope.
 * @property {number} sustainTime - duration in seconds of the sustain in the ADSR envelope.
 * @property {boolean} allowMerge - if true, a note that is played before the previous note starts to release, will just
 * continue at the previous sustain level if the note is the the same frequency as the previous.
 * @property {number} maxGain - maximum gain at end of attack. 
 * @property {number} sweepFactor - the end frequency of a note is calculated as the starting frequency times
 * the sweepFactor to create a sweep effect.
 */

/**
 * Sequence of notes to play and instrument details for synthesised sounds.
 * @typedef {Array<number>} SynthDecodedSequence
 * @property {number} detune - detune value for oscillator.
 * @property {Array<number>} freqs - array of frequencies.
 *
 * @private
 */


/**
 * Class which provides a connection for all outputs. Only a single instance is 
 * normally created.
 * @private
 */
class AudioManager {
  /** Audio player factory @type {module:hcje/audio~AudioPlayerFactory} */
  #audioPlayerFactory;
  /** Map of sound effects. @type {Map<string, HTMLAudioElement>} */
  #soundEffects = new Map();
  /** Background music. @type {module:hcje/audio~MusicPlayer} */
  #backgroundMusic;
  /** The underlying AudioContext @type {AudioContext} */
  context;
  /** Dynamics compressor @type {DynamicsCompressorNode} */
  #decompressor;
  /** Global gain @type {GainNode} */
  #gain
  
  /**
   * Construct the AudioManager
   */
  constructor() {
    this.context = new AudioContext();
    this.#decompressor = this.context.createDynamicsCompressor();
    this.#decompressor.connect(this.context.destination);
    this.#gain = new GainNode(this.context);
    this.#gain.connect(this.#decompressor);
    this.#audioPlayerFactory = new AudioPlayerFactory();
  }
  
  /**
   * Get the input for the audio manager. This is where all nodes should connect if they want to 
   * connect to the destination of the underlying destination.
   * @returns {AudioNode}
   */
  get inputNode() {
    return this.#gain;
  }

  /**
   * Get the gain value. 
   * @returns {AudioParam}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GainNode/gain}
   */ 
  get gain() {
    return this.#gain.gain
  }

  /**
   * Set the gain value. This is an almost instantaneous change but a time constant is applied to minimise clicks.
   * @param {number} value - gain value
   */
  set gain(value) {
    this.#gain.gain.setTargetAtTime(value, this.context.currentTime, 0.08);
  }
  
  /**
   * Create a AudioSfxPlayer. It is stored in a map of 
   * sound effects. It is only stored once ready to play, so it may not 
   * be available in the map immediately. If the definition includes a **loop** property, it is set to false as sound
   * effects are not allowed to loop.
   * @param {module:hcje/audio~AudioDefinition|module:hcje/audio~SynthAudioDefinition} definition - details of the sound
   *   to add
   * @returns {Promise} fulfils to true on success. 
   */
  addAudioSfx(definition) {
    if (definition.loop) {
      definition.loop = false;
    }
    return this.#audioPlayerFactory.createAudioSfxFromDefinition(definition)
      .then((sfx) => {
        this.#soundEffects.set(definition.title, sfx);
        return true;
      })
  }

  /**
   * Play audio effect.
   * The title is used as a lookup into the map of existing sound effects.
   * @param {string} title - title of the sound effect.
   */
  playAudioSfx(title) {
    try {
      this.#soundEffects.get(title)?.play();
    } catch (error) {
      console.error(`Unable to play sound effect ${title}: ${error}`);
    }
  }

  
  /**
   * Set the background music. The background music will automatically start.
   * Any stop or start commands to the player are cached, so that if it takes a long time to 
   * load, the final playing state will still reflect the last command received.
   * @param {module:hcje/audio~AudioDefinition|module:hcje/audio~SynthAudioDefinition} definition - details of the music
   *   to add.
   * @returns {Promise} fulfils to true on success.
   */
  setMusic(definition) {
    console.debug(`Set music ${definition.title} called.`);
    
    if (this.#backgroundMusic) {
      console.debug('Stop existing music.');
      this.#backgroundMusic.stop();
    }
    this.#backgroundMusic = new MusicPlayer(definition.title, definition.fadeSeconds);
    this.#backgroundMusic.connect(this.#gain);
    this.#backgroundMusic.start();
    return this.#audioPlayerFactory.createPlayerFromDefinition(definition)
      .then((player) => this.#backgroundMusic.setPlayer(player))
      .then(() => {
        this.#backgroundMusic.actionCachedCommand();
        return true;
      })
      .catch((error) => {
        console.error(`Unable to create this.#background music player ${definition.title}: ${error}`);
        this.#backgroundMusic = undefined;
        return false;
      });
  }


  /**
   * Stop background music.
   */
  stopMusic() {
    this.#backgroundMusic?.stop();
  }

  /**
   * Start playing the background music.
   */
  startMusic() {
    if (this.#backgroundMusic && !this.#backgroundMusic.isPlaying()) {
      this.#backgroundMusic?.start();
    }
  }
}

/**
 * Class for playing synthesised sequences.
 * @private
 */
class SequencePlayer {
  /** Number of time constants to reach effective end @type {number} */
  static TC_COMPLETE = 3;
  /** @type {module:hcje/audio~SynthDecodedSequence}*/
  #sequence;
  /** Position in the sequence @type {number} */
  #position;
  /** Last frequency played @type {number} */
  #lastFrequency;
  /** @type {GainNode} */
  #gainNode;
  /** {OscillatorNode | AudioScheduledSourceNode} */
  #sourceNode;
  /** Attack time constant @type {number} */
  #attackTc;
  /** Decay time constant @type {number} */
  #decayTc;
  /** Release time constant @type {number} */
  #releaseTc;
  /** Time constant for frequency change @type {number} */
  #freqTc;
  /** Start for decay @type {number} */
  #decayStart;
  /** Start for sustain @type {number} */
  #sustainStart;
  /** Start for release @type {number} */
  #releaseStart;
  /** Sustain level @type {number} */
  #sustainLevel;
  /** Uses ADSR @type {boolean} */
  #usesAdsr;
  /** Should notes merge if possible @type {boolean} */
  #merge;
  /** Max gain @type {number} */
  #maxGain;
  /** Factor to multiply the frequency by to get frequency at end @type {number} */
  #sweepFactor;
    
  /**
   * Construct sequence player.
   * @param {Object} config
   * @param {module:hcje/audio~SynthDecodedSequence} config.sequence - decoded sequence to play.
   * @param {GainNode} config.gainNode - gain  node.
   * @param {OscillatorNode | AudioScheduledSourceNode} config.sourceNode - source used by the player.
   * @param {number} config.interval - interval between notes in seconds.
   */
  constructor(config) {
    this.#sequence = config.sequence;
    this.#gainNode = config.gainNode;
    this.#sourceNode = config.sourceNode;
    this.#merge = !!config.sequence.instrument.merge;
    this.#maxGain = config.sequence.instrument.maxGain ?? 1;
    this.#position = 0;
    this.#lastFrequency = 0;
    this.#usesAdsr = !!config.sequence.instrument.adsr;
    this.#sweepFactor = config.sequence.instrument.sweepFactor ?? 1;
    if (this.#usesAdsr) {
      const attack = config.sequence.instrument.adsr[0];
      const decay = config.sequence.instrument.adsr[1];
      this.#sustainLevel = config.sequence.instrument.adsr[2]
      const release = config.sequence.instrument.adsr[3];

      this.#attackTc = attack / SequencePlayer.TC_COMPLETE;
      this.#decayTc = decay / SequencePlayer.TC_COMPLETE;
      this.#releaseTc = release / SequencePlayer.TC_COMPLETE;
      this.#freqTc = this.#attackTc + this.#decayTc + this.#releaseTc;
      this.#decayStart = attack;
      this.#sustainStart = attack + decay;
      this.#releaseStart = config.sequence.instrument.sustainTime + this.#sustainStart;
      this.#merge = config.sequence.instrument.allowMerge && this.#releaseStart >= config.interval;
    }
  }
  
  /**
   * Apply the envelope.
   * @param {number} newFreq - the new frequency
   * @private
   */
  #applyEnvelope(newFreq) {
    let start = audioMgr.context.currentTime;
    this.#gainNode.gain.cancelScheduledValues(start);
    if (this.#usesAdsr) {
      if (newFreq !== this.#lastFrequency || !this.#merge) {
        this.#gainNode.gain.setTargetAtTime(this.#maxGain, start, this.#attackTc);
        this.#gainNode.gain.setTargetAtTime(this.#sustainLevel * this.#maxGain, start + this.#decayStart, this.#decayTc);  
      } 
      this.#gainNode.gain.setTargetAtTime(0, start + this.#releaseStart, this.#releaseTc);
    } else {
      this.#gainNode.gain.setTargetAtTime(this.#maxGain, start, 0.01);
    }
  }
  
  /**
   * Apply a rest. If an envelope is in use, nothing is done as the previous note will be allowed to release.
   * If no envelope is in use, the gain is immediately set to 0;
   * @private
   */
  #applyRest() {
    if (!this.#usesAdsr) {
      this.#gainNode.gain.setTargetAtTime(0, audioMgr.context.currentTime, 0.01);
    }
  }
  
  /**
   * Set the frequency.
   * @param {number} newFreq
   * @private
   */
  #applyFreq(newFreq) {
    if (this.#sourceNode.frequency) {
      const start = audioMgr.context.currentTime;
      this.#sourceNode.frequency.cancelScheduledValues(start);
      this.#sourceNode.frequency.setValueAtTime(newFreq, start);
      if (this.#sweepFactor !== 1) {
        this.#sourceNode.frequency.setTargetAtTime(newFreq * this.#sweepFactor, start, this.#freqTc);
      }
      
    } 
  }

  /**
   * Play the next note in the sequence. The method returns false if the last note has been played.
   * if the method continues to be called, the sequence play will loop, returning false each time the
   * end is reached.
   * @returns {boolean} true if there are more notes to play.
   */
  playNext() {  
    if (!this.#sequence) {
      console.log(`No sequence for player to play.`);
      return false;
    }
    const newFreq = this.#sequence.freqs[this.#position++];
    if (newFreq === 0) {
      this.#applyRest();
    } else {
      this.#applyFreq(newFreq); 
      this.#applyEnvelope(newFreq);
    }
    this.#lastFrequency = newFreq;
    if (this.#position >= this.#sequence.freqs.length) {
      this.#position = 0;
      return false;
    } else {
      return true;
    }
  }
  
  /**
   * Stop the player. This stops the oscillator.
   * If an envelope is in use the stop is delayed by the time it takes to fully play a note.
   */
  stop() {
    this.#position = 0;
    if (this.#usesAdsr) {
      setTimeout(() => {
        this.#sourceNode.stop();
      }, 1000 * this.#releaseStart + SequencePlayer.TC_COMPLETE * this.#releaseTc);
    } else {
      this.#sourceNode.stop();  
    }
  }
}

/** 
 * Sound effect player
 * @interface AudioSfxPlayer
 * @private
 */
/**
 * Play the effect.
 * @function module:hcje/audio~AudioSfxPlayer#play
 */

/**
 * Simple sound player.
 * @interface AudioPlayer
 * @private
 */

/**
 * Check if the audio is ready to play.
 * @function module:hcje/audio~AudioPlayer#isReady
 * @returns {boolean}
 */ 
 
/**
 * Check if the audio is playing.
 * @function module:hcje/audio~AudioPlayer#isPlaying
 * @returns {boolean}
 */ 
 
/**
 * Connect the audio to a target sound. Depending on the audio type, this may occur immediately or be delayed
 * until the audio is actually played. 
 * @function module:hcje/audio~AudioPlayer#connect
 * @param {AudioNode} destination
 * @returns {AudioNode}
 */ 

/**
 * Start the associated sound.
 * @function module:hcje/audio~AudioPlayer#start
 */ 

/**
 * Stop the associated sound.
 * This is not guaranteed to stop the sound. For example, sound effects,
 * which are too short to warrant stopping, may not do anything when stop 
 * is called.
 * @function module:hcje/audio~AudioPlayer#stop
 */ 
 

  
/**
 * Synthesiser
 * @implements module:hcje/audio~AudioPlayer
 * @implements module:hcje/audio~AudioSfxPlayer
 * @private
 */
class Synthesiser {
  /** @type {Array<GainNode>} */
  #gainNodes;
  /** @type {Array<module:hcje/audio~SynthDecodedSequence>}*/
  #sequences;
  /** Loop @type {boolean} */
  #loop;
  /** Duration of a quaver in ms @type {number} */
  #quaverMs;
  /** Stop signal. @type {boolean} */
  #stopSignal;
  /** Audio source factories @type {Array<BaseAudioSourceFactory>} */
  #audioSourceFactories;
  /** Playing flag @type {boolean} */
  #playing;

   
  /**
   * Constructor for the dynamic sound 
   * @param {Array<module:hcje/audio~SynthDecodedSequence>} sequences - sequences to play.
   * @param {Object} options
   * @param {number} options.quaverMs - milliseconds per quaver
   * @param {boolean} options.loop - true if the sound just loops.
   */
  constructor(sequences, options) {
    this.#sequences = sequences;
    this.#quaverMs = options.quaverMs;
    this.#loop = options.loop ?? false;
    console.debug(`Synthesiser loop set to ${this.#loop}`);
    this.#stopSignal = false;
    this.#audioSourceFactories = [];
    this.#gainNodes = [];
    this.#playing = false;
    for (const sequence of this.#sequences) {
      const gainNode = new GainNode(audioMgr.context, {gain: 0});
      this.#gainNodes.push(gainNode);
      this.#audioSourceFactories.push(this.#createAudioSourceFactory(sequence));
    }
  } 
  
  /**
   * Play all sequences to completion.
   * @returns {Promise}
   * @private
   */
  #playSequencesToCompletion() {
    const players = [];
    this.#playing = true;
    return new Promise((resolve) => {
      let moreToPlay = this.#loop;
      for (let n = 0; n < this.#sequences.length; n++) {
        const sequence = this.#sequences[n];
        const gainNode = this.#gainNodes[n];
        const sourceNode = this.#audioSourceFactories[n].createSource();
        sourceNode.connect(gainNode);
        sourceNode.start();
        const player = new SequencePlayer({sequence, gainNode, sourceNode, interval: this.#quaverMs / 1000});
        players.push(player);
        moreToPlay = player.playNext() || moreToPlay;
      }
      if (!moreToPlay) {
        this.#stopAllPlayers(players);
        resolve();
        return;
      }
      let intervalTimer;
      intervalTimer = setInterval(() => {
        moreToPlay = this.#loop;
        for (const player of players) {
          moreToPlay = player.playNext() || moreToPlay;
        }
        if (!moreToPlay || this.#stopSignal) {
          clearInterval(intervalTimer);
          this.#stopAllPlayers(players);
          resolve();
        }
      }, this.#quaverMs);  
    });
  }

  /**
   * Stop all the players.
   * @param {Array<module:hcje/audio~AudioPlayer>} players - the players to stop.
   * @private
   */
  #stopAllPlayers(players) {
    for (const player of players) {
      player.stop();
    }
    this.#playing = false;
  }
  
  /**
   * @borrows module:hcje/audio~AudioPlayer#isReady
   */
  isReady() {
    return true;
  }
  
  /**
   * @borrows module:hcje/audio~AudioPlayer#isPlaying
   */
  isPlaying() {
    return this.#playing;
  }
  /**
   * @borrows module:hcje/audio~AudioPlayer#connect
   */
  connect(destination) {
    for (const gainNode of this.#gainNodes) {
      gainNode.connect(destination);
    }
  }

  /**
   * @borrows module:hcje/audio~AudioSfxPlayer
   */
  play() {
    if (this.#loop) {
      console.warn('Attempt to play looping sound as sound effect ignored.');
      return;
    }
    this.start();
  }

  /**
   * @borrows module:hcje/audio~AudioPlayer#start
   */
  start() {
    this.#stopSignal = false;
    if (!this.#loop || !this.#playing) {
      this.#playSequencesToCompletion();
    }
  }
  
  /**
   * @borrows module:hcje/audio~AudioPlayer#stop
   */
  stop() {
    this.#stopSignal = true; 
  }
  
  /**
   * Create an [AudioSourceFactory]{module:hcje.audio~AudioSourceFactory} based on an oscillator type.
   * @param {Array<module:hcje/audio~SynthDecodedSequence>} sequences - sequences to play.
   * @returns {module:hcje/audio~BaseAudioSourceFactory}
   * @private
   */
  #createAudioSourceFactory(sequence) {
    switch (sequence.instrument.waveform) {
      case 'noise':
        return new WhiteNoiseFactory(1, {
          frequency: 440,
          detune: sequence.detune,
          type: 'bandpass'
        });
      default:
        return new OscillatorNodeFactory({
          frequency: 440,
          detune: sequence.detune,
          type: sequence.instrument.waveform || 'sine' 
        }); 
    }
  }
}

/**
 * @interface AudioSourceFactory
 * @see [AudioScheduledSourceNode]{@link https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode}
 * @private
 */

/**
 * Create audio source.
 * @function module:hcje/audio~AudioSourceFactory#createSource
 * @param {Object} options - properties depend on the implementation.
 * @return {AudioScheduledSourceNode}
 */

/**
 * Factory for creating oscillator nodes.
 * @implements module:hcje/audio~AudioSourceFactory
 * @private
 */
class OscillatorNodeFactory {
  /** Options for the oscillator node. @type {OscillatorNode} */
  #options;

  /**
   * Construct the factory.
   */ 
  constructor(options) {
    this.#options = options;
  }
  
  /**
   * @borrows module:hcje/audio~AudioSourceFactory#createSource
   */
  createSource() {
    return new OscillatorNode(audioMgr.context, this.#options);
  }  
  
}

/**
 * White noise which partially implements the
 * [AudioScheduledSourceNode]{@link https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode}
 * interface.
 * @implements {AudioScheduledSourceNode} 
 */
class WhiteNoiseSource extends BiquadFilterNode {
  /** @type {AudioScheduledSourceNode} */
  #source;
  /** 
   * Create WhiteNoiseSource
   * @param {AudioBufferSourceNode} source - the white noise source.
   * @param {Object} options - See {@link https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode} 
   */
  constructor(source, options) {
    super(audioMgr.context, options);
    this.#source = source;
    // const filter = new BiquadFilterNode(audioMgr.context, options);
    this.#source.connect(this);
  }

  /**
   * Start the source.
   * @param {number} [when] - when to start.
   */ 
  start(when) {
    this.#source.start(when);
  }
  /**
   * Stop the source.
   * @param {number} [when] - when to stop.
   */ 
  stop(when) {
    this.#source.stop(when);
  }
}

/**
 * White noise audio source.
 * @implements module:hcje/audio~AudioSourceFactory
 * @private
 */
class WhiteNoiseFactory {
  /** @type {AudioBuffer} */
  #buffer;
  /** Filter options. See {@link https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode} @type {Object} */
  #options; 
  /** 
   * Create WhiteNoise
   * @param {number} duration - duration of the sample
   * @param {Object} options - See {@link https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode} 
   */
  constructor(duration, options) {
    this.#options = options;
    this.#buffer = audioMgr.context.createBuffer(1, audioMgr.context.sampleRate * duration, audioMgr.context.sampleRate);  
    const channelData = this.#buffer.getChannelData(0);
    for (let n = 0; n < this.#buffer.length; n++) {
      channelData[n] = 2 * Math.random() - 1;
    }
  }
  
  /**
   * @borrows module:hcje/audio~AudioSourceFactory#createSource
   */
  createSource() {
    const source = audioMgr.context.createBufferSource();
    source.buffer = this.#buffer;
    source.loop = true;
    
    return new WhiteNoiseSource(source, this.#options);
  }

}


/**
 * Factory for creating [AudioPlayer]{@link module:hcje/audio~AudioPlayer}s and 
 * [AudioSfxPlayer]{@link module:hcje/audio~AudioSfxPlayer}s.
 * @private
 */
class AudioPlayerFactory {
  /** Table of frequencies for different octaves. @type {Array<Map<note:string,frequency:number>>} */
  #frequencyTables;
  /** Triads. See {@link https://splice.com/blog/triads-music-theory/} @type {Map<string,Array<string>>} */
  #majorTriads = new Map([
    ['A', ['C#', 'E']],

    ['A#', ['D', 'F']],
    ['Bb', ['D', 'F']],
    
    ['B', ['D#', 'F#']],

    ['C', ['E', 'G']],

    ['C#', ['E#', 'G#']],
    ['Db', ['F', 'Ab']],

    ['D', ['F#', 'A']],

    ['D#', ['G', 'A#']],
    ['Eb', ['G', 'Bb']],

    ['E', ['G#', 'B']],

    ['F', ['A', 'C']],

    ['F#', ['A#', 'C#']],
    ['Gb', ['Bb', 'Db']],

    ['G', ['B', 'D']],

    ['G#', ['B#', 'D#']],
    ['Ab', ['C', 'Eb']],
  ]);
  
  #minorTriads = new Map([
    ['A', ['C', 'E']],

    ['A#', ['C#', 'E#']],
    ['Bb', ['Db', 'F']],
    
    ['B', ['D', 'F#']],

    ['C', ['Eb', 'G']],

    ['C#', ['E', 'G#']],
    ['Db', ['Fb', 'Ab']],

    ['D', ['F', 'A']],

    ['D#', ['F#', 'A#']],
    ['Eb', ['Gb', 'Bb']],

    ['E', ['G', 'B']],

    ['F', ['Ab', 'C']],

    ['F#', ['A', 'C#']],
    ['Gb', ['A', 'Db']],

    ['G', ['Bb', 'D']],

    ['G#', ['B', 'D#']],
    ['Ab', ['Cb', 'Eb']],
  ]);
  
  /**
   * Calculate the table of note frequencies. This only runs once to populate the #frequencyTables property.
   * @private
   */
  #buildFrequencyTables() {
    if (this.#frequencyTables) {
      return;
    }
    const minOctave = 0;
    const maxOctave = 7;
    const baseNote = 'A';
    const baseOctave = 4
    const baseFreq = 440;

    const OCTAVE_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const indexOfBaseNote = OCTAVE_NOTES.indexOf(baseNote);
    const octaveFreqs = [];
    for (let octave = minOctave; octave <= maxOctave; octave++) {
      const frequencies = new Map();
      for (let index = 0; index < OCTAVE_NOTES.length; index++) {
        const semitonesFromBase = (octave - baseOctave) * OCTAVE_NOTES.length   - indexOfBaseNote + index;
        const freq = baseFreq * Math.pow(2, semitonesFromBase/12);
        frequencies.set(OCTAVE_NOTES[index], freq);
      }
      // add flat aliases for sharps and flats which are already in octave under a different note.
      frequencies.set('Cb', frequencies.get('B'));
      frequencies.set('Db', frequencies.get('C#'));
      frequencies.set('Eb', frequencies.get('D#'));
      frequencies.set('E#', frequencies.get('F'));
      frequencies.set('Fb', frequencies.get('E'));
      frequencies.set('Gb', frequencies.get('F#'));
      frequencies.set('Ab', frequencies.get('G#'));
      frequencies.set('Bb', frequencies.get('A#'));
      frequencies.set('B#', frequencies.get('C'));
      octaveFreqs.push(frequencies);
    }
 
    return this.#frequencyTables = octaveFreqs;
  }
  
  /**
   * Log frequency tables for all supported octaves.
   */
  logFrequencyTables() {
    for (const octave of this.#frequencyTables) {
      let notes = '';
      for (const entry of octave.entries()) {
        notes = `${notes}${entry[0]}: ${entry[1]}, `;
      }
      console.log(notes);
    }
  }
  
  /**
   * Decode music track. Character sequences that do not match 
   * @param {module:hcje/audio~SynthTrack} track - track definition
   * @returns {SynthDecodedSequence} undefined if invalid music or no notes. 
   * @private
   */
  #decodeTrack(track) {
    if (!track?.notes || track.notes.length === 0) {
      console.error(`No notes provided.`);
      return;
    }
    this.#buildFrequencyTables();
    const trackOctave = track.octave ?? 4;
    let detune = track.detune ?? 0;
    
    const noteDefns = [...track.notes.matchAll(/(\+*|-*)?([ABCDEFG~](?:[#b])?)(\d)?(\.)?([@$])?/gm)];
    const freqData = [];
    for (const noteDefn of noteDefns) {
      let octave = trackOctave;
      const octaveModifier = noteDefn[1] ?? '';
      if (octaveModifier.startsWith('+')) {
        octave = utils.clamp(trackOctave + octaveModifier.length, 0, this.#frequencyTables.length - 1);  
      } else if (octaveModifier.startsWith('-')) {
        octave = utils.clamp(trackOctave - octaveModifier.length, 0, this.#frequencyTables.length - 1);  
      }
      const note = noteDefn[2];

      const noteFraction = noteDefn[3] ?? 4; // default to quarter note
      const dotted = !!noteDefn[4];
      const arpeggio = !!noteDefn[5];
      let triads;
      if (arpeggio) {

        triads = noteDefn[5] === '@' ? this.#majorTriads : this.#minorTriads;
      }
      let quavers = 8 / noteFraction;
      if (dotted) {
          quavers *= 1.5;  
      }
      quavers = Math.floor(quavers);
      const freq = note === '~' ? 0 : this.#frequencyTables[octave].get(note);
      if (freq === undefined) {
        console.error(`Illegal note ${note} converted to rest.`);
        freq = 0;
      }
      for (let q = 0; q < quavers; q++) {
        if (q === 0) {
          freqData.push(freq);
        } else if (arpeggio && freq !== 0 && q < 3) {
          const chordNote = triads.get(note)[q - 1];
          const chordFreq = this.#frequencyTables[octave].get(chordNote);
          if (!chordFreq) {
            console.warn(`Illegal chord note ${chordNote} for note ${note} converted to rest.`);
            chordFreq = 0;
          }
          freqData.push(chordFreq);
        } else {
          freqData.push(0);
        }
      }
    }
    return {detune, instrument: track.instrument, freqs: freqData};
  }
  
  /**
   * Create a synthesiser.
   * @param {module:hcje/audio~SynthAudioDefinition} definition - the audio to create.
   * @returns {Promise} fulfils to {@link module:hcje/audio~Synthesiser}
   * @throws {Error} thrown if sound cannot be created.
   * @private
   */
  #createSynthesiser(definition) {
    if (!definition) {
      throw new Error ('Cannot create dynamic sound as no definition provided.');
    }
         
    const quaverMs = Math.round(60000 / (definition.bpm * 2));
    
    const decodedTracks = [];
    for (let index = 0; index < definition.tracks.length; index++) {
      const track = definition.tracks[index];
      let decodedTrack;
      let detunePreviousBy;
      if (/^\d+$/.test(track.notes)) {
        detunePreviousBy = Number.parseInt(track.notes);
      }
      if (index > 0 && detunePreviousBy !== undefined) {
        decodedTrack = {
          detune: detunePreviousBy,
          freqs: decodedTracks[index - 1].freqs,
          instrument: decodedTracks[index - 1].instrument
        }
      } else if (track.notes) {
        decodedTrack = this.#decodeTrack(track);  
      }
      if (decodedTrack) {
        decodedTracks.push(decodedTrack);         
      }
    }
    
    return new Synthesiser(decodedTracks, {quaverMs, loop: definition.loop});
  }

  /**
   * Create a player from a definition.
   * @param {module:hcje/audio~AudioDefinition|module:hcje.audio~SynthAudioDefinition} definition
   * @returns {Promise} fulfils to [AudioPlayer]{@link module:hcje/audio~AudioPlayer}
   */ 

  createPlayerFromDefinition(definition) {
    if (definition.tracks) {
      return Promise.resolve(this.#createSynthesiser(definition));
    } else {
      return MediaFilePlayer.createFromDefinition(definition);
    }
  }

  /**
   * Create a sound effect from a definition. For synthesised audio, the effect is automatically connected to the
   * **audioMgr.inputNode**.
   * @param {module:hcje/audio~AudioDefinition | module:hcje/audio~SynthAudioDefinition} definition - definition
   *    for audio.
   * @returns {Promise} fulfils to a [AudioSfxPlayer]{@link module:hcje.audio~AudioSfxPlayer}
   * @throws {Error} if definition is set to loop.
   */
  createAudioSfxFromDefinition(definition) {
    if (definition.tracks) {
      if (definition.loop) {
        throw new Error(`Sound effects cannot loop. Check the definition.`);
      }
      return Promise.resolve(this.#createSynthesiser(definition))
        .then((sfx) => {
          sfx.connect(audioMgr.inputNode);
          return sfx;
        });
    } else {
      return MediaFileSfx.createFromDefinition(definition);
    }
  }

}




/**
 * Sound effect created from a media file.
 * @private
 */
class MediaFileSfx {
  /** @type {HTMLAudioElement} */
  #audioElement;

  /**
   * Construct from url.
   * @param {string} url - url to the media file
   */ 
  constructor(url) {
    this.#audioElement = new Audio(url);
  }

  /**
   * @borrows module:hcje.audio~AudioSfxPlayer#play
   */
  play() {
    this.#audioElement.play();
  }

  /**
   * Create **MediaFileSfx** from the definition.
   * @param {module:hcje/audio~AudioDefinition}
   * @returns {module:hcje/audio~MediaFileSfx}
   */
  static createFromDefinition(definition) {
   const sfx = new MediaFileSfx(definition.url);
    return new Promise((resolve) => {
      sfx.#audioElement.addEventListener('canplaythrough',
        (event) => resolve(sfx), {once:true});
    });
  }
}

/**
 * Buffer based sound from a media file.
 * @implements module:hcje/audio~AudioPlayer
 * @private
 */
class MediaFilePlayer {
  /** @type {AudioNode} */
  #destination;
  /** @type {AudioBuffer} */
  #buffer;
  /** @type {boolean} */
  #loop;
  /** @type {AudioBufferSourceNode} */
  #source;
  /** Flag to determine if sound is ready to play. @type {boolean} */
  #ready;
  /** Flag to determine if sound is playing. @type {boolean} */
  #playing;

  /**
   * Construct the buffer based sound.
   * @param {Object} options   
   * @param {boolean} options.loop - true to loop sound.
   */
  constructor(options) {
    this.#ready = false;
    this.#playing = false;
    this.#loop = !!options.loop;
  }

  /**
   * Create **MediaFilePlayer** from the definition.
   * @param {module:hcje/audio~AudioDefinition} definition - details of the music to add.
   * @returns {Promise} fulfils to {@link module:hcje/audio~MediaFilePlayer}
   */
  static createFromDefinition(definition) {
    const audioPlayer= new MediaFilePlayer({loop: !!definition.loop});
    return utils.fetchArrayBuffer(definition.url)
      .then((arrayBuffer) => audioPlayer.#setBufferFromData(arrayBuffer))
      .then(() => audioPlayer);
  }

  /**
   * Decode audio data and load into the buffer.
   * @param {ArrayBuffer} data
   * @returns {Promise}
   * @private
   */
  #setBufferFromData(data) {
    this.#ready = false;
    this.#buffer = undefined;
    return audioMgr.context.decodeAudioData(data)
      .then((buffer) => {
        this.#buffer = buffer;
        this.#ready = true;
      })
      .catch((error) => {
        console.error(`Unable to decode audio data: ${error}`);
        return;
      });
  }

  /**
   * @borrows module:hcje/audio~AudioPlayer#isReady
   */
  isReady() {
    return this.#ready;
  }
  
  /**
   * @borrows module:hcje/audio~AudioPlayer#isPlaying
   */
  isPlaying() {
    return this.#playing;
  }

  /**
   * @borrows module:hcje/audio~AudioPlayer#connect
   */
  connect(destination) {
    this.#destination = destination;
  }

  /**
   * @borrows module:hcje/audio~AudioPlayer#start
   */
  start() {
    if (!this.#buffer) {
      console.warn(`Attempt to start sound when no buffer available to play.`);
      return;
    }
    
    if (this.#playing) {
      console.warn(`Attempt to start sound while already started ignored.`);
      return;
    }
    try {
      this.#source = new AudioBufferSourceNode(audioMgr.context, {
        buffer: this.#buffer,
        loop: this.#loop
      })
      this.#source.connect(this.#destination);
      this.#source.start();
      this.#playing = true;
    } catch (error) {
      console.error(`Unable to start audio: ${error}`);
    }
  }
  
  /**
   * @borrows module:hcje/audio~AudioPlayer#stop
   */
  stop() {
    if (!this.#playing) {
      console.warn(`Attempt to stop audio when not playing ignored.`);
      return;
    }
    this.#source.stop(audioMgr.context.currentTime);  
    this.#playing = false;
  }

}


/**
 * Music player class used for handling music via the Web Audio API.
 * This class is a wrapper for other players but provides fade in and out options and caching of commands
 * while players are getting ready.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API}
 * @implements module:hcje/audio~AudioPlayer
 * @private
 */
class MusicPlayer {
  /**
   * @typedef {number} MusicCommandEnum
   * @private
   */

  /** 
   * Possible commands sent to a music player
   * @enum {module:hcje/audio~MusicCommandEnum}
   */
  static MusicCommand = {
    NONE: 0, 
    START: 1,
    STOP: 2
  };

  /** Title @type{string} */
  #title;

  /** Gain node @type {GainNode} */
  #gainNode;
  
  /** @type {module:hcje/audio~AudioPlayer} */
  #audioPlayer;

  /** @type {number} */
  #fadeSeconds;

  /** Cached command @type{module:hcje/audio~MusicCommandEnum} */
  #cachedCommand = MusicPlayer.MusicCommand.NONE;

  /** Flag indicates that music was playing when focus lost. @type {boolean} */
  #playingWhenFocusLost;

  /**
   * Create a music player
   * @param {string} title - name of music just used for identification in messages.
   * @param {number} [fadeSeconds = 1] - time in seconds to fade in and out when stopping or starting.
   * @returns {module:hcje/audio~MusicPlayer}
   */ 
  constructor(title, fadeSeconds = 1) {
    this.#title = title;
    this.#gainNode = audioMgr.context.createGain();
    this.#fadeSeconds = fadeSeconds;
    window.addEventListener('blur', () => {
      if (this.isPlaying()) {
        console.debug(`Lost focus so stop ${this.#title}`)
        this.#playingWhenFocusLost = true;
        this.stop();
      } else {
        this.#playingWhenFocusLost = false;
      }
    });

    window.addEventListener('focus', () => {
      if (this.#playingWhenFocusLost) {
        console.debug(`Was playing when focus originally lost, so resume ${this.#title}`)
        this.start();
      }
    });
  }
  /**
   * Add player to the music player
   * @param {module:hcje/audio~AudioPlayer} audioPlayer
   */ 
  setPlayer(audioPlayer) {
    if (this.#audioPlayer) {
      throw new Error(`Only one player permitted for ${this.#title}`);
    }
    this.#audioPlayer = audioPlayer;
    audioPlayer.connect(this.#gainNode);
  }
  
  /**
   * Set gain to value.
   * @param {number} value.
   * @private
   */
  #setGain(value) {
    if (this.#gainNode) {
      this.#gainNode.gain.setValueAtTime(value, audioMgr.context.currentTime);
    }
  }
 
  /**
   * Fade in music.
   * @private
   */
  #fadeIn() {
    if (this.#fadeSeconds <= 0 || !this.#gainNode) {
      return;
    }
    try {
      this.#setGain(0);
      this.#gainNode.gain.setTargetAtTime(
        1.0, audioMgr.context.currentTime, this.#fadeSeconds / 3);
    } catch (error) {
      console.error(`Unable to fade in music ${this.#title}: ${error}`);
    }
  }

  /**
   * Fade out music.
   * @private
   */
  #fadeOut() {
    if (this.#fadeSeconds <= 0 || !this.#gainNode) {
      return;
    }
    try {
      this.#gainNode.gain.setTargetAtTime(
        0.0, audioMgr.context.currentTime, this.#fadeSeconds / 3);
    } catch (error) {
      console.error(`Unable to fade out music ${this.#title}: ${error}`);
    }
  }


  /**
   * Play music. If audioBuffer not set, the command is cached.
   * @borrows module:hcje/audio~AudioPlayer#start
   */
  start() {
    if (!this.#audioPlayer?.isReady()) {
      console.debug(`Music ${this.#title} not ready so cache start.`);
      this.#cachedCommand = MusicPlayer.MusicCommand.START;
      return;
    }
    console.debug(`Start music ${this.#title}.`);
    this.#cachedCommand = MusicPlayer.MusicCommand.NONE;
    try {
      if (this.#fadeSeconds) {
        this.#fadeIn();
      }
      this.#audioPlayer.start();
    } catch (error) {
      console.error(`Unable to start music ${this.#title}: ${error}`);
    }
  }
  
  /**
   * Stop music. If audioBuffer not set, the command is cached. 
   * @borrows module:hcje/audio~AudioPlayer#start
   */
  stop() {
    if (!this.#audioPlayer.isReady()) {
      console.debug(`Audio buffer for music ${this.#title} not ready so STOP command cached.`);
      this.#cachedCommand = MusicPlayer.MusicCommand.STOP;
      return;
    }
    console.debug(`Stop music ${this.#title}.`);
    this.#fadeOut();
    setTimeout(() => {
      this.#audioPlayer.stop(this.#fadeSeconds);
    }, this.#fadeSeconds * 1000);
  }

  /**
   * Action cached command. Clears the cached command.
   */
  actionCachedCommand() {
    if (!this.#audioPlayer.isReady()) {
      console.debug('Attempt to action cached command before track is ready ignored.');
    } else if (this.#cachedCommand === MusicPlayer.MusicCommand.START) {
      this.start();
    }
    this.#cachedCommand = MusicPlayer.MusicCommand.NONE;
  }

  /**
   * @borrows module:hcje/audio~AudioPlayer#isPlaying
   */
  isPlaying() {
    return this.#audioPlayer?.isPlaying();
  }

  /**
   * @borrows module:hcje/audio~AudioPlayer#isReady
   */
  isReady() {
    return this.#audioPlayer?.isReady();
  }

  /**
   * @borrows module:hcje/audio~AudioPlayer#connect
   */
  connect(destination) {
    this.#gainNode.connect(destination);
  }
}



/**
 * Standard instrument definitions.
 * @enum {module:hcje/audio~SynthInstrument}
 */ 
export const Instrument = {
  CYMBAL: {
    adsr: [0.01, 0.01, 0.3, 0.3],
    allowMerge: false,
    maxGain: 0.2,
    sustainTime: 0.05,
    sweepFactor: 2,
    waveform: 'noise',
  },
  DRUM: {
    adsr: [0.01, 0.05, 0.1, 0.2],
    allowMerge: false,
    maxGain: 1,
    sustainTime: 0.1,
    sweepFactor: 0.8,
    waveform: 'sine',
  },
  PIANO: {
    adsr: [0.01, 0.25, 0.1, 0.1],
    allowMerge: false,
    maxGain: 1,
    sustainTime: 0.1,
    sweepFactor: 1,
    waveform: 'sine',
  },
  SNARE: {
    adsr: [0.001, 0.002, 0.1, 0.01],
    allowMerge: false,
    maxGain: 1,
    sustainTime: 0.05,
    sweepFactor: 1,
    waveform: 'noise',
  }
};

/** Internal global manager used for all internal sound players. @type{module:hcje/audio~AudioManager}
 * @private
 */
let audioMgr = new AudioManager();

/**
 * Get the audio manager. The first call intialises the module's internal audio manager.
 * @returns {module:hcje/audio~AudioManager}
 */
export function getAudioManager() {
  if (!audioMgr) {
    audioMgr = new AudioManager();
  }
  return audioMgr;
}


