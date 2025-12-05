/* Copyright 2025 Steve Butler (henspace.com)
 * License: MIT
 */
import * as utils from './utils.js';export function switchScene(fragmentHtmlUrl) {return utils.fetchText(fragmentHtmlUrl,`<p>Could not load ${fragmentHtmlUrl}</p>`).then((result) => {document.body.innerHTML = result;})}