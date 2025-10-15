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
import * as hcje from './hcje/hcje.js';

const MARKDOWN_DATA  = 
`# Heading 1
## Heading 2
### Heading 3

A simple paragraph with *emphasised* and **bold** text.

A paragraph with a [link](https://henspace.com "The link title") added.

A paragraph with a [link](https://henspace.com?redirect=yes "The link title") rejected because of query.

A paragraph showing escaping of <b>html tags</b> and other special characters: '"&

Some character entities &copy; &reg; and &illegal; ones &#169;. 

![An info image](./assets/hcje/buttons_info.png "Info image title")

+ Unordered list item 1
+ Unordered list item 2
+ Unordered list item 3

1 Ordered list item 1
1 Ordered list item 2
1 Ordered list item 3
 
`;

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
    url: './assets/hcje/buttons_up.png',
    urlOn: './assets/hcje/buttons_down.png',
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
 * @param {string} key - music key
 * @param {string} url - url to music
 */
function addMusicTest(key, url) {
  return hcje.audio.addMusic({
    url: url,
    key: key,
    fadeSeconds: 1
  }).then((music) => {
    new hcje.domTools.Button({
      parentElement: document.getElementById('test-button-container'),
      label: `PLAY ${key}`,
      labelOn: `STOP ${key}`,
      onClick: (ev, on) => {
        if (on) {
          music.start();
        } else {
          music.stop();
        }
      }
    })
  });
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
        url: './assets/hcje/buttons_ok.png'
      },
      {
        id:'CANCEL_BUTTON', 
        label:'cancel',
        url: './assets/hcje/buttons_cancel.png'
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

  const checkbox = new hcje.domTools.CheckboxControl({
    label: "My checkbox",
    intialValue: true,
    onChange: (state) => displayResult(`Checkbox now ${state}`)
  });


  return hcje.domTools.createDialog({
    title: 'Controls',
    text: 'Test of controls on form',
    buttonDefns: [{id:'OK', label: 'OK'}],
    children: [
      button,
      toggleButton,
      spinner,
      checkbox,
    ]
  })
  .then(() => {
    displayResult(`Spinner value ${spinner.getValue()}`);
    displayResult(`Checkbox value ${checkbox.getValue()}`);
    displayResult(`Toggle button value ${toggleButton.getValue()}`);
  });
}



/* Create the UI tests */
testMenuBar();
addToggleButtonTest();
addTest({label:'Dialog txt', executor: testDialog, data: {text: '# Text\nSimple text *not emphasised*.'}});
addTest({label:'Dialog md', executor: testDialog, data: {markdown: MARKDOWN_DATA}});
addTest({label:'Controls', executor: testControls});
await addMusicTest('1', './.test-assets/BeepBox-Song.mp3');
await addMusicTest('2', './.test-assets/BeepBox-Song2.mp3');
addTest({label: 'Auto stop/start', executor: ()=> hcje.audio.autoStopStart()});
addTest({
  label: 'SFX', 
  setup: ()=>hcje.audio.addSoundEffect({url: './.test-assets/jump.mp3', key: 'JUMP'}),
  executor: ()=> hcje.audio.playSoundEffect('JUMP')
})


