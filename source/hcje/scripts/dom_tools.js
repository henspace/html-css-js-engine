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
 * @module hcje/domTools
 * @description
 * Module containing buttons, dialogs and other features
 */

import * as utils from './utils.js';
import * as device from './device.js';

/** Markdown replacements. @type {Array<{re: RegExp, rep: string}> */ 
const MARKDOWN_REPS = [
  /* special character replacements */ 
  {re: /\r/g, rep: ''},
  {re:/(?:&(?!(?:nbsp|copy);))/gi , rep: '&amp;'},
  {re: /</g, rep: '&lt;'},
  {re: />/g, rep: '&gt;'},
  {re: /"/g, rep: '&quot;'},
  {re: /'/g, rep: '&apos;'},
  
  /* block divisions */
  {re: /^[\+\-*] (.*)$/gm, rep: '<li>$1</li>'},
  {re: /<\/li>\n<li>/g, rep: '</li><li>'},
  {re: /\n((?:<li>.*?<\/li>)+)\n/gs, rep: '\n<ul>$1</ul>\n'},

  {re: /^# (.*?)#?$/gm, rep: '<h1>$1</h1>'},
  {re: /^## (.*?)(?:##)?$/gm, rep: '<h2>$1</h2>'},
  {re: /^### (.*?)(?:###)?$/gm, rep: '<h3>$1</h3>'},
  {re: /^#### (.*?)(?:####)?$/gm, rep: '<h4>$1</h4>'},
  
  /* remove interblock divisions */
  {re: /<\/(h\d|ul)>\n*<(h\d|ul)>/g, rep: '<\/$1><$2>'},

  /* add paragraph blocks */
  {re: /([^>])\n{2,}([^<])/g, rep: '$1</p><p>$2'},
  {re: />\n+([^<])/g, rep: '><p>$1'},
  {re: /([^>])\n+</g, rep: '$1</p><'},
  {re: /^\s*([^<])/, rep: '<p>$1'},
  {re: /([^>])\s*$/g, rep: '$1</p>'},
  
  /* simple span replacements */
  {re: /\*\*([^\n]+?)\*\*/gm, rep: '<strong>$1</strong>'},
  {re: /\*([^\n]+?)\*/gm, rep: '<em>$1</em>'},
  {re: /!\[([\w ,;.-]*?)\]\(((?:https:\/\/|\.\/)[^\s]+?)(?: *&quot;([\w ]*?)&quot;)?\)/gm, rep: '<img alt = "$1" src="$2" title="$3" />'},
  {re: /\[([\w ,;.-]*?)\]\(((?:https:\/\/|\.\/)[^\s]+?)(?: *&quot;([\w ]*?)&quot;)?\)/gm, rep: '<a href="$2" target="_blank" title="$3">$1</a>'},
]



/**
 * Parse markdown. This is a very limited set of markdown. All HTML tags in the markdown are replaced by character
 * entities. {@link MARKDOWN_REPS} for details.
 * @param {string} markdown
 * @returns {string}
 */
export function parseMarkdown(markdown) {
  let html = markdown;
  for (const replacement of MARKDOWN_REPS) {
    html = html.replace(replacement.re, replacement.rep);
  }
  return html;
}

/**
 * Create an element as a child of another.
 * @param {Element} parentElement
 * @param {string} tagName
 * @param {string} className
 * @returns {Element}
 */
export function createChild(parentElement, tagName, className) {
  const child = document.createElement(tagName);
  if (className) {
    child.className = className;
  }
  parentElement.appendChild(child);
  return child;
}


/**
 * @typedef {Object} ButtonConfig
 * @property {Element} parentElement
 * @property {string} url
 * @property {string} [urlDown] - if provided, this is a toggle button
 * @property {boolean} [down] - should the button start down.
 * @property {string} label
 * @property {string} className
 * @property {function(Event, down:boolean)} listener - down is only provided
 *  for toggle buttons.
 */


/**
 * Create a button.
 * @param {module:domTools~ButtonConfig} config
 * returns {HtmlInputElement}
 */ 
export function createButton(config) {
  const container = document.createElement('input');
  const toggleButton = !!config.urlDown;
  container.type = 'image';

  let buttonDown = !!config.down;

  container.className = toggleButton ? 'hcje-toggle-button' : 'hcje-button';
  if (config.className) {
    container.classList.add(config.className);
  }

  /**
   * Set the src for the button.
   */
  function setImageSrc() {
    if (!toggleButton) {
      console.debug(`Set button icon to ${config.url}`);
      container.src = config.url;
    } else {
      container.src = buttonDown ? config.urlDown : config.url;
      if (buttonDown) {
        container.classList.add('down');
        container.classList.remove('up');
      } else {
        container.classList.add('up');
        container.classList.remove('down');
      }
    }
  }
  
  setImageSrc();
  container.title = config.label ?? '';

  config.parentElement?.appendChild(container);
  if (config.listener) {
    container.addEventListener('click', (ev) => {
      if (toggleButton) {
        buttonDown = !buttonDown;
        setImageSrc();
      }
      config.listener(ev, buttonDown);
    });
  }
  container.addEventListener('contextmenu', (ev) => ev.preventDefault());
  container.addEventListener('dragstart', (ev) => ev.preventDefault());

  return container;
}


/**
 * Add a labelled button for use as a control.
 * The structure generated by the code is effectively
 *
 * + div: className hcje-button-control
 *     + span hcje-control-label
 *     + input classNames hcje-button
 *
 * @param {ButtonConfig} config
 * @returns {module:domTools~ButtonControl}
 */
export function createButtonControl(config) {
  const container = document.createElement('div');
  container.className = 'hcje-button-control';

  const label = createChild(container, 'div', 'hcje-control-label' );
  label.innerText = config.label;

  
  const button = createButton({
    parentElement: container,
    url: config.url,
    urlDown: config.urlDown,
    down: config.down,
    label: config.label,
    className: config.className,
    listener: config.listener
  });
  
  config.parentElement?.appendChild(container);

  /**
   * Button control.
   * @interface
   * @alias module:domTools~ButtonControl
   */
  return {
    /**
     * Get the containing element.
     * @returns {Element}
     */
    getElement: () => container,
  }
}


/**
 * Create spinner control.
 *
 * The structure generated by the code is effectively
 *
 * + div: className hcje-spinner-control
 *     + span hcje-control-label
 *     + div className hcje-spinner-control__inner
 *         + input classNames hcje-button hcje-spinner-control__inner__down-button
 *         + div className hcje-spinner-control__inner__value
 *         + input classNames hcje-button hcje-spinner-control__inner__up-button
 *
 * @param {Object} config
 * @param {string} config.label - label for spinner control
 * @param {number} [config.initialValue = 0] - initial value.
 * @param {string} config.downImage - url to down button image
 * @param {string} config.upImage - url to up button image
 * @param {string} [config.downLabel = 'Reduce'] - label for down button.
 * @param {string} [config.upLabel = 'Increase'] - label for up button.
 * @param {number} [config.step = 1] - change in value per click
 * @param {number} [config.minValue = 0] minimum value
 * @param {number} [config.maxValue = 100] maximum value
 * @param {function(number): string} format - takes the value and returns formated value.
 * @param {function(number)} onChange - value after changes.
 * @returns {module:domTools~SpinnerControl}
 */
export function createSpinner(config) {
  const container = document.createElement('div');
  container.className = 'hcje-spinner-control';
  
  const label = createChild(container, 'span', 'hcje-control-label' );
  label.innerText = config.label;

  const innerContainer = createChild(container, 'div', 'hcje-spinner-control__inner');

  /** Change in value per click @type {number} */
  const step = config.step || 1;

  /** Minimum value @type {number} */
  const minValue = config.minValue ?? 0;

  /** Maximum value @type {number} */
  const maxValue = config.maxValue ?? 100;

  /** Underlying spinner value. @type {number} */
  let value = 0;

  /** Value element @type {Element} */
  let valueElement;

  /** Down button @type {Element} */
  let downButton;
  
  /** Up button @type {Element} */
  let upButton;

  /** 
   * Function to set value.
   * @param {number} newValue
   */
  function setValue(newValue) {
    value = utils.clamp(newValue, minValue, maxValue);
    downButton.disabled = value <= minValue;
    upButton.disabled = value >= maxValue;

    valueElement.innerText = config.format ? config.format(value) : `${value}`;
  }

  /**
   * Function to set value and inform owner of change.
   * @param {number} newValue
   */
  function setValueAndNotify(newValue) {
    setValue(newValue);
    config.onChange?.(value);
  }

  downButton = createButton({
    parentElement: innerContainer, 
    url: config.downImage,
    label: config.downLabel ?? 'Down',
    className: 'hcje-spinner-control__inner__down-button',
    listener: () => setValue(value - step)
  }) 

  valueElement = createChild(innerContainer, 'div', 'hcje-spinner-control__inner__value');

  upButton = createButton({
    parentElement: innerContainer, 
    url: config.upImage,
    label: config.upLabel ?? 'Up',
    className: 'hcje-spinner-control__inner__up-button',
    listener: () => setValue(value + step)
  });

  setValue(config.initialValue ?? 0);
  /**
   * Encapsulation of spinner control.
   * @interface
   * @alias module:domTools~SpinnerControl
   */
  return {
    /**
     * Get the containing element.
     * @returns {Element}
     */
    getElement: () => container,

    /**
     * Get the current value.
     * @returns {number}
     */
    getValue: () => value,
  };
}

/**
 * Encapsulation of DOM menu bar.
 * @typedef {Object} MenuBar
 */

/**
 * Create a menu bar. The opener and closer elements are added first followed
 * by the children. 
 *
 * The structure generated by the code is effectively
 *
 * + div: className hcje-menu-bar-container
 *     + config.opener element
 *     + div className hcje-menu-bar-container__menu
 *         + config.closer
 *         + config.children
 *
 * Listeners are automatically added to the opener and closer
 * to set the class of the menu bar container to 'open' when open.
 * It is expected that the the display of these elements will
 * be controlled by CSS.
 * 
 * @param {Object} config
 * @param {Element} config.parentElement - the menu element is added to the parent
 * @param {Element} config.opener - element used to open and close the menu bar.
 * @param {Elememt} config.closer - element used to close the menu bar
 * @param {Element} config.children - buttons to add to menu
 * @param {function()} [config.onOpen] - called when menu opened to allow
 *  caller to enable or disable buttons.
 * @returns {module:domTools~MenuBar} 
 */
export function createMenuBar(config) {
  const menuBar = document.createElement('div');
  menuBar.className = 'hcje-menu-bar';
  config.parentElement.appendChild(menuBar);

  /** Set the menu state.
   * @param {boolean} open - true if open.
   */ 
  function setMenuOpen(open) {
      config.opener.classList.remove(`hcje-menu-opener--${open ? 'visible' : 'hidden'}`);
      config.opener.classList.add(`hcje-menu-opener--${!open ? 'visible' : 'hidden'}`);
      menuBar.classList.remove(`hcje-menu-bar--${!open ? 'visible' : 'hidden'}`);
      menuBar.classList.add(`hcje-menu-bar--${open ? 'visible' : 'hidden'}`);
  }


  if (config.opener) {
    config.parentElement.appendChild(config.opener);
    config.opener.classList.add('hcje-menu-opener');
    config.opener.classList.add('hcje-menu-opener--visible');
    config.opener.addEventListener('click', () => {
      setMenuOpen(true);
      config.onOpen?.();
    });
    config.opener
  }


  if (config.closer) {
    menuBar.appendChild(config.closer);
    config.closer.addEventListener('click', () => setMenuOpen(false));
  }

  for (const child of config.children) {
    menuBar.appendChild(child);
  }
 
  setMenuOpen(false);

  /**
   * Set the enabled state of the menu. If the state is false, all buttons are
   * disabled and the menu is closed.
   * @param {boolean} enabled
   */
  function setEnabledState(enabled) {
    const allInputs = document.querySelectorAll(`.${CONTAINER_CLASS_NAME} input`);
    allInputs.forEach((input) => input.disabled = !enabled);
    if (!enabled) {
      container.classList.remove('open');
    }
  }

  /**
   * Menubar
   * @interface
   * @alias {module:domTools~MenuBar}
   */
  return {
    /**
     * Close the bar.
     */
    close: () => setMenuOpen(false),
    
    /** 
     * Enabled the menu. The container has the disabled class removed and all clicks
     * are activated.
     */
    enable: () => setEnabledState(true),
    /** 
     * Disable the menu. The container has the disabled class set and all clicks
     * are ignored.
     */
    disable: () => setEnabledState(false),
  }
}


/**
 * @typedef {Object} DialogButtonDefn
 * @property {string} id
 * @property {string} url
 * @property {string} label
 */

/**
 * Create a dialog. Styling is the responsibility of CSS, but the structure
 * created is as follows:
 *
 * + div container className hcje-dialog-mask
 * + div className hcje-dialog-box
 *     + div className hcje-dialog-box__title
 *     + div className hcje-dialog-box__body
 *     + div className hcje-dialog-box__buttons
 *         + div buttons className hcje-dialog-box__button
 *
 * If any button is pressed, the dialog closes and the id of the button
 * provided by the return.
 * @param {Object} config
 * @param {string} config.title
 * @param {string} [config.className] - additional class to apply.
 * @param {string} [config.markdown] - the body. If set, overrides the text option.
 * @param {string} [config.text] - body text.
 * @param {Array<Element>} [config.children] - add as children to dialog.
 * @param {Array<module:domTools~DialogButtonDefn>} config.buttonDefns
 * @returns {Promise} fulfils to button id.
 */
export function createDialog(config) {
  const DIALOG_CLASS_NAME = 'hcje-dialog-box';
  const BASE_Z_INDEX = 1000;

  const existingDialogs = document.querySelectorAll(`.${DIALOG_CLASS_NAME}`).length;
  console.debug(`Creating dialog on top of ${existingDialogs} existing dialogs.`);
  const mask = document.createElement('div');
  mask.className = 'hcje-dialog-mask fullscreen';

  
  const box = document.createElement('div');
  box.className = DIALOG_CLASS_NAME;
  if (config.className) {
    box.classList.add(config.className);
  }

  const header = createChild(box, 'div', 'hcje-dialog-box__title')
  createChild(header,'h1').innerText = config.title;

  const dialogBody = createChild(box, 'div', 'hcje-dialog-box__body');
  if (config.markdown) {
    dialogBody.innerHTML = parseMarkdown(config.markdown);
  } else if (config.text) {
    dialogBody.innerText = config.text;
  }

  if (config.children) {
    for (const child of config.children) {
      dialogBody.appendChild(child);
    }
  }
  const buttonBar = createChild(box, 'div', 'hcje-dialog-box__buttons');

  const promises = [];
  for (const defn of config.buttonDefns) {
    const button = createButton({
      parentElement: buttonBar,
      url: defn.url,
      label: defn.label,
      className: 'hcje-dialog-box__button'
    });
    promises.push(new Promise((resolve) => {
      button.addEventListener('click', () => {
        mask.style.opacity = 0;
        box.style.opacity = 0;
        setTimeout(() => {
          mask.remove();
          box.remove();
          resolve(defn.id);
        }, 500);
      }, {once: true})
    }));
  }
  document.body.appendChild(mask);
  document.body.appendChild(box);
  
  mask.style.zIndex = BASE_Z_INDEX + existingDialogs * 2;
  box.style.zIndex = BASE_Z_INDEX + existingDialogs * 2 + 1;
  return Promise.any(promises);
}



/**
* GameArea object which encapsulates the dynamic game area
*/
export class GameArea {

  /** The main game area element @type {Element} */
  #gameAreaElement;
  /** Design width @type {number} */
  #width;
  /** Design height @type {number} */
  #height;
  /** Element in which game area should fit. @type {Element} */
  #fitWithin;
  /** Margin around the game area @type {number} */
  #margin;
  /** Max permitted scale @type {number} */
  #maxScale;
  /** Should the game area be positioned at the top rather than the centre. */
  #atTop;


  /** 
   * Create a game area. The game area is created with a class of 'hcje-game-area'. This is absolutely positioned
   * and centered.
   * @param {Object} config
   * @param {number} config.width - design width
   * @param {number} config.height - design height
   * @param {Element} [config.fitWithin = window] - element into which the game area should fit. 
   * @param {number} [config.margin = 0] - margin required around the game area.
   * @param {number} [maxScale] - maximum allowed scale. Defaults to unlimited.
   * @param {boolean} [fixedScale = false] - prevents automatically rescaling if window resizes.
   * @param {boolean} [atTop = false} - the game area is normally centered but it can be set to the top but still
   * centered horizonally.
   */
  constructor(config) {
    this.#gameAreaElement = createChild(config.parentUrl ?? document.body, 'div', 'hcje-game-area');
    this.#gameAreaElement.style.width = `${config.width}px`;
    this.#gameAreaElement.style.height = `${config.height}px`;
    this.#width = config.width;
    this.#height = config.height;
    this.#fitWithin = config.fitWithin;
    this.#margin = config.margin;
    this.#maxScale = config.maxScale;
    this.#atTop = config.atTop;
    this.#rescale();
    if (!config.fixedScale) {
      console.debug(`Add resize event listener to rescale game area on window change.` );
      addEventListener('resize', () => this.#rescale());
    }
  }
  /**
   * Calculate required scale for game area and apply to the game area.
   * @see {module:domTools~GameArea.rescale}
   */
  #rescale() {
    let scale = device.getScaleToFit(this.#width, this.#height, {
      element: this.#fitWithin,
      margin: this.#margin
    });
    if (this.#maxScale) {
      scale = Math.min(this.#maxScale, scale);
    }
    if (this.#atTop) {
      this.#gameAreaElement.style.top = `${this.#margin + 0.5 * this.#height * (scale - 1) }px`; 
      this.#gameAreaElement.style.transform = `translate(-50%) scale(${scale})`;
    } else {
      this.#gameAreaElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    console.debug(`Game area size: design [${this.#width}x${this.#height} at scale of ${scale.toFixed(2)};`);
  }
  
  /**
   * Get the design dimensions.
   * @returns {module:utils~Dimension}
   */
  getDesignDims() { 
    return {width: this.#width, height: this.#height}; 
  }

  /**
   * Get the scaled dimensions.
   * @returns {module:utils~Dimension}
   */
  getScaledDims() {
    return {width: this.#width * scale, height: this.#height * scale}; 
  }

  /**
   * Append a child.
   * @param {Element} child
   */
  appendChild(child) {
    return this.#gameAreaElement.appendChild(child);
  }

  /**
   * Remove all children
   */
  removeAllChildren() {
    this.#gameAreaElement.replaceChildren();
  }

} 

