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
 * Module containing buttons, dialogs and other features for manipulating the DOM. It also includes a cutdown Markdown
 * parser to allow Markdown to be used in dialog messages.
 */

import * as utils from './utils.js';
import * as device from './device.js';


/** 
 * Markdown replacements. @type {Array<{re: RegExp, rep: string}> 
 * @see {@link module:hcje/domTools~parseMarkdown}
 * @private
 **/ 
const MARKDOWN_REPS = [
  /* special character replacements */ 
  {re: /\r/g, rep: ''},
  {re:/(?:&(?!(\w{2,5}|#\d{2,5}|#x[0-9A-F]{2,5});))/gi , rep: '&amp;'},
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
  {re: /&lt;br&gt;/gmi, rep: '<br>'},
  {re: /`(.+?)`/gm, rep: '<code>$1</code>'},
  {re: /\*\*([^\n]+?)\*\*/gm, rep: '<strong>$1</strong>'},
  {re: /\*([^\n]+?)\*/gm, rep: '<em>$1</em>'},
  {re: /!\[([\w ,;.&-]+?)\]\(((?:https:\/\/|\.\/)[^\s?]+?)(?: *&quot;([\w ]*?)&quot;)?\)/gm, rep: '<img alt = "$1" src="$2" title="$3" />'},
  {re: /\[([\w ,;.&-]+?)\]\(((?:https:\/\/|\.\/)[^\s?]+?)(?: *&quot;([\w ]*?)&quot;)?\)/gm, rep: '<a href="$2" target="_blank" title="$3">$1</a>'},
]



/**
 * Parse markdown. This is a very limited set of markdown. All HTML tags in the markdown are replaced by character
 * entities.
 *
 * + Character entities are supported.
 * + Four levels of headings are supported but only using the `## abc` format.
 * + Images are supported but with the same limitations as links.
 * + Links are supported, but only for `https://` links and without query strings.
 * + Only asterisks are supported for strong and emphasis formatting. E.g. `**bold**`. Underscores are not.
 * + Ordered and unordered lists are supported but only to one level of indentation.
 * + Inline code is supported, but not code blocks. To escape the backtick, use a character entity of &#60;
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
 * Create an element as a child of another. This is just a convenience method to simplify the creation of an element,
 * the addition of a class name, and attachment to a parent element.
 * @param {module:hcje/domTools~ElementWrapper|Element} parentElement
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
 * Create a divider, which is essentially a labelled horizontal rule.
 * @param {Object} config
 * @param {Element} parentElement - parent to which the rule should be added as a child.
 * @param {string} label - the label to apply.
 * @param {string} alignment - label position: left, center, right.
 * @returns {HTMLDivElement}
 */
export function createDivider(config) {
  const container = document.createElement('div');
  const baseClass = 'hcje-divider';
  container.className = baseClass;
  let align = config.alignment ? config.alignment.toUpperCase() : 'LEFT';
  if (align === 'CENTER' || align === 'RIGHT') {
    createChild(container, 'hr', `${baseClass}__hr`)
  }
  const label = createChild(container, 'span', `${baseClass}__label`);
  label.innerText = config.label;
  if (align === 'CENTER' || align === 'LEFT') {
    createChild(container, 'hr', `${baseClass}__hr`)
  }
  return container;
}



/**
 * @callback ButtonListener
 * @param {Event} event - triggering event
 * @param {boolean} isDown - true if toggle button is in down state.
 */

/**
 * @typedef {Object} ButtonConfig
 * @property {Element} parentElement
 * @property {string} url - path to the image used on the button.
 * @property {string} [urlOn] - if provided, this is a toggle button
 * @property {boolean} [on] - should the button start in the on position. Only applicable to a toggle button.
 * @property {string} label - button label.
 * @property {string} labelOn - label for toggle buttons if on.
 * @property {string} className - additional class name applied to the button's container.
 * @property {module:hcje/domTools~ButtonListener} onClick - listener called on the click event.
 * @property {number} repeatInterval - set the button to repeat with the specified interval in ms. If the button is
 * set as a toggle button, this is ignored.
 */

/**
 * Wrapper for an [HTMLElement]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement} which allow objects
 * inherited from this class to be used inplace of an
 * [Element]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element} in some limited applications.
 * @implements module:hcje/domTools~ElementSubset
 */ 
export class ElementWrapper {
  /** The base element @type{HTMLlement} */ 
  #element;

  /**
   * Construct the base element
   * @param {string|HTMLElement} elementType - tag name or the actual element to be wrapped.
   */ 
  constructor(elementType) {
    this.#element = elementType instanceof Element ? elementType : document.createElement(elementType);
  }

  /**
   * Get the wrapped element. This is protected and is only intended for use by the domTools module.
   * @returns {Element}
   * @protected
   * @readonly
   */ 
  get _element() {
    return this.#element;
  }

  /**
   * Get the parent element.
   * @returns {string}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/parentElement}
   * @readonly
   */
  get parentElement() {
    return this.#element.parentElement;
  }

  /**
   * Get the class name.
   * @returns {string}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/className}
   */ 
  get className() {
    return this.#element.className;
  }

  /**
   * Set the class name.
   * @param {string} value - new class name.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/className}
   */ 
  set className(value) {
    this.#element.className = value;
  }

  /**
   * Get the classList.
   * @returns {DOMTokenList}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/classList}
   */ 
  get classList() {
    return this.#element.classList;
  }

  /**
   * Get the offset height.
   * @returns {number}
   * @readonly
   */
  get offsetHeight() {
    return this.#element.offsetHeight;
  }

  /**
   * Get the offset width.
   * @returns {number}
   * @readonly
   */
  get offsetWidth() {
    return this.#element.offsetWidth;
  }

  /** 
   * Get the style.
   * @returns {CSSStyleProperties} 
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style}
   * @readonly
   */
  get style() {
    return this.#element.style;
  }

  /**
   * Add event listener.
   * @param {string} eventType - event type to listen to
   * @param {function|Object} listener - handler of the event
   * @param {Object|boolean} optionsOrUseCapture - additonal options
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener}
   */ 
  addEventListener(eventType, listener, optionsOrUseCapture) {
    return this.#element.addEventListener(eventType, listener, optionsOrUseCapture);
  }

  /**
   * Append child.
   * @param {Element|ElementWrapper} child - element to append
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild}
   */
  appendChild(child) {
    return this.#element.appendChild(child instanceof ElementWrapper ? child._element : child);
  }

  /**
   * Append to a parent element. Note, if it is already a child, this call is ignored.
   * This method is provided to allow callers to adust hierarchies without needing access to the protected
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
   * Remove the element from the DOM. 
   * The instance wrapping the element still exists if a reference to it is maintained.
   */
  remove() {
    this.#element.remove();
  }

  /**
   * Remove all children.
   */
  removeAllChildren() {
    this.#element.replaceChildren();
  }

  /**
   * Remove the element's focus.
   */
  blur() {
    this.#element.blur();
  }
  /**
   * Give the element focus.
   */
  focus() {
    this.#element.focus();
  }

  /**
   * Convert item to underlying element. 
   * @param {Element|ElementWrapper} item - the object to return as an Element.
   * @returns {Element}
   */ 
  static _toElement(item) {
    return item instanceof ElementWrapper ? item._element : item;
  }

}


/**
 * Simple text element.
 */
export class TextElement extends ElementWrapper {

  /** 
   * Construct the TextElement class.
   */
  constructor() {
    super('div');
    this.className = 'hcje-text';
  }

  /**
   * Get the innerText property of the underlying element.
   * @returns {string}
   */
  get innerText() {
    return this._element.innerText;
  }

  /**
   * Set innerText property of underlying element.
   * @param {string} txt - text to write.
   */ 
  set innerText(txt) {
    this._element.innerText = txt;
  }

  /**
   * Set markdown. This converts the text from markdown to HTML and then updates the innerHtml.
   * @param {string} markdown - the text to format and write.   */
  setMarkdown(markdown) {
    this._element.innerHTML = parseMarkdown(markdown);
  }
}

/** Standard keyboard repeat delay in milliseconds @type {number} */
const SIM_KBD_REPEAT_DELAY = 44;
/** Standard key board repeat interva in milliseconds @type {number} */
const SIM_KBD_REPEAT_INTERVAL = 33;

/** 
 * Interval for button repeats.
 * @typedef {Object} ButtonRepeatInterval
 * @property {number} delay - delay for first repeat.
 * @property {number} repeat - interval between subsequent repeats.
 */

/** Simulated keyboard interval @type {module:hcje/domTools~ButtonRepeatInterval} */
export const SIM_KBD_INTERVAL = {delay: 750, repeat: 33};

/**
 * Class to handle button repeats.
 */
class ButtonRepeater {
  /** @type {function} */
  #callback;
  /** @type {module:hcje/domTools~ButtonRepeatInterval} */
  #interval;
  /** @type {number} */
  #intervalId;
  /** @type {number} */
  #timeoutId;


  /**
   * Constuct the repeater.
   * @param {module:hcje/domTools~button} button - the button dispatching the event.
   * @param {Object} interval
   * @param {number} interval.delay - the delay for the first event.
   * @param {number} interval.repeat - the time between subsequent events.
   * @param {function()} callback - the function to call when the button is held down.
   */
  constructor(button, interval, callback) {
    console.debug(`Button repeat  interval`, interval);
    this.#interval = interval;
    this.#callback = callback;
    button.addEventListener('pointerdown', () => {console.debug('Pointer down');this.#start();});
    button.addEventListener('pointerup', () => {console.debug('Pointer up');this.#end();});
    button.addEventListener('pointercancel', () => {console.debug('Pointer cancel');this.#end();});
    button.addEventListener('pointerleave', () => {console.debug('Pointer leave'); this.#end();});
    button.addEventListener('touchmove', (evt) => {console.debug('Touch move'); evt.preventDefault();});
  }

  /**
   * Start the repetitions. This call introduces a delay before the repetition begins.
   */
  #start() {
    this.#callback();
    this.#timeoutId = setTimeout(() => {
      this.#timeoutId = undefined;
      this.#repeat();
    }, this.#interval.delay);
  }
  /**
   * Send notification to callback at the repeat rate.
   */
  #repeat() {
    this.#callback();
    this.#intervalId = setInterval(() => this.#callback(), this.#interval.repeat);
  }

  /**
   * End the repetition. This handles the timeout and interval ids separately, although as the id share the same pool,
   * they could have shared the same property. They have only be separated for clarity; see 
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/clearInterval}.
   */
  #end() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
    } else {
      clearInterval(this.#intervalId);
    }
  }
}

/**
 * Button which wraps a standard HTMLButtonElement and provides additional control over the presentation, especially
 * when used as a toggle button.
 */
export class Button extends ElementWrapper {
  /** Button element @type {HTMLButtonElement} */
  #button;
  /** Repeater for buttons that repeat their actions like keys. @type {ButtonRepeater} */
  #buttonRepeater;
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
    
    this._element.tabindex = 0;
    this.#baseClass = this.#toggleButton ? 'hcje-toggle-button' : 'hcje-button';
    this._element.className = this.#baseClass;
    if (config.className) {
      this._element.classList.add(config.className);
    }
    this._element.classList.add(`${this.#baseClass}-${config.url ? 'image' : 'text'}`);

    if (config.url) {
      this.#icon = createChild(this._element, 'img', `${this.#baseClass}__icon`);
    } else {
      this._elementText = createChild(this._element, 'div', `${this.#baseClass}__label`);
    }
    this.#setButtonFace();
    this._element.title = config.label ?? '';

    config.parentElement?.appendChild(this._element);
    if (config.onClick && config.interval && !this.toggleButton) {
      this.#buttonRepeater = new ButtonRepeater(this, config.interval, config.onClick);
    }
    else if (config.onClick || this.#toggleButton) {
      this.addEventListener('click', (ev) => {
        if (this.#toggleButton) {
          this.#buttonOn = !this.#buttonOn;
          this.#setButtonFace();
        }
        config?.onClick(ev, this.#buttonOn);
      });
    }

    this.addEventListener('contextmenu', (ev) => ev.preventDefault());
    this.addEventListener('dragstart', (ev) => ev.preventDefault());
  }

  /**
   * Set the src and class names for the button appropriate to its current state.
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

  /**
   * GSet disabled state.
   * @returns {boolean}
   */
  get disabled() {
    return this._element.disabled;
  }
  /**
   * Set disabled state.
   * @param {boolean} disabled
   */
  set disabled(disabledState) {
    this._element.disabled = disabledState;
  }
}


/**
 * Base control. A control in this context is some eElement and an associated label held within a containing 
 * [HTMLDivElement]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement}. The basic structure
 * is shown below. Controls are expected to return a value by overriding the
 * {@link module:hcje/domTools~BaseControl#getValue} method.
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
   * Add a control element. Although multiple control elements can be added, only one is expected.
   * This method adds it after the label.
   * @param {Element | module:hcje/domTools~ElementWrapper} controlElement
   * @protected
   */
  _appendControlElement(controlElement) {
    this._element.append(ElementWrapper._toElement(controlElement));
  }
  
  /**
   * Add a control element. Although multiple control elements can be added, only one is expected.
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
 * Button control. This is effectively just a [Button]{@link module:hcje/domTools~Button} with an associated label.
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
 * Checkbox control. Simple implementation of a checkbox.
 */
export class CheckboxControl extends BaseControl {
  /** Checkbox element @type {Element} */
  #box;
  /** State of button @type {boolean} */
  #checked;
  /** Function called on change @type {function(boolean)} */
  #onChange;
  /** Class name when checked @type{string} */
  #checkedClassName;


  
  /**
   * Construct the checkbox
   * @param {Object} config
   * @param {string} config.label
   * @param {boolean} config.initialValue - true if checked
   * @param {boolean} config.tick - true if a tick should be used in place of a cross.
   * @param {function(newState:boolean)} onChange - function called if state changes.
   *
   */
  constructor(config) {
    super('hcje-checkbox-control', config);

    this.#box = document.createElement('div');
    this.#box.className  ='hcje-checkbox-control__box';
    this.#checkedClassName = `hcje-checkbox-control__box--checked-${config.tick ? 'tick' : 'cross'}`;
    this.#onChange = config.onChange;
    this.#box.addEventListener('click', () => {
      this.#setState(!this.#checked)
      this.#onChange?.(this.#checked);
    });
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
      this.#box.classList.add(this.#checkedClassName);
      this.#box.classList.remove('hcje-checkbox-control__box--unchecked');
    } else {
      this.#box.classList.remove(this.#checkedClassName);
      this.#box.classList.add('hcje-checkbox-control__box--unchecked');
    }
  }
  
  /**
   * Get checked state.
   * @returns {boolean} true if checked.
   */ 
  getValue() {
    return this.#checked;
  }
}

/**
 * Constraint function for input controls. This is called on the **input** event and should return 
 * the constrained value. Typically, if the currentInput fails the constraint requirements, the
 * lastValidInput is returned.
 *
 * @callback ConstrainInput
 * @param {string} lastValidInput - the last value which satisified the constraint.
 * @param {string} currentInput - the current value.
 * @returns {string} the constrained value.
 */ 

/**
 * Input control
 */
export class InputControl extends BaseControl {
  #input;
  #lastValidInput;

  /**
   * Construct the input control.
   * For details on the configuration options, see 
   * [{@link https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/text}
   * @param {Object} config
   * @param {Element} config.parentElement - element to attach to.
   * @param {string} config.label - label for spinner control
   * @param {number} [config.initialValue = 0] - initial value.
   * @param {number} maxLength - maximum length of the input
   * @param {number} minLength - minimum length of the input
   * @param {string} placeholder - hint for input.
   * @param {function(value:string)} onChange - function to call on change.
   * @param {module:hcje/domTools~ConstrainInput|string} constrain - function to call on input. 
   * If a string is provided, it should be the name of an in-built function: FLOAT or INT. (case insensitive)
   * If an initial value and constraint are provided, the initial value is passed via the constaint function before use.
   */ 
  constructor(config) {
    super('hcje-input-control', config);
    this.#input = document.createElement('input');
    this.#input.className = 'hcje-input-control__input';
    //this.#input.maxLength = config.maxLength ?? undefined;
    //this.#input.minLength = config.minLength ?? undefined;
    this.#input.placeHolder = config.placeholder;
    this.#input.value = config.initialValue ?? '';
    if (config.onChange) {
      this.#input.addEventListener('change', (evt) => {
        config.onChange(this.#input.value);
      });
    }
    this.#lastValidInput = this.#input.value;
    const constraintFunction = this.#getConstraintFunction(config.constrain);
    if (constraintFunction) {
      this.#input.value = constraintFunction(this.#input.value);
      this.#lastValidInput = this.#input.value;
      this.#input.addEventListener('input', (evt) => {
        this.#input.value = constraintFunction(this.#lastValidInput, this.#input.value);
        this.#lastValidInput = this.#input.value;
      });
    }
    this._appendControlElement(this.#input);
  }

  /**
   * Regex constraint
   * @param {RegExp} regex - regex to test input against.
   * @param {string} lastValidInput - last valid input.
   * @param {string} currentInput - current input.
   * @returns {string}
   */
  constrainToRegex(regex, lastValidInput, currentInput) {
    console.debug(`Test ${currentInput}. Last valid = ${lastValidInput}`);
    return regex.test(currentInput) ? currentInput : lastValidInput;
  }

  
  /**
   * Get a suitable constraint function based on the constraint value.
   * If a string is provided, it needs to be either INT or FLOAT to use an in-build function.
   * Otherwise it is assumed to be a constraint function itself and is returned as is.
   * @param {module:hcje/domTools~ConstrainInput|RegExp|string} constrain - function to call on input. If a **RegExp**
   * is provided, input is constrained to match the regular expression. If a string is provided, it should match an
   * inbuilt function of 'FLOAT', '+FLOAT', 'INT', or '+INT'. If not a regular expression or string, 
   * it should be constrain function which will be returned as is.
   * @returns {module:hcje/domTools~ConstrainInput}
   */ 
  #getConstraintFunction(constrain) {
    if (constrain instanceof RegExp) {
      return (lastValid, current) => this.constrainToRegex(constrain, lastValid, current);
    } else if (typeof constrain === 'string') {
      switch (constrain.toUpperCase()) {
        case 'FLOAT': 
          return (lastValid, current) => this.constrainToRegex(/^[+-]?\d*[.]?\d*$/, lastValid, current);
        case '+FLOAT':
          return (lastValid, current) => this.constrainToRegex(/^[+]?\d*[.]?\d*$/, lastValid, current);
        case 'INT':
          return (lastValid, current) => this.constrainToRegex(/^[+-]?\d*$/, lastValid, current);
        case '+INT':
          return (lastValid, current) => this.constrainToRegex(/^[+]?\d*$/, lastValid, current);
        default: 
          console.error(`Invalid constraint function ${constraintValue} ignored.`);
          return;
      }
    }
    return constrain;
  }
  
  /**
   * Get current value as string.
   * @returns {string}
   */ 
  getValue() {
    return this.#input.value;
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
   * @param {function(number): string} format - takes the value and returns formated value. This is called before
   *   onChange
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
      label: config.downLabel ?? '-',
      className: 'hcje-spinner-control__inner__down-button',
      onClick: () => this.#setValueAndNotify(this.#value - this.#step)
    }) 

    this.#valueElement = createChild(innerContainer, 'div', 'hcje-spinner-control__inner__value');

    this.#upButton = new Button({
      parentElement: innerContainer, 
      url: config.upImage,
      label: config.upLabel ?? '+',
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
  onOpen;
  /** Function called when menu opened. @type {function()} */
  onClose;




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
    this.onOpen = config.onOpen;
    this.onClose = config.onClose;
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
        this.onOpen?.();
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
        this.onClose?.();
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
    this.onClose?.();
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
 * @property {string} id - id of the button used as the dialog's return value
 * @property {string} url - path to the image used on the button
 * @property {string} label label of the button.
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
 * @param {string} config.title - title written in the dialog's title bar.
 * @param {string} [config.className] - additional class to apply.
 * @param {string} [config.markdown] - the body. If set, overrides the text option.
 * @param {string} [config.text] - body text.
 * @param {Array<module:hcje/domTools~ElementWrapper|Element>} [config.children] - add as children to dialog.
 * @param {Array<module:hcje/domTools~DialogButtonDefn>} config.buttonDefns - buttons placed at the bottom of the dialog 
 * and close it. If no label is provided, the ID is used. 
 * @returns {Promise} fulfils to id of button that closed the dialog.
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
  document.body.appendChild(mask);
  document.body.appendChild(box);

  const promises = [];
  for (const defn of config.buttonDefns) {
    const button = new Button({
      parentElement: buttonBar,
      url: defn.url,
      label: defn.label ?? defn.id,
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
    if (promises.length === 1) {
      button.focus();
    }
  }
  
  mask.style.zIndex = BASE_Z_INDEX + existingDialogs * 2;
  box.style.zIndex = BASE_Z_INDEX + existingDialogs * 2 + 1;
  return Promise.any(promises);
}



/**
* GameArea object which encapsulates the dynamic game area. 
* This area is a div which is centred on screen and then scaled to ensure it fits the screen or parent element.
*/
export class GameArea extends ElementWrapper {
  /** Design width @type {number} */
  #width;
  /** Design height @type {number} */
  #height;
  /** Element in which game area should fit. @type {Element} */
  #fitWithin;
  /** Was the fitWithin element created @type {boolean} */
  #internalContainer;
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
    super('div');
    if (config.fitWithin) {
      this.#fitWithin = config.fitWithin;
      this.#internalContainer = false; 
    } else {
      this.#fitWithin = createChild(document.body, 'div', 'hcje-game-area-container hcje-fullscreen');
      this.#internalContainer = true; 
    }

    this.appendTo(this.#fitWithin);

    this.className = 'hcje-game-area';
    console.log(`GameArea element ${this._element}`);
    this._element.style.width = `${config.width}px`;
    this._element.style.height = `${config.height}px`;
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
      this._element.style.top = `${this.#margin + 0.5 * this.#height * (scale - 1) }px`; 
      this._element.style.transform = `translate(-50%) scale(${scale})`;
    } else {
      this._element.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    console.debug(`Game area size: design [${this.#width}x${this.#height} at scale of ${scale.toFixed(2)};`);
  }
  
  /**
   * Get the design bounds.
   * @returns {module:utils~RectData}
   * @readonly
   */
  get designBounds() { 
    return {x: 0, y: 0, width: this.#width, height: this.#height}; 
  }
  
  /**
   * Get the design dimensions.
   * @returns {module:utils~Dimensions}
   * @readonly
   */
  get designDims() { 
    return {width: this.#width, height: this.#height}; 
  }

  /**
   * Get the scaled dimensions.
   * @returns {module:utils~Dimensions}
   * @readonly
   */
  get scaledDims() {
    return {width: this.#width * scale, height: this.#height * scale}; 
  }

  /**
   * @borrows module:hcje/domTools~ElementWrapper#remove
   */
  remove() {
    super.remove();
    if (this.#internalContainer) {
      this.#fitWithin.remove();
    }
  }
} 

/**
 * Indicator for showing progress.
 * @interface BusyIndicator
 */

/**
 * Start the indicator.
 * This should only be called once. Calling start multiple times results in an error being thrown.
 * @function module:hcje/domTools~BusyIndicator#start
 * @throws {Error}
 */

/**
 * End the busy indicator. If there is an associated timeout, this is cleared. Once **end** has been called
 * the instance has no further use as a **BusyIndicator**.
 * @function module:hcje/domTools~BusyIndicator#end
 */

/**
 * Busy indicator that displays an indicator on the DOM. It includes a timeout that defaults to 15 seconds
 * @implements module:hcje/domTools~BusyIndicator
 */ 
export class TimeLimitedBusyIndicator {
  /** Visual indicator @type {Element} */
  #element;
  /** Aria label @type {string} */
  #label;
  /** Timeout in seconds @type {number} */
  #timeoutS;
  /** Timeout message @type {string} */
  #timeoutMessage;
  /** Timeout timer id @type {number} */
  #timerId;
  /** Started flag @type {boolean} */
  #started;

  /**
   * Create a busy indicator.
   * The indicator automatically added to the DOM. If the timeoutSeconds are > 0, then the **end** must be called
   * otherwise the user will be offered the chance to navigate back in history or reload.
   * @param {Object} options
   * @param {string} [options.label = 'Busy'] - added as an **aria-label**.
   * @param {number} options.timeoutS - timeout in seconds.
   * @param {string} options.timeoutMessage - message to display on timeout. This should include a prompt that that
   * if OK is selected the page will wait and if cancel is selected the page will reload.
   * The default message, with no translation, is
   * "The last action is taking too long. Do you want to wait? If you cancel, the game will reload.";
   */ 
  constructor(options) {
    this.#label = options.label ?? 'Busy';
    this.#timeoutS = options.timeoutS ?? 15;
    this.#timeoutMessage = options.timeoutMessage ??
        'The last action is taking too long. Do you want to wait? if you cancel, the game will reload.';
    this.#started = false;
  }

  /**
   * Create the busy indicator.
   */
  #createIndicator() {
    this.#element = createChild(document.body, 'progress', 'hcje-busy-indicator');
    this.#element.setAttribute('aria-label', this.#label);
  }

  /**
   * Activate the timeout handler. If a timeout occurs, the confirm dialog displaye the timeout message.
   * If cancel is selected, the page reloads, otherwise the timeout handler is reactivated.
   */
  #activateTimeoutHandler() {
    this.#timerId = setTimeout(() => {
      console.warn(`Timeout occured. Ask user for next action: ${this.#timeoutMessage}`);
      if (confirm(this.#timeoutMessage)) {
        console.debug('User selected to keep waiting.');
        this.#activateTimeoutHandler();
      } else {
        console.debug('User selected to reload.');
        location.reload();
      }
    }, this.#timeoutS * 1000);
  }

  /**
   * @borrows module:hcje/domTools~BusyIndicator#start
   */
  start() {
    if (this.#started) {
      throw new Error('Attempt made to restart a BusyIndicator');
    }
    this.#started = true;
    this.#createIndicator();
    if (this.#timeoutS > 0) {
      this.#activateTimeoutHandler();
    }
  }
  /**
   * @borrows module:hcje/domTools~BusyIndicator#start
   * The instance has no further use and should be discarded.
   */
  end() {
    clearTimeout(this.#timerId);
    this.#element.remove();
  }
}


