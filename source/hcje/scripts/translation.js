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
 * Module for handle internationalisation
 */

import * as utils from './utils.js'

/** Translation tag added to text when testing @type {string} */
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

/** currently selected localisation */
let translations = {};


/**
 * Convert a url to a language version. Only applicable to json, txt or md files.
 * Add -XX to the base name where XX is the ISO 639 language code.
 * @param {string} baseFile
 * @param {string} languageCode
 * @returns {string}
 */
function addLanguageCodeToUrl(baseUrl, languageCode) {
  return baseUrl.replace(/\.(json|txt|md)$/i,`-${languageCode}.$1`) 
}

/**
 * Get preferred language.
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
 * @param {string} config.baseUrl
 * @param {string} [config.languageCode] - two character ISO-639 codes 
 *  {@link https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes} if 
 *  not provided, fallsback to the user's preferred language.
 * @param {string} [config.fallbacklanguageCode = 'en'] - used if languageCode fails. 
 * @param {boolean} config.asJson - true if loading json.
 * @param {Array<string>} config.filter - if provided, only language codes in the 
 * filter will be checked. This does not filter the fallback.
 * @returns {Promise} fulfils to a string or object depend on whether the json flag
 * is true.
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
 * affixes the language when searchingr; so for the language **fr** and a base name
 * of **i18n.json**, the function will search for **i18n-fr.json** first falling
 * back to **fallbackLanguageCode** on error.
 * @param {Object} config
 * @param {string} config baseUrl
 * @param {string} config.languageCode - two character ISO-639 codes 
 *  {@link https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes}
 * @param {string} config.fallbackLanguageCode - used if languageCode fails 
 * @param {Array<string>} config.filter - if provided, only language codes in the 
 * filter will be checked. This does not filter the fallback.
 * @returns {Promise} fulfils to true if successful.
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
 * Translate a key word. If no translation available, the key word is returned.
 * @param {string} key
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
 * Tag function that will translate a template literal.
 * @param {Array<string>} strs
 * @param {*} expressions
 * @returns {string} template string
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

