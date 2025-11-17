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
 * @module hcje/test
 * @description
 * Test routines for the engine.
 */
import * as hcje from '../hcje/scripts/hcje.js';

const MARKDOWN_DATA  = 
`# Heading 1
## Heading 2
### Heading 3

A simple paragraph with *emphasised* and **bold** text.

A paragraph with a [link](https://henspace.com "The link title") added.

A paragraph with a [link](https://henspace.com?redirect=yes "The link title") rejected because of query.

A paragraph showing escaping of <b>html tags</b> and other special characters: '"&

Some character entities &copy; &reg; &#169; and &illegal; . 

![An info image(./hcje/assets/buttons_info.png "Info image title")

+ Unordered list item 1
+ Unordered list item 2
+ Unordered list item 3

1 Ordered list item 1
1 Ordered list item 2
1 Ordered list item 3

\`code here\` more code \`here\` and escaped &#96;here&#x60;.
`;

const AUDIO = hcje.audio.getAudioManager();

/**
 * Class for creating melodies.
 */
class MelodyMaker {
  static #phraseLetters = ['A', 'B', 'C'];
  static #notesWithAccidentals = ['-A', '-A#', '-B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', '+C', '+C#', '+D', '+D#'];
  static #notesNoAccidentals  =  ['-A', '-B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', '+C', '+D'];
  static #structures = [
    [0, 0, 1, 0],
    [0, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 1, 0, 1],
    [0, 1, 0, 2],
  ];

  /** @type {boolean} */
  accidentals;
  /** @type {Array<boolean>} */
  #arpeggios;
  /** @type {number} */
  #arpeggioLength;
  /** @type {boolean} */
  minorChords;
  /** @type {number} */
  phraseLength;
  /** Phrases @type {Array<Array<string>>} */
  #phrases;
  /** Structure index @type{number} */
  #structureIndex;

  /**
   * Construct melody maker.
   */
  constructor() {
    this.accidentals = false;
    this.#arpeggios = [false, false, false];
    this.#arpeggioLength = 2;
    this.phraseLength = 8;
    this.minorChords = false;
    this.#structureIndex = 0;
    this.#phrases = [[],[],[]];
    this.generateMelody();
  }


  /**
   * Get a note close to the last. If accidentals allowed, it must be within 2 notes, otherwise it must be within 1.
   * @param {string} centerNote - note to be close to.
   * @returns {string}
   */ 
  #getCloseNote(centerNote) {
    const notes = this.accidentals ? MelodyMaker.#notesWithAccidentals : MelodyMaker.#notesNoAccidentals;
    const index = notes.indexOf(centerNote);
    const distance = this.accidentals ? 2 : 1;
    const nextIndex = 
      hcje.utils.clamp(hcje.utils.getRandomIntInclusive(index - distance, index + distance), 0, notes.length - 1);
    return notes[nextIndex];
  };

  /**
   * Generate a random melody of both phrase A and phrase B.
   */
  generateMelody() {
    this.#phrases[1] = [];
    this.generatePhraseA();
    this.generatePhraseB();
    this.generatePhraseC();
  }

  /** 
   * Generate phrase A. This is constrained to start with the same note as the end of phrase B if defined.
   */
  generatePhraseA() {
    let startNote;
    if (this.#phrases[1].length) {
      startNote = this.#phrases[1][this.#phrases[1].length - 1];
    }
    this.#phrases[0] = this.randomPhrase(startNote, startNote);
  }

  /** 
   * Generate phrase B. This is constrained to start with a note close to the start of phrase A if defined, and
   * likewise end with the start of phrase A. If phrase A does not exist, it is created first.
   */
  generatePhraseB() {
    if (!this.#phrases[0].length) {
      this.generatePhraseA();
    }
    const startNotePhraseA = this.#phrases[0][0];
    let startNote = this.#getCloseNote(startNotePhraseA);
    this.#phrases[1] = this.randomPhrase(startNote, startNotePhraseA);
  }
  
  /** 
   * Generate phrase C. This is constructed in the same way as phrase A if defined, and
   * likewise end with the start of phrase A. If phrase A or phrase B do not exist, they are created first.
   */
  generatePhraseC() {
    if (!this.#phrases[0].length) {
      this.generatePhraseA();
    }
    if (!this.#phrases[1].length) {
      this.generatePhraseB();
    }
    const startNotePhraseA = this.#phrases[0][0];
    let startNote = this.#getCloseNote(startNotePhraseA);
    this.#phrases[2] = this.randomPhrase(startNote, startNotePhraseA);
  }

  /**
   * Create a random phrase.
   * @param {string} [constrainStart] - if undefined, a random note is used.
   * @param {string} [constrainEnd] - if undefined, this is set to the start note.
   * @returns {Array<string>}
   */
  randomPhrase(constrainStart, constrainEnd) {
    const notes = this.accidentals ? MelodyMaker.#notesWithAccidentals : MelodyMaker.#notesNoAccidentals;
    const distance = this.accidentals ? 2 : 1;
    const startNote = constrainStart ?? this.#getCloseNote('F');
    const endNote = constrainEnd ?? startNote;

    let currentNote;
    currentNote = startNote;
    const phrase = [];
    phrase.push(currentNote);
    for (let n = 0; n < this.phraseLength - 2; n++) {
      currentNote = this.#getCloseNote(currentNote);
      phrase.push(currentNote);
    }
    currentNote = endNote;
    phrase.push(currentNote);
    return phrase; 
  }

  /**
   * Get the arpeggio for the phrase.
   * @param {number} index of phrase: 0 = A, 1 = B , 2 = C.
   * @returns {boolean}
   */
  isArpeggio(index) {
    return this.#arpeggios[index];
  }

  /**
   * Set the arpeggio state for the phrase,
   * @param {number} index of phrase: 0 = A, 1 = B , 2 = C.
   * @param {boolean} state - true to set arpeggio on.
   */ 
  setArpeggio(index, state) {
    this.#arpeggios[index] = state;
  }

  /**
   * Get the length of argpeggio in quavers.
   * @returns {number}
   */
  get arpeggioLength() {
    return this.#arpeggioLength;
  }

  /**
   * Set the arpeggio length in quavers. This is clamped to between 2 and 4 inclusive.
   * @param {number} length - length of quaver.
   */
  set arpeggioLength(length) {
    this.#arpeggioLength = hcje.utils.clamp(Math.floor(length), 2, 4);
  }


  /** 
   * Get the current structure index.
   * @returns {number}
   */
  get structureIndex() {
    return this.#structureIndex;
  }

  /**
   * Set the structure index/
   * @param {number} index - the index. It is clamped to a valid number.
   */
  set structureIndex(index) {
    this.#structureIndex = hcje.utils.clamp(Math.floor(index), 0, MelodyMaker.#structures.length - 1);
  }

  /**
   * Get the number of structures.
   * @returns {number}
   */
  getStructuresLength() {
    return MelodyMaker.#structures.length;
  }

  /**
   * Get structure pattern fo index.
   * @param {number} index
   * @returns {string}
   */
  getPatternForIndex(index) {
    return MelodyMaker.#structures[index].map((index) => MelodyMaker.#phraseLetters[index]).join('');
  }

  /**
   * Get the full set of notes. This does not regenerate the phrases.
   * @returns {string}
   */
  getNotes() {
    const structure = MelodyMaker.#structures[this.#structureIndex];
    let melody = '';
    let noteFraction = '';
    let arpeggioType = '';
    const arpeggioInUse = !this.#arpeggios.every((enabled) => !enabled);
    if (arpeggioInUse) {
      if (this.#arpeggioLength === 2) {
        noteFraction = ''; // default crotchet.
      } else if (this.#arpeggioLength === 3) {
        noteFraction = '.'; // dotted default crotchet.
      } else {
        noteFraction = '2'; // minim.
      }
    }
    for (const index of structure) {
      const phrase = this.#phrases[index];
      let arpeggioType = '';
      if (this.#arpeggios[index]) {
        arpeggioType = `${this.minorChords ? '$' : '@'}`;
      }
      for (const note of phrase) {
        melody += `${note}${noteFraction}${arpeggioType}`;
      }
      melody += '|';
    }
    return melody;
  }
}
/**
 * Add toggle buttons for test.
 */
function addToggleButtonTest() {
  new hcje.domTools.Button({
    parentElement: document.getElementById('test-button-container'),
    label: 'OFF',
    labelOn: 'ON',
    onClick: (ev, on) => displayResult(`Text button is ${on ? 'on' : 'off'}`)
  });
  new hcje.domTools.Button({
    parentElement: document.getElementById('test-button-container'),
    url: './hcje/assets/buttons_up.png',
    urlOn: './hcje/assets/buttons_down.png',
    label: 'OFF',
    labelOn: 'ON',
    onClick: (ev, on) => displayResult(`Icon button is ${on ? 'on' : 'off'}`)
  });
}

/**
 * @typedef {Object} TestDefinition
 * @property {string} label - label for the test.
 * @property {function()} [setup] - setup function
 * @property {function(data):Promise} executor - function that executes the test. The type of the parameter data depends
 * on the executor function
 * @property {*} [data] - data provided to the executor
 */
function addTest(definition) {
  definition.setup?.();
  new hcje.domTools.Button({
    parentElement: document.getElementById('test-button-container'),
    label: definition.label,
    onClick: () => definition.executor(definition.data)
  })
}

/**
 * Display a test result to the results division.
 * @param {string} message
 */
function displayResult(message) {
  const results = document.getElementById('test-results');
  results.value = `${results.value}\n${new Date().toLocaleTimeString()}: ${message}`;
  results.scrollTop = results.scrollHeight;
}

/**
 * Add menu bar test.
 */
function testMenuBar() {
  let menubar;
  menubar = new hcje.domTools.MenuBar({
    opener: new hcje.domTools.Button({label:'Open'}),
    closer: new hcje.domTools.Button({label:'Close'}),
    children: [
      new hcje.domTools.Button({label: 'Option 1', onClick: () => displayResult('Option 1 clicked')}),
      new hcje.domTools.Button({label: 'Option 2', onClick: () => displayResult('Option 2 clicked')}),
      new hcje.domTools.Button({label: 'Remove menu', onClick: () => {
        displayResult('Remove menu clicked');
        menubar.remove();
      }
      }),
    ],
    onOpen: () => displayResult('Menu opened'),
    onClose: () => displayResult('Menu closed')
  });
}

/**
 * Add music button test.
 * @param {string} id - id added to the button label for identification.
 * @param {module:hcje/audio:AudioDefinition} definition - audio definition
 */
function addMusicTest(id, definition) {
  new hcje.domTools.Button({
    parentElement: document.getElementById('test-button-container'),
    label: `PLAY ${id}`,
    labelOn: `STOP ${id}`,
    onClick: (ev, on) => {
      if (on) {
        AUDIO.setMusic(definition);
      } else {
        AUDIO.stopMusic();
      }
    }
  })
}

/**
 * Test dialog box
 * @param {Object} data
 * @param {string} data.text - text to show in dialog
 * @param {string} data.markdown - markdown to show in dialog.
 * @returns {Promise}
 */ 
function testDialog(data = {}) {
  return hcje.domTools.createDialog({
    title: 'Test dialog',
    text: data.text,
    markdown: data.markdown,
    buttonDefns: [
      {
        id:'OK_BUTTON', 
        label:'OK',
        url: './hcje/assets/buttons_ok.png'
      },
      {
        id:'CANCEL_BUTTON', 
        label:'cancel',
        url: './hcje/assets/buttons_cancel.png'
      },
    ]
  })
    .then((id) => displayResult(`Dialog returned ${id}`));
}

/**
 * Test controls.
 */
function testControls() {
  const button = new hcje.domTools.ButtonControl({
      label: 'BtnCtrl',
      onClick: () => displayResult('BtnCtrl clicked'),
    });

  const toggleButton = new hcje.domTools.ButtonControl({
      label: 'Off',
      labelOn: 'On',
      onClick: (e, on) => displayResult(`TglCtrl clicked. State on = ${on}.`),
    });

  const spinner = new hcje.domTools.SpinnerControl({
    label: 'Spinner',
    initialValue: 1,
    downLabel: 'DOWN',
    upLabel: 'UP',

    minValue: -2,
    maxValue: 2,
    step: 1,
    format: (index) => `Index ${index}`,
    onChange: (value) => displayResult(`Spinner new value ${value}`)
  });

  const checkboxCross = new hcje.domTools.CheckboxControl({
    label: "My checkbox with cross",
    intialValue: true,
    onChange: (state) => displayResult(`Checkbox now ${state}`)
  });
  const checkboxTick = new hcje.domTools.CheckboxControl({
    label: "My checkbox with tick",
    intialValue: true,
    onChange: (state) => displayResult(`Checkbox now ${state}`),
    tick: true
  });


  return hcje.domTools.createDialog({
    title: 'Controls',
    text: 'Test of controls on form',
    buttonDefns: [{id:'OK', label: 'OK'}],
    children: [
      hcje.domTools.createDivider({label: 'Left label', alignment: 'left'}),
      button,
      toggleButton,
      hcje.domTools.createDivider({label: 'Centre label', alignment: 'center'}),
      spinner,
      checkboxCross,
      hcje.domTools.createDivider({label: 'right label', alignment: 'right'}),
      checkboxTick
    ]
  })
  .then(() => {
    displayResult(`Spinner value ${spinner.getValue()}`);
    displayResult(`Checkbox cross value ${checkboxCross.getValue()}`);
    displayResult(`Checkbox tick value ${checkboxTick.getValue()}`);
    displayResult(`Toggle button value ${toggleButton.getValue()}`);
  });
}



/**
 * Instrument to predefined
 * @param {module:hcje/audio~SynthInstrument} instrument
 * @returns {string} Prefined instrument. Undefined if not a predefined instrument.
 */
function instrumentToPredefined(instrument) {
  const asJson = JSON.stringify(instrument);
  for (const [key, value] of Object.entries(hcje.audio.Instrument)) {
    if (JSON.stringify(value) === asJson) {
      return key;
    }
  }
}

/**
 * Convert synth definition to code.
 * @param {module:hcje/audio~SynthDefinition} synthDef
 * @returns {{plain:string,markdown:string}} markdown for code. Both plain text and markdown returned.
 */
function synthToCode(synthDef) {
  let lines = [];
  lines.push(`const synthDefinition = {`);
  lines.push(`  bpm: ${synthDef.bpm},`);
  lines.push(`  fadeSeconds: ${synthDef.fadeSeconds},`);
  lines.push(`  loop: ${synthDef.loop},`);
  lines.push(`  tracks:[`);
  for (const track of synthDef.tracks) {
    if (track.notes) {
      const predefined = instrumentToPredefined(track.instrument);
      lines.push(`    {`);
      if (predefined) {
        lines.push(`      instrument: hcje.audio.Instrument.${predefined},`);
      } else {
        lines.push(`      instrument: {`);
        lines.push(`        adsr: [${track.instrument.adsr.join(', ')}],`);
        lines.push(`        allowMerge: ${track.instrument.allowMerge},`);
        lines.push(`        maxGain: ${track.instrument.maxGain},`);
        lines.push(`        sustainTime: ${track.instrument.sustainTime},`);
        lines.push(`        sweepFactor: ${track.instrument.sweepFactor},`);
        lines.push(`        waveform: '${track.instrument.waveform}',`);
        lines.push(`      },`);
      }
      lines.push(`      notes: '${track.notes}',`);
      lines.push(`      octave: ${track.octave}`);
      lines.push(`    },`);
    }
  }
  lines.push(`  ]`);
  lines.push(`};`);

  return {plain: lines.join('\n'), markdown: lines.join('<br>').replace(/ /g, '&nbsp;')}; 
}

/**
 * Edit a track.
 * @param {number} trackIndex = track index.
 * @param {module:hcje/audio~SynthTrack} track
 * @returns {module:hcje/audio~SynthTrack}
 */
function editTrack(trackIndex, track) {
  const WAVEFORMS = ['noise', 'sawtooth', 'sine', 'square', 'triangle'];

  const waveform = new hcje.domTools.SpinnerControl({
    label: 'Waveform',
    initialValue: WAVEFORMS.indexOf(track.instrument.waveform),
    format: (index) => WAVEFORMS[index],
    maxValue: WAVEFORMS.length - 1,
    onChange: (index) => track.instrument.waveform = WAVEFORMS[index]
  });
  
  const octave = new hcje.domTools.SpinnerControl({
    label: 'Octave',
    initialValue: track.octave,
    maxValue: 7,
    onChange: (octave) => track.octave = octave
  });

  const attack = new hcje.domTools.InputControl({
    label: 'Attack ms',
    initialValue: track.instrument.adsr[0] * 1000,
    placeholder: 'attack value',
    constrain: '+INT',
    onChange: (value) => track.instrument.adsr[0] = Number.parseInt(value) / 1000
  });
  
  const decay = new hcje.domTools.InputControl({
    label: 'Decay ms',
    initialValue: track.instrument.adsr[1] * 1000,
    placeholder: 'decay value',
    constrain: '+INT',
    onChange: (value) => track.instrument.adsr[1] = Number.parseInt(value) / 1000
  });

  const sustain = new hcje.domTools.InputControl({
    label: 'Sustain %',
    initialValue: track.instrument.adsr[2] * 100,
    placeholder: 'Sustain level',
    constrain: '+INT',
    onChange: (value) => track.instrument.adsr[2] = Number.parseInt(value) / 100
  });

  const release = new hcje.domTools.InputControl({
    label: 'Release ms',
    initialValue: track.instrument.adsr[3] * 1000,
    placeholder: 'Release value',
    constrain: '+INT',
    onChange: (value) => track.instrument.adsr[3] = Number.parseInt(value) / 1000
  });
  
  const sustainTime = new hcje.domTools.InputControl({
    label: 'Sustain seconds',
    initialValue: track.instrument.sustainTime,
    placeholder: 'Sustain time',
    constrain: '+FLOAT',
    onChange: (value) => track.instrument.sustainTime = Number.parseFloat(value)
  });
  
  const maxGain = new hcje.domTools.InputControl({
    label: 'Max gain %',
    initialValue: track.instrument.maxGain * 100,
    placeholder: 'Max gain',
    constrain: '+INT',
    onChange: (value) => track.instrument.maxGain = Number.parseInt(value) / 100
  });
  
  const sweepFactor = new hcje.domTools.InputControl({
    label: 'Sweep factor',
    initialValue: track.instrument.sweepFactor,
    placeholder: 'Sweep factor',
    constrain: '+FLOAT',
    onChange: (value) => track.instrument.sweepFactor = Number.parseFloat(value)
  });

  const allowMerge = new hcje.domTools.CheckboxControl({
    label: 'Allow note merging',
    initialValue: track.instrument.allowMerge,
    onChange: (checked) => track.instrument.allowMerge = checked,
    tick: true,
  });

  const notes = new hcje.domTools.InputControl({
    label: 'Notes',
    initialValue: track.notes,
    placeholder: 'notes',
    onChange: (value) => track.notes = value
  });


  return hcje.domTools.createDialog({
    title: `Edit track ${trackIndex}`,
    buttonDefns: [{id:'OK', label: 'OK'}],
    children: [
      waveform, octave, attack, decay, sustain, release, sustainTime, maxGain, sweepFactor, allowMerge, notes
    ]
  });

}

/**
 * Add a synthesiser test.
 */
function addSynthesiserTest() {
  const arpeggioCombos = ['---', 'A--', 'AB-', 'A-C', 'ABC', '-B-', '-BC', '--C'];
  const melodyMaker = new MelodyMaker();
  const waveforms = ['sine', 'triangle', 'sawtooth', 'noise'];
  const synthDefinition = {
    bpm: 120,
    loop: true,
    fadeSeconds: 0.1, 
    tracks: [
      {
        instrument: structuredClone(hcje.audio.Instrument.PIANO),
        octave: 4,
        notes: 'CDEFGAB+C'
      },
      {
        instrument: structuredClone(hcje.audio.Instrument.CYMBAL), 
        octave: 7,
        notes: 'G'
      },
      {
        instrument: structuredClone(hcje.audio.Instrument.SNARE),
        octave: 6,
        notes: '~G'
      },
      {
        instrument: structuredClone(hcje.audio.Instrument.DRUM),
        octave: 2,
        notes: 'C~C~'
      },
    ]
  }
  
  /**
   * Update the background music to reflect changes to the melody maker.
   */
  const updateMusic = () => {
    synthDefinition.tracks[0].notes = melodyMaker.getNotes();
    AUDIO.setMusic(synthDefinition);
  }

  const children = [];

  const bpm = new hcje.domTools.SpinnerControl({
    label: 'BPM',
    initialValue: synthDefinition.bpm,
    minValue: 30,
    maxValue: 240,
    step: 10,
    onChange: (bpm) => {
      synthDefinition.bpm = bpm;
      AUDIO.setMusic(synthDefinition);
    }
  });

  children.push(bpm);

  for (let n = 0; n < 4; n++) {
    const editButton = new hcje.domTools.Button({
      label: `Edit track ${n}`,
      onClick: () =>{
        AUDIO.stopMusic();
        editTrack(n, synthDefinition.tracks[n])
          .then(() => AUDIO.setMusic(synthDefinition));
      }
    });
    children.push(editButton);
  }

  children.push(hcje.domTools.createDivider({label: 'Melody generator', alignment:'center'}));

  children.push(new hcje.domTools.SpinnerControl({
    label: 'Arpeggios on phrases',
    initialValue: 0,
    minValue: 0, 
    maxValue: arpeggioCombos.length - 1, 
    format: (index) => arpeggioCombos[index],
    onChange: (index) => {
      const combo = arpeggioCombos[index];
      melodyMaker.setArpeggio(0, combo.indexOf('A') >= 0);
      melodyMaker.setArpeggio(1, combo.indexOf('B') >= 0);
      melodyMaker.setArpeggio(2, combo.indexOf('C') >= 0);
      updateMusic();
    }
  }));

  children.push(new hcje.domTools.SpinnerControl({
    label: 'Arpeggio length',
    initialValue: melodyMaker.arpeggioLength,
    minValue: 2, 
    maxValue: 4, 
    format: (value) => `${value} quavers`,
    onChange: (value) => {
      melodyMaker.arpeggioLength = value;
      updateMusic();
    }
  }));

  children.push(new hcje.domTools.CheckboxControl({
    label: 'Accidentals (generates new melody)',
    initialValue: melodyMaker.accidentals,
    tick: true,
    onChange: (checked) => {
      melodyMaker.accidentals = checked;
      melodyMaker.generateMelody();
      updateMusic();
    }
  }));

  children.push(new hcje.domTools.CheckboxControl({
    label: 'Minor chords for arpeggio',
    initialValue: melodyMaker.minorChords,
    tick: true,
    onChange: (checked) => {
      melodyMaker.minorChords = checked;
      updateMusic();
    }
  }));

  children.push(new hcje.domTools.SpinnerControl({
    label: 'Phrase length (generates new melody)',
    initialValue: melodyMaker.phraseLength,
    minValue: 4,
    maxValue: 16,
    onChange: (value) => {
      melodyMaker.phraseLength = value;
      melodyMaker.generateMelody();
      updateMusic();
    }
  }));

  children.push(new hcje.domTools.SpinnerControl({
    label: 'Structure',
    initialValue: melodyMaker.structureIndex,
    minValue: 0,
    maxValue: melodyMaker.getStructuresLength() - 1,
    format: (index) => melodyMaker.getPatternForIndex(index),
    onChange: (value) => {
      melodyMaker.structureIndex = value;
      updateMusic();
    }
  }));

  children.push(new hcje.domTools.Button({
    label: 'Melody',
    onClick: () => {
      melodyMaker.generateMelody();
      updateMusic();
    }
  }));
  
  children.push(new hcje.domTools.Button({
    label: 'Phrase A',
    onClick: () => {
      melodyMaker.generatePhraseA();
      updateMusic();
    }
  }));
  
  children.push(new hcje.domTools.Button({
    label: 'Phrase B',
    onClick: () => {
      melodyMaker.generatePhraseB();
      updateMusic();
    }
  }));
  
  children.push(new hcje.domTools.Button({
    label: 'Phrase C',
    onClick: () => {
      melodyMaker.generatePhraseC();
      updateMusic();
    }
  }));
  
  updateMusic();
  return hcje.domTools.createDialog({
    title: 'Synthesiser',
    buttonDefns: [{id:'OK', label: 'OK'}],
    children
  })
    .then(() => {
      const code = synthToCode(synthDefinition);
      hcje.domTools.createDialog({
        title: 'Synthesiser code',
        markdown: code.markdown,
        children: [new hcje.domTools.Button({
          label: 'Copy code',
          onClick: () => {
            navigator.clipboard.writeText(code.plain);
            alert('Code copied to clipboard');
          }
        })],
        buttonDefns: [{id:'OK', label: 'OK'}]
      })
    })
    .then(() => AUDIO.stopMusic());
}

/**
 * Add sprite tests
 */
function addSpriteTest() {
  const gameArea = new hcje.domTools.GameArea({
    width: 640,
    height: 400,
  });

  const animator = new hcje.sprites.Animator();

  const close = new hcje.domTools.Button({
    label: 'Close',
    onClick: () => {
      animator.clear();
      gameArea.remove();
    }
  });

  hcje.sprites.loadSpriteSheet('hcje-ui-test/assets/sprites.json', 'hcje-ui-test/assets/sprites.png',
    new hcje.domTools.TimeLimitedBusyIndicator({
      label:'loading',
      timeoutS: 15,
      timeoutMessage: 'Failed to load in time.'
    }))
    .then((textureManager) => {
      textureManager.spriteFactory = new hcje.sprites.DomImageSpriteFactory(gameArea);
      const spaceman = textureManager.createSprite('sprites_spaceman.png', [
        {name:'idle', interval:1000},
        {name:'walk', interval:(dynamics) => hcje.sprites.Sprite.deriveWalk(dynamics, 2)}
      ]);
      spaceman.dynamics = new hcje.sprites.Dynamics(
        new hcje.sprites.Bouncer(spaceman.dimensions, {
          x:0, y: 0,
          width: 640, height: 400
        })
      );
      spaceman.state = 'walk';
      spaceman.dynamics.vx = 50;
      spaceman.dynamics.vy = 60;
      spaceman.autoFlipX = true;
      animator.addTarget(spaceman);
      animator.active = true;
    });
  const textSprite = hcje.sprites.createTextSprite(gameArea, 'Test of **markdown** text', {
    dimensions: {width: 200, height: 0},
    markdown:true,
  });
  textSprite.dynamics = new hcje.sprites.Dynamics(
    new hcje.sprites.Bouncer(textSprite.dimensions, gameArea.designBounds)
  );
  textSprite.dynamics.vx = 50;
  textSprite.dynamics.vy = 50;
  animator.addTarget(textSprite);
  gameArea.appendChild(close);
  
}

/* Create the UI tests */
testMenuBar();
addToggleButtonTest();
addTest({label:'Dialog txt', executor: testDialog, data: {text: '# Text\nSimple text *not emphasised*.'}});
addTest({label:'Dialog md', executor: testDialog, data: {markdown: MARKDOWN_DATA}});
addTest({label:'Controls', executor: testControls});
await addMusicTest('1', {title: 'Song 1', url: './hcje-ui-test/assets/BeepBox-Song.mp3', fadeSeconds: 1});
await addMusicTest('2', {title: 'Song 2', url: './hcje-ui-test/assets/BeepBox-Song2.mp3', fadeSeconds: 1});
await addMusicTest('Synth1', {
  title: 'Synth1',
  bpm: 120,
  loop: true,
  tracks: [
    {
      instrument: {
        waveform: "sine",
        adsr: [0.01, .24, 0.28, 0.09],
        sustainTime: 0.06,
        allowMerge: true,
        maxGain: 1,
        sweepFactor: 1
      },
      octave: 4,
      notes: "C8~D8~E8~~||GEAC||ABDE"
    },
    {
      instrument: {
        waveform: "sine",
        adsr: [0.01, 0.01, 1, 0.2],
        sustainTime: 0.06,
        allowMerge: false,
        maxGain: 1,
        sweepFactor: 0, 
      },
      octave: 2,
      notes: "CCCC"
    },
  ],
});

addTest({
  label: 'SFX', 
  setup: ()=>AUDIO.addAudioSfx({url: './hcje-ui-test/assets/jump.mp3', title: 'JUMP'}),
  executor: ()=> AUDIO.playAudioSfx('JUMP')
});
addTest({
  label: 'SFX Synth', 
  setup: ()=>AUDIO.addAudioSfx({
    title: 'JUMP2',
    bpm: 60,
    tracks: [{
      instrument:{
        waveform: 'sine',
        adsr: [0.01, 0.24, 0.28, 1],
        sustainTime: 0.06,
        allowMerge: true,
        maxGain: 1,
        sweepFactor: 10
      },
      octave: 4,
      notes: 'C8',
    }]
  }),
  executor: ()=> AUDIO.playAudioSfx('JUMP2')
});

addTest({
  label: 'Synth',
  executor: () => addSynthesiserTest()
});

addTest({label: 'Sprites', executor: () => addSpriteTest()});


