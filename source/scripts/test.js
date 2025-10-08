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
 * @module
 * @description
 */

import * as hcje from '../../hcje/scripts/hcje.js';


const dialog = hcje.domTools.createDialog({
  title: 'Just testing',
  className: 'test-class',
  markdown:"This is a test of **MARKDOWN** parsing.",
  buttonDefns: [ {id:'ok', label: 'OK', imageUrl: './assets/images/buttons_ok.png'}]
})
  .then((id) => alert(`${id} clicked`))
  .then(() => {
    const gameArea = hcje.domTools.createGameArea({
      width: 640,
      height: 360,
      margin: 10,
    });

    const imageGenerator = hcje.images.createImageGenerator();
    
    const images = [];
    for (let index = 0; index < 4; index++) {
      const img = document.createElement('div');
      img.style.position = 'absolute'
      img.style.width = `640px`;
      img.style.height = `360px`;
      img.style.backgroundPosition = `${index * 10}px`;
      img.style.backgroundRepeat = 'repeat';
      images.push(img);
      gameArea.appendChild(img);
    }
    imageGenerator.createObjectUrl({
      width: 640,
      height: 360,
      chrs: '^#.',
      rows: 4,
      jitter: 0.5,
      variation: 1.2,
      backgroundColor: 'transparent',
      colors: ['yellow', 'green']
    }).then((url) => {
      for (const img of images) {
        img.style.backgroundImage = `url(${url})`;
      }
    });
    

  });



