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
 * @module hcje/translation
 * @description
 * Module for handling internationalisation.
 */

import * as utils from './utils.js'

/** 
 * Translation tags added to text when testing. These are just used for flagging strings that have
 * been translated. They are set by adding a query to the url.
 * @type {string}
 * @private
 */
let translationPrefix = '';
let translationSuffix = '';
let missingPrefix = '';
let missingSuffix = '';

if (new URLSearchParams(document.location.search).get('flag-translation') !== null) {
  translationPrefix = '[tx=';
  translationSuffix = ']';
  missingPrefix = '[tx? ';
  missingSuffix = ']';
}

/** Currently selected localisation.
 * @private
 */
let translations = {};


/**
 * Convert a url to a language version. Only applicable to json, txt or md files.
 * Add -XX to the base name where XX is the ISO 639 language code. Only urls for json, txt or md files are modified.
 *
 * For example, for the url 'https://henspace.com/myFile.md' and country code of 'en' the result would be 
 * 'https://henspace.com/myFile-en.md'.
 * @param {string} baseFile - Url for the translation.
 * @param {string} languageCode - ISO 639 language code to use with url.
 * @returns {string}
 */
function addLanguageCodeToUrl(baseUrl, languageCode) {
  return baseUrl.replace(/\.(json|txt|md)$/i,`-${languageCode}.$1`) 
}

/**
 * Get preferred language from the 
 * [navigator language]{@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language} property.
 * @returns {string}
 */
export function getPreferredLanguage() {
  return navigator.language.replace(/-\w*$/, '');
}

/**
 * Load the a file based on the language. 
 * Looks for a file called -XX.extension, where XX is the language code in lowercase.
 * The function takes the base name and affixes the language when searchingr;
 * so for the language **fr** and a base name of **i18n.json**, the function will
 * search for **i18n-fr.json** first, then falling back to **fallbackLanguageCode** on error.
 * @param {Object} config
 * @param {string} config.baseUrl - Url without any language identification.
 * @param {string} [config.languageCode] - two character
 *   [ISO-639 code]{@link https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes}.
 *   If not provided, fallsback to the user's preferred language.
 * @param {string} [config.fallbacklanguageCode = 'en'] - Language used if languageCode fails. 
 * @param {boolean} config.asJson - True if loading a json file.
 * @param {Array<string>} config.filter - If provided, only language codes in the 
 * filter will be checked. This does not filter the fallback. This should be an array of language codes for which a 
 *   translation exists.
 * @returns {Promise} Fulfils to a string or object depending on whether the json flag is true.
 */  
export function loadData(config) {
  let languageCode = config.languageCode || getPreferredLanguage();
  const fallbackLanguageCode = config.fallbackLanguageCode || 'en';

  if (config.filter && !config.filter.includes(languageCode)) {
    console.info(`Language filter does not include ${languageCode} so using fallback of ${fallbackLanguageCode}.`);
    languageCode = fallbackLanguageCode;
  }
  
  let url = addLanguageCodeToUrl(config.baseUrl, languageCode);
  return utils.fetchTextOrJson(url, config.asJson, null)
    .then((result) => {
      if (result) {
        console.info(`Loaded data in language ${languageCode} from ${url}`);
        return result;
      } else if (fallbackLanguageCode !== languageCode) {
        console.error(`Failed to load data in language ${languageCode} from ${url}; trying fallback ${fallbackLanguageCode}.`);
        url = addLanguageCodeToUrl(config.baseUrl, fallbackLanguageCode);
        return utils.fetchJson(url, config.asJon, null);
      } else {
        console.error(`Failed to load data in language ${languageCode} from ${url} and no fallback.`);
        return result;
      }
    });
}


/**
 * Load the language. Looks for a file called i18n-XX.json in the base folder,
 * where XX is the language code in lowercase. The function takes the base name and
 * affixes the language when searching; so for the language **fr** and a base name
 * of **i18n.json**, the function will search for **i18n-fr.json** first and fall
 * back to **fallbackLanguageCode** on error.
 * @param {Object} config
 * @param {string} config baseUrl - The url without any specific language identification.
 * @param {string} config.languageCode - Two character 
 *   [ISO-639 code]{@link https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes}.
 * @param {string} config.fallbackLanguageCode - Language to use if languageCode fails 
 * @param {Array<string>} config.filter - If provided, only language codes in the 
 * filter will be checked. This does not filter the fallback. This array should contain the language codes for which
 * a translation exists.
 * @returns {Promise} Fulfils to true if successful.
 */  
export function loadTranslation(config) {
  console.info(`Loading translations`);
  translations = {};
  return loadData({
      baseUrl: config.baseUrl,
      languageCode: config.languageCode,
      fallbackLanguageCode: config.fallbackLanguageCode, 
      filter: config.filter,
      asJson: true
    })
    .then((result) => {
      if (result) {
        translations = result;
        return true;
      } else {
        return false;
      }
    });
}




/**
 * Translate a key word. If no translation available, the key word is returned unchanged.
 * In order to help with debugging, the flag **flag-translation** can be 
 * added to query string of the url used to launch the app. If this exists in the search parameters, strings that 
 * are translated are enclosed within '[tx=' and ']'. If the string has been parsed but no translation
 * was found, the result is enclosed within '[tx?' and ']'. This allows easy identification of strings that have not
 * be parsed, strings that have been parsed but do not have a translation, and strings that have been parsed and
 * successfully translated.
 * @param {string} key - The text or key to translate.
 * @returns {string}
 */
export function translate(key) {
  if (key === '') {
    return key;
  } 
  let result = translations[key];
  if (result !== null && result !== undefined) {
    if (result === '') {
      result = key;
    }
    return `${translationPrefix}${result}${translationSuffix}`;
  } else {
    return `${missingPrefix}${key}${missingSuffix}`;
  }
}

/**
 * Tag function that will translate a template literal; see 
 * [Tagged templates]{https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates}.
 * See [translate]{@link module:hcje/translation.translate}. 
 *
 * To use, just add the i18n tag in front of a template literal. E.g. **i18n\`translate&nbsp;me\`**.
 * @param {Array<string>} strs - Array of strings from the template literal. 
 * @param {*} expressions - The results of the expressions in the template literal. 
 * @returns {string} Translated string
 */
export function i18n(strs, ...expressions) {
  let expIndex = 0;
  const result = [];
  for (const str of strs) {
    result.push(translate(str));
    if (expIndex < expressions.length) {
      result.push(`${expressions[expIndex++]}`);
    }
  }
  return result.join('');
}

