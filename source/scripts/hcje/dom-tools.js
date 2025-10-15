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
 * Module containing buttons, dialogs and other features for manipulating the DOM.
 */

import * as utils from './utils.js';
import * as device from './device.js';


/** 
 * Markdown replacements. @type {Array<{re: RegExp, rep: string}> 
 * @private
 **/ 
const MARKDOWN_REPS = [
  /* special character replacements */ 
  {re: /\r/g, rep: ''},
  {re:/(?:&(?!\w{2,5};))/gi , rep: '&amp;'},
  {re: /</g, rep: '&lt;'},
  {re: />/g, rep: '&gt;'},
  {re: /"/g, rep: '&quot;'},
  {re: /'/g, rep: '&apos;'},
  
  /* block divisions */
  {re: /^[\+\-*] (.*)$/gm, rep: '<uli>$1</uli>'},
  {re: /<\/uli>\n<uli>/g, rep: '</uli><uli>'},
  {re: /\n((?:<uli>.*?<\/uli>)+)\n/gs, rep: '\n<ul>$1</ul>\n'},

  {re: /^[\d]+ (.*)$/gm, rep: '<oli>$1</oli>'},
  {re: /<\/oli>\n<oli>/g, rep: '</oli><oli>'},
  {re: /\n((?:<oli>.*?<\/oli>)+)\n/gs, rep: '\n<ol>$1</ol>\n'},

  {re: /[ou]li>/g, rep: 'li>'},

  {re: /^# (.*?)#?$/gm, rep: '<h1>$1</h1>'},
  {re: /^## (.*?)(?:##)?$/gm, rep: '<h2>$1</h2>'},
  {re: /^### (.*?)(?:###)?$/gm, rep: '<h3>$1</h3>'},
  {re: /^#### (.*?)(?:####)?$/gm, rep: '<h4>$1</h4>'},
  
  /* remove interblock divisions */
  {re: /<\/(h\d|ul|ol)>\n*<(h\d|ul|ol)>/g, rep: '<\/$1><$2>'},

  /* add paragraph blocks */
  {re: /([^>])\n{2,}([^<])/g, rep: '$1</p><p>$2'},
  {re: />\n+([^<])/g, rep: '><p>$1'},
  {re: /([^>])\n+</g, rep: '$1</p><'},
  {re: /^\s*([^<])/, rep: '<p>$1'},
  {re: /([^>])\s*$/g, rep: '$1</p>'},
  
  /* simple span replacements */
  {re: /\*\*([^\n]+?)\*\*/gm, rep: '<strong>$1</strong>'},
  {re: /\*([^\n]+?)\*/gm, rep: '<em>$1</em>'},
  {re: /!\[([\w ,;.-]+?)\]\(((?:https:\/\/|\.\/)[^\s?]+?)(?: *&quot;([\w ]*?)&quot;)?\)/gm, rep: '<img alt = "$1" src="$2" title="$3" />'},
  {re: /\[([\w ,;.-]+?)\]\(((?:https:\/\/|\.\/)[^\s?]+?)(?: *&quot;([\w ]*?)&quot;)?\)/gm, rep: '<a href="$2" target="_blank" title="$3">$1</a>'},
]



/**
 * Parse markdown. This is a very limited set of markdown. All HTML tags in the markdown are replaced by character
 * entities.
 *
 * + Character entities are supported but only with 2 to  5 (inclusive) alphabetic characters. E.g `&copy;`.
 * + Four levels of headings are supported but only using the `## abc` format.
 * + Images are supported but with the same limitations as links.
 * + Links are supported, but only for `https://` links and without query strings.
 * + Only asterisks are supported for strong and emphasis formatting. E.g. `**bold**`. Underscores are not.
 * + Ordered and unordered lists are supported but only to one level of indentation.
 *
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
 * Subset of the properties and methods normally provided by an 
 * [Element]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element}. If an object implements this interface, it
 * can be used in some situations in the same way as an
 * [Element]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element}.
 *
 * The interface is typically implemented by class which extend an 
 * [Element]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element} by composition rather than inheritance.
 *
 * @interface ElementSubset 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element}
 */

/**
 * @function module:hcje/domTools~ElementSubset#addEventListener
 * @param {string} eventType - event type to listen to
 * @param {function|Object} listener - handler of the event
 * @param {Object|boolean} optionsOrUseCapture - additonal options
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener}
 */
/**
 * @function module:hcje/domTools~ElementSubset#appendChild
 * @param {Element} child - element to append
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild}
 */

/** 
 * @name module:hcje/domTools~ElementSubset#parentElement
 * @type {string}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/parentElement}
 **/
/** 
 * @name module:hcje/domTools~ElementSubset#className
 * @type {string}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/className}
 **/
/** 
 * @name module:hcje/domTools~ElementSubset#classList
 * @type {DOMTokenList}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/classList}
 **/

/**
 * @callback ButtonListener
 * @param {Event} event - triggering event
 * @param {boolean} isDown - true if toggle button is in down state.
 */

/**
 * @typedef {Object} ButtonConfig
 * @property {Element} parentElement
 * @property {string} url
 * @property {string} [urlOn] - if provided, this is a toggle button
 * @property {boolean} [on] - should the button start in the on position. Only applicable to a toggle button.
 * @property {string} label
 * @property {string} labelOn - label for toggle buttons if on.
 * @property {string} className
 * @property {module:hcje/domTools~ButtonListener} onClick
 */

/**
 * Wrapper for an Element which allow objects which are inherited from this class to be used as Elements in 
 * some limited applications.
 * @implements module:hcje/domTools~ElementSubset
 */ 
class ElementWrapper {
  /** The base element @type{Element} */ 
  #element;

  /**
   * Construct the base element
   * @param {string} elementType
   */ 
  constructor(elementType) {
    this.#element = document.createElement(elementType);
  }

  /**
   * Get the wrapped element.
   * @returns {Element}
   * @protected
   */ 
  get _element() {
    return this.#element;
  }

  /**
   * @borrows module:hcje/domTools~ElementSubset#parentElement
   */
  get parentElement() {
    return this.#element.parentElement;
  }

  /**
   * @borrows module:hcje/domTools~ElementSubset#className
   */ 
  get className() {
    return this.#element.className;
  }

  /**
   * @borrows module:hcje/domTools~ElementSubset#className
   */ 
  set className(value) {
    this.#element.className = value;
  }

  /**
   * @borrows module:hcje/domTools~ElementSubset#classList
   */ 
  get classList() {
    return this.#element.classList;
  }

  /**
   * @borrows module:hcje/domTools~ElementSubset#addEventListener
   */ 
  addEventListener(eventType, listener, optionsOrUseCapture) {
    return this.#element.addEventListener(eventType, listener, optionsOrUseCapture);
  }

  /**
   * @borrow module:hcje/domTools~ElementSubset#appendChild
   */
  appendChild(child) {
    return this.#element.appendChild(child);
  }

  /**
   * Append to a parent element. Note, if it is already a child, this call is ignored.
   * This method is provided to allow callers to adust hierachies without needing access to the protected
   * wrapped element. Note that the method will silently return if parentElement is not provided.
   * @param {module:hcje/domTools~ElementSubset} parentElement
   */
  appendTo(parentElement) {
    if (!parentElement) {
      return;
    }
    if (this.#element.parentElement) {
      console.error(`Attempt to append control as a child when it already has a parent. Ignored.`);
      return;
    } else {
      parentElement.appendChild(this.#element);
    }
  }

  /**
   * Convert item to underlying element.
   * @param {Element | ElementWrapper} item - the object to return as an Element.
   * @returns {Element}
   */ 
  static _toElement(item) {
    return item instanceof ElementWrapper ? item._element : item;
  }

}

/**
 * Encapsulate a button.
 */
export class Button extends ElementWrapper {
  /** Button element @type {HTMLButtonElement} */
  #button;
  /** Is the button a toggle button @type {boolean} */
  #toggleButton;
  /** Button on state. Always false if not a toggle button. */
  #buttonOn;
  /** Icon element @type {Element} */
  #icon;
  /** Text element for button face @type {Element} */
  #buttonText;
  /** Url for icon button @type {string} */
  #url;
  /** Url for icon button when down @type {string} */
  #urlOn;
  /** Label for text button @type {string} */
  #label;
  /** Label for text button when down @type {string} */
  #labelOn;
  /** Base class name @type {string} */
  #baseClass;

  /**
   * Create a button.
   * @param {module:hcje/domTools~ButtonConfig} config
   * returns {HtmlInputElement}
   */ 
  constructor(config) {
    super('button');
    this.#toggleButton = !!config.urlOn || (!config.url && config.labelOn); 
    this.#url = config.url;
    this.#urlOn = config.urlOn;
    this.#label = config.label;
    this.#labelOn = config.labelOn;
    this.#buttonOn = !!config.down;

    this.#baseClass = this.#toggleButton ? 'hcje-toggle-button' : 'hcje-button';
    this._element.className = this.#baseClass;
    if (config.className) {
      this._element.classList.add(config.className);
    }
    this._element.classList.add(`${this.#baseClass}--${config.url ? 'image' : 'text'}`);

    if (config.url) {
      this.#icon = createChild(this._element, 'img', `${this.#baseClass}__icon`);
    } else {
      this._elementText = createChild(this._element, 'div', `${this.#baseClass}__text`);
    }
    this.#setButtonFace();
    this._element.title = config.label ?? '';

    config.parentElement?.appendChild(this._element);
    if (config.onClick || this.#toggleButton) {
      this._element.addEventListener('click', (ev) => {
        if (this.#toggleButton) {
          this.#buttonOn = !this.#buttonOn;
          this.#setButtonFace();
        }
        config?.onClick(ev, this.#buttonOn);
      });
    }
    this._element.addEventListener('contextmenu', (ev) => ev.preventDefault());
    this._element.addEventListener('dragstart', (ev) => ev.preventDefault());
  }

  /**
   * Set the src for the button.
   * JSDoc does not handle private methods correctly.
   * @private
   */
  #setButtonFace() {
    if (!this.#toggleButton) {
      if (this.#icon) {
        this.#icon.src = this.#url;
        this.#icon.setAttribute('alt', this.#label);
      }
      if (this._elementText) {
        this._elementText.innerText = this.#label;
      }
    } else {
      if (this.#buttonOn) {
        if (this.#icon) {
          this.#icon.src = this.#urlOn;
          this.#icon.setAttribute('alt', this.#labelOn || this.#label);
        } 
        if (this._elementText) {
          this._elementText.innerText = this.#labelOn;
        }
        this._element.classList.add(`${this.#baseClass}--down`);
        this._element.classList.remove(`${this.#baseClass}--up`);
      } else {
        if (this.#icon) {
          this.#icon.src = this.#url;
          this.#icon.setAttribute('alt', this.#label);
        } 
        if (this._elementText) {
          this._elementText.innerText = this.#label;
        }
        this._element.classList.add(`${this.#baseClass}--up`);
        this._element.classList.remove(`${this.#baseClass}--down`);
      }
    }
  }


  /**
   * Test if button is on. Always false if not a toggle button. 
   * @returns {boolean}
   */ 
  isOn() {
    return this.#buttonOn;
  }
}


/**
 * Base control.
 * Creates the control hierachy of 
 * + Container div
 * ++ Label div
 * ++ Control element
 */
class BaseControl extends ElementWrapper {
  /**
   * Construct the base control.
   * @param {string} className
   * @param {string} config
   * @param {string} config.label
   * @param {module:hcje/domTools~ElementSubset} config.parentElement
   */
  constructor(className, config) {
    super('div');
    this._element.className = `hcje-base-control ${className}`

    const labelElement = createChild(this._element, 'div', 'hcje-base-control__label' );
    labelElement.innerText = config.label;
    this.appendTo(config.parentElement);
  }

  /**
   * Add control element. Although multiple control elements can be added, only one is expected.
   * This adds it after the label.
   * @param {Element | module:hcje/domTools~ElementWrapper} controlElement
   * @protected
   */
  _appendControlElement(controlElement) {
    this._element.append(ElementWrapper._toElement(controlElement));
  }
  
  /**
   * Add control element. Although multiple control elements can be added, only one is expected.
   * This adds it before the label.
   * @param {Element | module:hcje/domTools~ElementWrapper} controlElement
   * @protected
   */
  _prependControlElement(controlElement) {
    this._element.prepend(ElementWrapper._toElement(controlElement));
  }

  /**
   * Get the control's value. This is expected to be overridden;
   * @returns {undefined}
   */
  getValue() {
    console.error('BaseClass method getValue should be overridden.');
  }
}

/**
 * Button control. This is effectively just a button with an associated label.
 */
export class ButtonControl extends BaseControl {
  /** The button @type {module:hcje/domTools~Button} */
  #button;

  /**
   * Create a labelled button for use as a control.
   * The structure generated by the code is effectively
   *
   * + div: className hcje-button-control
   *     + span hcje-control-label
   *     + input classNames hcje-button
   *
   * @param {module:hcje/domTools~ButtonConfig} config
   */
  constructor(config) {
    super('hcje-button-control', config);
    
    this.#button = new Button({
      parentElement: this._element,
      url: config.url,
      urlOn: config.urlOn,
      on: config.on,
      label: config.label,
      labelOn: config.labelOn,
      className: config.className,
      onClick: config.onClick
    });

    this.appendTo(config.parentElement);
  }

  /**
   * Get the state of the button. True if down. This is only relevant to a toggle button.
   * @returns {boolean}
   */ 
  getValue() {
    return this.#button.isOn();
  }
}

/**
 * Checkbox control
 */
export class CheckboxControl extends BaseControl {
  /** Checkbox element @type {Element} */
  #box;
  /** State of button @type {boolean} */
  #checked;
  /** Function called on change @type {function(boolean)} */
  #onChange;

  
  /**
   * Construct the checkbox
   * @param {Object} config
   * @param {string} label
   * @param {boolean} initialValue - true if checked
   * @param {function(newState:boolean)} onChange - function called if state changes.
   *
   */
  constructor(config) {
    super('hcje-checkbox-control', config);

    this.#box = document.createElement('div');
    this.#box.className  ='hcje-checkbox-control__box';
    if (config.onChange) {
      this.#onChange = config.onChange;
      this.#box.addEventListener('click', () => {
        this.#setState(!this.#checked)
        this.#onChange(this.#checked);
      });
    }
    this._prependControlElement(this.#box);
    this.#setState(!!config.initialValue);
  }
  

  /**
   * Set state.
   * @param {boolean} checkedState
   * @private
   */
  #setState(checkedState) {
    this.#checked = checkedState;
    if (this.#checked) {
      this.#box.classList.add('hcje-checkbox-control__box--checked');
      this.#box.classList.remove('hcje-checkbox-control__box--unchecked');
    } else {
      this.#box.classList.remove('hcje-checkbox-control__box--checked');
      this.#box.classList.add('hcje-checkbox-control__box--unchecked');
    }
  }
  /**
   * Get current state.
   * @returns {boolean} true if checked.
   */ 
  getValue() {
    return this.#checked;
  }
}

/**
 * Spinner control.
 */
export class SpinnerControl extends BaseControl {
  /** Change in value per click @type {number} */
  #step;
  /** Minimum value @type {number} */
  #minValue;
  /** Maximum value @type {number} */
  #maxValue;
  /** Underlying spinner value @type {number} */
  #value;
  /** Element containing the value @type {Element} */
  #valueElement;
  /** Down button @type {Element} */
  #downButton;
  /** Up button @type {Element} */
  #upButton;
  /** Function called on change @type {function(number)} */
  #onChange;
  /** Function called to format displayed value @type {function(number):string} */
  #format;

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
   * @param {Element} config.parentElement - element to attach to.
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
   * @param {function(number)} onChange - called with new value after changes.
   * @returns {module:hcje/domTools~SpinnerControl}
   */
  constructor(config) {
    super('hcje-spinner-control', config);
    this.#step = config.step || 1;
    this.#minValue = config.minValue ?? 0;
    this.#maxValue = config.maxValue ?? 100;
    this.#value = 0;
    this.#onChange = config.onChange;
    this.#format = config.format;

    const innerContainer = document.createElement('div');
    innerContainer.className ='hcje-spinner-control__inner ';

    this.#downButton = new Button({
      parentElement: innerContainer, 
      url: config.downImage,
      label: config.downLabel ?? 'Down',
      className: 'hcje-spinner-control__inner__down-button',
      onClick: () => this.#setValueAndNotify(this.#value - this.#step)
    }) 

    this.#valueElement = createChild(innerContainer, 'div', 'hcje-spinner-control__inner__value');

    this.#upButton = new Button({
      parentElement: innerContainer, 
      url: config.upImage,
      label: config.upLabel ?? 'Up',
      className: 'hcje-spinner-control__inner__up-button',
      onClick: () => this.#setValueAndNotify(this.#value + this.#step)
    });

    this.#setValue(config.initialValue ?? 0);

    this._appendControlElement(innerContainer);
  }

  /** 
   * Function to set value.
   * @param {number} newValue
   * @private
   */
  #setValue(newValue) {
    this.#value = utils.clamp(newValue, this.#minValue, this.#maxValue);
    this.#downButton.disabled = this.#value <= this.#minValue;
    this.#upButton.disabled = this.#value >= this.#maxValue;

    this.#valueElement.innerText = this.#format ? this.#format(this.#value) : `${this.#value}`;
  }

  /**
   * Function to set value and inform owner of change.
   * @param {number} newValue
   */
  #setValueAndNotify(newValue) {
    this.#setValue(newValue);
    this.#onChange?.(newValue);
  }

  /**
   * Get the current value.
   * @returns {number}
   */
  getValue() {
    return this.#value;
  }
}

/**
 * Encapsulation of DOM menu bar.
 */
export class MenuBar {
  /** The menubar element @type {HTMLElement} */
  #menuBar;

  /** The element that opens the menu. @type {module:hcje/domTools~ElementSubset} */
  #opener;
  /** The element that opens the menu. @type {module:hcje/domTools~ElementSubset} */
  #closer;
  /** Function called when menu opened. @type {function()} */
  #onOpen;
  /** Function called when menu opened. @type {function()} */
  #onClose;




/**
 * Construct a menu bar. The opener and closer elements are added first followed
 * by the children. 
 *
 * The structure generated by the code is effectively
 *
 * + div: className hcje-menu-bar-container
 *     + config.opener element
 *     + div className hcje-menu-bar
 *         + config.closer
 *         + config.children
 *
 * Listeners are automatically added to the opener and closer
 * to set the class of the menu bar container to 'open' when open.
 * It is expected that the the display of these elements will
 * be controlled by CSS.
 * 
 * @param {Object} config
 * @param {Element} [config.parentElement = document.body] - the menu element is added to the parent
 * @param {module:hcje/domTools~ElementWrapper|Element} config.opener - element used to open and close the menu bar.
 * @param {module:hcje/domTools~ElementWrapper|Element} config.closer - element used to close the menu bar
 * @param {module:hcje/domTools~ElementWrapper|Element} config.children - buttons to add to menu
 * @param {function()} [config.onOpen] - called when menu opened via the opener 
 * @param {function()} [config.onClose] - called when menu closed via the closer
 *  caller to enable or disable buttons.
 * @returns {module:hcje/domTools~MenuBar} 
 */
  constructor(config) {
    this.#menuBar = document.createElement('div');
    this.#menuBar.className = 'hcje-menu-bar';
    this.#onOpen = config.onOpen;
    this.#onClose = config.onClose;
    this.#opener = config.opener;
    this.#closer = config.close;

    const parentElement = config.parentElement || document.body;
    parentElement.appendChild(this.#menuBar);

    if (this.#opener) {
      if (this.#opener instanceof ElementWrapper) {
        this.#opener.appendTo(parentElement);
      } else {
        parentElement.appendChild(this.#opener);
      }
      this.#opener.classList.add('hcje-menu-opener');
      this.#opener.classList.add('hcje-menu-opener--visible');
      this.#opener.addEventListener('click', () => {
        this.#setMenuOpen(true);
        this.#onOpen?.();
      });
      this.#opener
    }


    if (this.#closer) {
      if (this.#closer instanceof ElementWrapper) {
        this.#closer.appendTo(this.#menuBar);
      } else {
        this.#menuBar.appendChild(this.#closer);
      }
      this.#closer.addEventListener('click', () => {
        this.#setMenuOpen(false);
        this.#onClose?.();
      });
    }

    for (const child of config.children) {
      if (child instanceof ElementWrapper) {
        child.appendTo(this.#menuBar);
      } else {
        this.#menuBar.appendChild(child);
      }
    }
   
    this.#setMenuOpen(false);
  }
  
  /** Set the menu state.
   * @param {boolean} open - true if open.
   * @private
   */ 
  #setMenuOpen(open) {
      this.#opener.classList.remove(`hcje-menu-opener--${open ? 'visible' : 'hidden'}`);
      this.#opener.classList.add(`hcje-menu-opener--${!open ? 'visible' : 'hidden'}`);
      this.#menuBar.classList.remove(`hcje-menu-bar--${!open ? 'visible' : 'hidden'}`);
      this.#menuBar.classList.add(`hcje-menu-bar--${open ? 'visible' : 'hidden'}`);
  }

  /**
   * Close the menu bar.
   */
  close() {
    this.#setMenuOpen(false);
    this.#onClose?.();
  }
  
  /**
   * Set the enabled state of the menu. If the state is false, all buttons are
   * disabled and the menu is closed.
   * @param {boolean} enabled
   */
  setEnabledState(enabled) {
    const openers = document.getElementsByClassName('hcje-menu-opener');
    for (const opener of openers) {
      opener.disabled = !enabled;
    }
    const allInputs = document.querySelectorAll(`hcje-menu-opener input`);
    allInputs.forEach((input) => input.disabled = !enabled);
    if (!enabled) {
      this.#setMenuOpen(false);
    }
  }
  
  /** 
   * Enabled the menu. The container has the disabled class removed and all clicks
   * are activated.
   */
  enable() {
    this.setEnabledState(true);
  }
  /** 
   * Disable the menu. The container has the disabled class set and all clicks
   * are ignored.
   */
  disable() {
    this.setEnabledState(false);
  }

  /**
   * Remove the menu.
   */
  remove() {
    this.#menuBar.remove();
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
 * @param {Array<module:hcje/domTools~ElementWrapper|Element>} [config.children] - add as children to dialog.
 * @param {Array<module:hcje/domTools~DialogButtonDefn>} config.buttonDefns - buttons placed at the bottom of the dialog 
 * and close it. 
 * @returns {Promise} fulfils to id of button that closed the dialog..
 */
export function createDialog(config) {
  const DIALOG_CLASS_NAME = 'hcje-dialog-box';
  const BASE_Z_INDEX = 1000;

  const existingDialogs = document.querySelectorAll(`.${DIALOG_CLASS_NAME}`).length;
  console.debug(`Creating dialog on top of ${existingDialogs} existing dialogs.`);
  const mask = document.createElement('div');
  mask.className = 'hcje-dialog-mask hcje-fullscreen';

  
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
      if (child instanceof ElementWrapper) {
        child.appendTo(dialogBody);
      } else {
        dialogBody.appendChild(child);
      }
    }
  }
  const buttonBar = createChild(box, 'div', 'hcje-dialog-box__buttons');

  const promises = [];
  for (const defn of config.buttonDefns) {
    const button = new Button({
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
   * @param {Element} [config.fitWithin] - element into which the game area should fit. If omitted a div that covers
   * the full size of the window is created.
   * @param {number} [config.margin = 0] - margin required around the game area.
   * @param {number} [maxScale] - maximum allowed scale. Defaults to unlimited.
   * @param {boolean} [fixedScale = false] - prevents automatically rescaling if window resizes.
   * @param {boolean} [atTop = false} - the game area is normally centered but it can be set to the top but still
   * centered horizonally.
   */
  constructor(config) {
    this.#fitWithin = config.fitWithin ?? createChild(document.body, 'div', 'hcje-game-area-container hcje-fullscreen');
    this.#gameAreaElement = createChild(this.#fitWithin, 'div', 'hcje-game-area');
    this.#gameAreaElement.style.width = `${config.width}px`;
    this.#gameAreaElement.style.height = `${config.height}px`;
    this.#width = config.width;
    this.#height = config.height;
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
   * @see {module:hcje/domTools~GameArea.rescale}
   * @private
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

/**
 * Create a busy indicator.
 * @param {string} [label = 'Loading']
 * @returns {HTMLProgressElement}
 */
export function createBusyIndicator(label = 'Loading') {
  const element = createChild(document.body, 'progress', 'hcje-busy-indicator');
  element.setAttribute('aria-label', label);
  return element;
}


