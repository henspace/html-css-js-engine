/**
 * MIT license
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
 * @module hcjeTools/build/build
 * @description
 * Script for building the source and intended to be run under Node.js.
 * The size of the resulting script is reduced by removing comments and leading and
 * trailing spaces.
 *
 * Usage:
 * + build configFile
 *     + configFile: the configuration file; see below.
 *
 * ## Configuration file
 * The script should be passed the path to a configuration file as the only command line argument.
 * This is used to control the output. The configuration file is a JSON representation of a
 * [ConfigurationOptions]{@link module:hcjeTools/build/build~ConfigurationOptions} object.
 *
 * ## Template strings
 *
 * When html, js, or md files are processed, the following predefined template strings are replaced. They are all
 * case-sensitive.
 *
 * +  **%%\_AUTHOR\_%%** replaced by **author** field  from package.json
 * +  **%%\_BUILD\_DATE\_ISO\_%%** replaced by date of the build in ISO format.
 * +  **%%\_BUILD\_YEAR\_%%** replaced by year of the build.
 * +  **%%\_BUILD\_ID\_%%** replaced by a short code based on the date and time of the build.
 * +  **%%\_DESCRIPTION\_%%** replaced by the **description** property from package.json.
 * +  **%%\_DISPLAY\_NAME\_%%** replaced by the **_customHcje.displayName** property from package.json
 * +  **%%\_LICENCE\_%%** or %%\_LICENSE\_%% replaced by the **license** property from package.json.
 * +  **%%\_NAME\_%%** replaced by the **name** property from package.json
 * +  **%%\_VERSION\_%%** replaced by the **version** property from package.json.
 * 
 * Custom template variables can be created by adding custom template values to the package's 
 * `_customHcje.templateVariables` property. This property should be an array of replacement objects, each with a 
 * name and value. The name is converted to a template name by adding `%%_` at the front and `_%%` at the end. For
 * example:
 *
 * ```
 * "customHcje" {
 *  "templateVariables": [
 *    {"name": "MY_NAME", "value": "John Doe"}
 *  ]
 * }
 * ```
 * 
 * The entry above would result in `%%_MY_NAME_%%` being replaced with `John Doe`.
 **/

/**
 * @typedef {Object} ReplacementDefn
 * @property {RegExp|string} pattern - regular expression or string to match.
 * @property {string} replacement - replacement text which can include capture groups. 
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace}
 */

/** 
 * Configuration object.
 * @typedef {Object} ConfigurationOptions
 * @property {string} outputDir - Path to where the resulting files will be copied. Only ./build or ./docs are permitted.
 * @property {string} subDir - If provided, the build will be placed in **outputDir/subDir**.
 * @property {string} zippedOutputDir - Path to where a zipped copy of the build output will be placed.
 *   This will include the version from package.json in the file name. Note, if a subdir is provided, this will
 *   contain the contents of **outputDir/subDir** not **outputDir**. This directory is relative to the package.
 * @property {string} readme - Path to a readme file that is written to the **outputDir**. This is written pre-build,
 *   so if the source folder (root) also contains a readme file, and the **subDir** option is not set, the readme
 *   will be overwritten. It will be renamed to README.md when copied.
 * @property {string} root - Path to the source folder containing the files to copy to the **outputDir**.
 *
 * @property {Object} filter - Detail of filters to restrict the files copied to the output.
 * @property {Object} filter.includeFiles - Regular expression detail. Only file names matching the regular expression 
 *   are included. The regular expression is created as `new RegExp(regex, flags)`.
 * @property {string} filter.includeFiles.regex - The string that forms the regular expression.
 * @property {string} filter.includeFiles.flags - Any flags to use with the regular expression.
 * 
 * @property {Object} filter.excludeFiles - Regular expression detail. Any file names matching the regular expression are excluded.
 * @property {string} filter.excludeFiles.regex - The string that forms the regular expression.
 * @property {string} filter.excludeFiles.flags - Any flags to use with the regular expression.
 *  
 * @property {Object} filter.excludeDirs - Regular expression detail. Any directory names matching the regular expression are excluded.
 * @property {string} filter.excludeDirs.regex - The string that forms the regular expression.
 * @property {string} filter.excludeDirs.flags - Any flags to use with the regular expression.
 *
 * @property {Object} parserConfig - Additional detail added to the output for specific file types:
 * @property {Object} parserConfig.html - Additional text for html files:
 * @property {string} parserConfig.html.prefix - Text added at the beginning of the output.
 * @property {module:hcjeTools/build/build/ReplacementDefn[]} parseConfig.html.replacements - text replacements.
 *
 * @property {Object} parserConfig.js - Additional text for JavaScript files:
 * @property {string} parserConfig.js.prefix - Text added at the beginning of the output.
 * @property {module:hcjeTools/build/build/ReplacementDefn[]} parseConfig.js.replacements - text replacements.
 *
 * @property {Object} parserConfig.md - Additional text for Markdown files:
 * @property {string} parserConfig.md.prefix - Text added at the beginning of the output.
 * @property {module:hcjeTools/build/build/ReplacementDefn[]} parseConfig.md.replacements - text replacements.
 *
 * @property {module:hcjeTools/build/build/ZipOptions} zipOptions - Zip options for different platforms. 
 */

/**
 * @typedef {Object} ZipDetail
 * @property {string} cmd - The command to create the zip file. 
 * The text values **${zipOutputFile}** and  **${zipSourceFiles}** are respectively replaced by the path to
 * the resulting zip file and the path to the files that should be zipped.
 * @property {boolean} cd - Should the current working directory be changed to the location of the source files to be
 *   zipped when running the zip command.
 */

/**
 * @typedef{Object<string, module:hcjeTools/build/build/ZipDetail} ZipOptions - Zip options where the keys should 
 *  match the [process.platform]{@link https://nodejs.org/api/process.html#processplatform} variable.
 */

import * as fsPromises from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import * as process from 'node:process';

/**
 * Show usage.
 * @param {string} message
 * @private
 */
function showUsageAndExit(message) {
  console.error(message);
  console.error('\nUsage: build configFile');
  process.exit(1);
}

/** 
 * Replace template variables with information from package details.
 * Template variables begin are enclosed between %%_ and _%% characters.
 * @param {string} data - the string to process
 * @param {Object} packageDetails - details from package.json
 * @returns {string} data with template variables replaced.
 * @private
 */
function replaceTemplateVariables(data, packageDetails) {
  const date = new Date();
  data = data.replace(/%%_AUTHOR_%%/g, packageDetails.author);
  data = data.replace(/%%_BUILD_DATE_ISO_%%/g, date.toISOString().substring(0, 10));
  data = data.replace(/%%_BUILD_YEAR_%%/g, date.getFullYear());
  data = data.replace(/%%_BUILD_ID_%%/g, date.valueOf().toString(36));
  data = data.replace(/%%_DESCRIPTION_%%/g, packageDetails.description);
  data = data.replace(/%%_LICEN[CS]E_%%/g, packageDetails.license);
  data = data.replace(/%%_NAME_%%/g, packageDetails.name);
  data = data.replace(/%%_VERSION_%%/g, packageDetails.version);
  
  data = replaceCustomTemplateVariables(data, packageDetails);
  return data;
}


/**
 * Replace custom template variables. It runs through custom template values in the package's 
 * `_customHcje.templateVariables` property. This property should be an array of replacement objects, each with a 
 * name and value. The name is converted to a template name by adding `%%_` at the front and `_%%` at the end.
 * @param {string} data - the string to process.
 * @param {Object} packageDetails - the object form of package.json.
 * @returns {string}
 * @private
 */
function replaceCustomTemplateVariables(data, packageDetails) {
  const replacements = packageDetails._customHcje?.templateVariables;
  if (!replacements) {
    return data;
  }
  for (const replacement of replacements) {
    data = data.replace(`%%_${replacement.name}_%%`, replacement.value);
  }
  return data;
}

/**
 * Implement all replacements defined in array of replacement definitions.
 * @param {string} data - the string to process.
 * @param {module:hcjeTools/build/build/ReplacementDefn[]} replacements - text replacements.
 * @returns {string}
 * @private
 */
function implementReplacements(data, replacements) {
  if (!replacements) {
    return data;
  }
  for (const replacementDefn of replacements) {
    if (replacementDefn.pattern) {
      data = data.replace(replacementDefn.pattern, replacementDefn.replacement);
    } else {
      console.error(`Replacement definition found with no pattern property.`);
    }
  }
  return data;
}

/**
 * Reduce size of js file.
 * @param {string} data - data to parse 
 * @param {Object} config - configuration options
 * @param {string} config.prefix - added to start of content
 * @param {module:hcjeTools/build/build/ReplacementDefn[]} config.replacements - text replacements.
 * @param {Object} packageDetails - details from package.json
 * @param {module:hcjeTools/build/build/ReplacementDefn[]} replacements - text replacements.
 * @returns {string}
 * @private
 */ 
function parseJs(data, config, packageDetails) {
    data = data.replace(/(?:^|[\r\n\t]) *\/\*.*?\*\//gs, '');
    data = data.replace(/^\s+/gm, '');
    data = data.replace(/\s+$/gm, '');
    data = config.prefix + data;
    data = implementReplacements(data, config.replacements); 
    return replaceTemplateVariables(data, packageDetails);
}

/**
 * Parse markdown file replacing template variables.
 * @param {string} data - data to parse 
 * @param {Object} config - configuration options
 * @param {string} config.prefix - added to start of content
 * @param {module:hcjeTools/build/build/ReplacementDefn[]} config.replacements - text replacements.
 * @param {Object} packageDetails - details from package.json
 * @param {module:hcjeTools/build/build/ReplacementDefn[]} replacements - text replacements.
 * @returns {string}
 * @private
 */ 
function parseMarkdown(data, config, packageDetails) {
    data = config.prefix + data;
    data = implementReplacements(data, config.replacements); 
    return replaceTemplateVariables(data, packageDetails);
}

/**
 * Parse html file replacing template variables.
 * @param {string} data - data to parse 
 * @param {Object} config - configuration options
 * @param {string} config.prefix - added to start of content
 * @param {module:hcjeTools/build/build/ReplacementDefn[]} config.replacements - text replacements.
 * @param {Object} packageDetails - details from package.json
 * @returns {string}
 * @private
 */ 
function parseHtml(data, config, packageDetails) {
    data = config.prefix + data;
    data = implementReplacements(data, config.replacements); 
    return replaceTemplateVariables(data, packageDetails);
}


/**
 * Copy file through a parser.
 * @param {string} filePath - file to copy
 * @param {string} destFile - destination file
 * @param {Object} options
 * @param {function} options.parser - function that will parse the file
 * @param {Object} options.config - configuration options for parser
 * @param {Object} options.packageDetails - details from package.json
 * @returns {Promise}
 * @private
 */
function copyAndParse(filePath, destFile, options) {
  return fsPromises.readFile(filePath, {encoding: 'utf-8'})
    .then((contents) => {
      contents = options.parser(contents, options.config,
        options.packageDetails) ;
      return contents;  
    })
   .then((data) => {
      return fsPromises.writeFile(destFile, data, {
          encoding: 'utf-8', 
          flush: true,
      });
   })

}
/**
 * Copy file to output directory.
 * @param {string} filePath - path to file
 * @param {string} targetDir - target directory
 * @param {Object} options
 * @param {Object} options.parserConfig - options for parsers
 * @param {Object} options.packageDetails - node package information
 * @param {string} options.targetFilename - defaults to original name
 * @returns {Promise}
 * @private
 */
function copyFile(filePath, targetDir, options) {
  console.log(`Copy file ${filePath} to ${targetDir}`);
  const targetFilename = options?.targetFilename || path.basename(filePath);
  const destination = path.join(targetDir, targetFilename);
  const extension = path.extname(filePath).toLowerCase();
  let parserOptions;
  switch (extension) {
    case '.html': parserOptions = {
        parser: parseHtml,
        config: options.parserConfig.html,
        packageDetails: options.packageDetails
      };
      break;
    case '.js': parserOptions = {
        parser: parseJs,
        config: options.parserConfig.js,
        packageDetails: options.packageDetails
      };
      break;
    case '.md': parserOptions = {
        parser: parseMarkdown,
        config: options.parserConfig.md,
        packageDetails: options.packageDetails
      };
      break;

  }
  if (parserOptions) {
    return copyAndParse(filePath, destination, parserOptions);
  } else {
    return fsPromises.copyFile(filePath, destination);
  }
}

/**
 * Remove directory. It's contents are removed but the directory will remain.
 * @param {*} path - path to directory to remove.
 * @returns Promise which fulfils to undefined on success.
 * @private
 */
function removeDir(path) {
  return fsPromises.rm(path, { force: true, recursive: true });
}

/**
 * Copy directory to output directory. The name of the source 
 * directory is added to the target so that the original structure is 
 * maintained. If the directory does not exist, it's created.
 * @param {string} sourceDir - source directory
 * @param {string} targetDir - target directory
 * @param {Object} options
 * @param {RegExp} options.includeFiles - Filter for file names. Only these are included.
 * @param {RegExp} options.excludeFiles - Filter for file names. These are excluded.
 * @param {RegExp} options.excludeDirs - Filter for directories that are excluded.
 * @param {Object} options.parserConfig - Options for parsers.
 * @param {Object} options.packageDetails - Node package information
 * @returns {Promise}
 * @private
 */
async function copyDirectory(sourceDir, targetDir, options) {
  console.log(`Copy directory ${sourceDir} to ${targetDir}`);
  const exists = await existsSync(targetDir);
  if (!exists) {
    console.log(`Create ${targetDir}`);
    await mkdirSync(targetDir, {recursive: true});
  }
  return fsPromises.readdir(sourceDir, {
      encoding: 'utf-8',
      withFileTypes: true,
      recursive: false
    })
    .then((result) => {
      const promises = [];
      for (const dirent of result) {
        const direntPath = path.join(sourceDir, dirent.name);
        if (dirent.isFile()) {
          if (options.includeFiles?.test(dirent.name) && !options.excludeFiles?.test(dirent.name)) {
            promises.push(copyFile(direntPath, targetDir, options));
          } else {
            console.log(`Ignore ${dirent.name}`);
          }
        } else if (dirent.isDirectory()) {
          if (options.excludeDirs?.test(dirent.name)) {
            console.log(`Ignore directory ${dirent.name}`);
          } else {
            const destinationDir = path.join(targetDir, dirent.name);
            promises.push(copyDirectory(direntPath, destinationDir, options));
          }
        }
      }
      return Promise.all(promises);
    }) 
}


/**
 * Copy directories to output directories. The name of the source 
 * directory is added to the target so that the original structure is 
 * maintained. If the directory does not exist, it's created.
 * @param {string[]} sourceDirs - source directories
 * @param {string[]} targetDirs - target directories (length must match sourceDirs)
 * @param {Object} options
 * @param {RegExp} options.includeFiles - Filter for file names. Only these are included.
 * @param {RegExp} options.excludeFiles - Filter for file names. These are excluded.
 * @param {RegExp} options.excludeDirs - Filter for directories that are excluded.
 * @param {Object} options.parserConfig - Options for parsers.
 * @param {Object} options.packageDetails - Node package information
 * @returns {Promise}
 * @private
 */
async function copyDirectories(sourceDirs, targetDirs, options) {
  if (sourceDirs.length != targetDirs.length) {
    throw new Error("Cannot copy directories as source and target directories lengths are different.");
  }
  for (let index = 0; index < sourceDirs.length; index++) {
    await copyDirectory(sourceDirs[index], targetDirs[index], options);
  }
  return Promise.resolve();
}

/**
 * Compress folder. 
 * The zip command is executed. The ${zipSourceDir} and ${zipOutputDir} parameters are replaced by the sourceDir and
 * outputDir parameters.
 * @param {module:hcjeTools/build/build/ZipOptions} zipOptions - options to create the zip file
 * @param {string} sourceFiles - path to the files to zip. This is relative to the package script.
 * @param {string} outputFile - path to the resulting zip file. This is relative to the package script. 
 * @returns {Promise}
 * @private
 */
function compressFolder(zipOptions, sourceFiles, outputFile) {
  const zipPlatform = zipOptions[process.platform];
  if (!zipPlatform) {
    console.error(`No suitable zip options found for the ${process.platform} platform.`);
    return Promise.resolve()  ;
  }
 
  if (!zipPlatform.cmd) {
    console.error(`No suitable zip command found for the ${process.platform} platform.`);
    return Promise.resolve()  ;
  }
  
  let options = { encoding: 'utf-8' };
  if (zipPlatform.cd) {
    console.log(`Run zip in ${sourceFiles}`);
    options.cwd = sourceFiles;
    outputFile = path.relative(sourceFiles, outputFile);
  }

  let cmd = zipPlatform.cmd.replace(/\${zipSourceFiles}/g, sourceFiles);
  cmd = cmd.replace(/\${zipOutputFile}/g, outputFile);
  const cwd = zipPlatform.cwd || '.';
  console.log(`Zip command: ${cmd}`);


  return new Promise((resolve) => exec(cmd, options, (err, stdout, stderr) => {
    if (err) {
      console.error(`Failed to compress ${sourceFiles}: ${err.message}`);
    } else {
      console.log(stdout);
    }
    resolve();
  })); 
}

/**
 * Create a zip file.
 * @param {string} folderToZip - the directory containing the files to zip.
 * @param {string} zippedOutputDir - directory in which the fil should be placed.
 * @param {module:hcjeTools/build/build/ZipOptions} zipOptions - options for zip files from the configuration file.
 * @private
 */ 
function createZipFile(folderToZip, zippedOutputDir, zipOptions) {
  if (zippedOutputDir && zipOptions) {
    return fsPromises.mkdir(options.zippedOutputDir, {recursive: true})
      .then(() => {
        const zipName = (`${packageDetails.name}_${packageDetails.version}`
            .replace(/[.]/g, '_')).toLowerCase();
        return compressFolder(options.zipOptions, folderToZip, path.join(options.zippedOutputDir, zipName));
      });
  } else {
    console.log("No zip file created. To create a zip file both zippedOutputDir and zipOptions need to be set in the configuration file.");
    return Promise.resolve();
  }
}


/**
 * Details of the package. This will be taken from package.json
 * @type {Object}
 * @private
 */
let packageDetails;


// Execute build
if (process.argv.length < 3) {
  showUsageAndExit('Incorrect arguments.');
} 

let configFile = process.argv[2];

console.log(`Loading options from ${configFile}`);
let options;
let buildOutputDir;
let hcjeSubmoduleOutputDir;
let hcjeSubmoduleSourceDir;

const HCJE_DESTINATION_FOLDER_NAME = '_hcje'; 
const HCJE_SUBMODULE_NAME = 'html-css-js-engine';

fsPromises.readFile('package.json', {encoding: 'utf-8'})
  .then((json) => {
    packageDetails = JSON.parse(json);
  })
  .then(() => fsPromises.readFile(configFile, {encoding: 'utf-8'}))
  .then((json) => {
    options = JSON.parse(json);
    buildOutputDir = options.outputDir;
    if (options.subDir) {
      buildOutputDir = path.join(buildOutputDir, options.subDir);
    }
    hcjeSubmoduleSourceDir = path.join(options.root, HCJE_SUBMODULE_NAME, 'source', 'hcje');
    console.log(`Looking for submodule source in ${hcjeSubmoduleSourceDir}`);
    if (existsSync(hcjeSubmoduleSourceDir)) {
      console.log('Submodule found.');
      hcjeSubmoduleOutputDir = path.join(buildOutputDir, HCJE_DESTINATION_FOLDER_NAME);
    } else {
      console.log('No submodule found.');
    }
  })
  .then(() => {
    if (!/^\.\/(?:build|docs)$/.test(options.outputDir)) {
      throw new Error(`Only ./build or ./docs supported as build directories. Will not delete or build to ${options.outputDir}.`);
    }
    return removeDir(options.outputDir);
  })
  .then(() => fsPromises.mkdir(buildOutputDir, {recursive: true}))
  .then(() => {
    if (hcjeSubmoduleOutputDir) {
      mkdirSync(hcjeSubmoduleOutputDir)
      if (!options.parserConfig.html.replacments) {
        options.parserConfig.html.replacements = [];
      }
      options.parserConfig.html.replacements.push({
        pattern: new RegExp(`(\./)?${HCJE_SUBMODULE_NAME}/source/hcje/`, 'g'),
        replacement: `${HCJE_DESTINATION_FOLDER_NAME}/`
      });
    }
  })
  .then(() => {
    if (options.readme) {
      return copyFile(options.readme, options.outputDir, {
          parserConfig: options.parserConfig,
          packageDetails: packageDetails,
          targetFilename: 'README.md'
      })
    }
  })
  .then(() => {
    let includeFilesRegex;
    let excludeFilesRegex;
    let excludeDirsRegex;
    if (options.filter?.includeFiles) {
      includeFilesRegex = new RegExp(options.filter.includeFiles.regex, options.filter.includeFiles.flags);
    }
    if (options.filter?.excludeFiles) {
      excludeFilesRegex = new RegExp(options.filter.excludeFiles.regex, options.filter.excludeFiles.flags);
    }
    if (options.filter?.excludeDirs) {
      excludeDirsRegex = new RegExp(options.filter.excludeDirs.regex, options.filter.excludeDirs.flags);
    }
    const sourceDirs = [options.root];
    const targetDirs = [buildOutputDir];
    if (hcjeSubmoduleOutputDir) {
      sourceDirs.push(hcjeSubmoduleSourceDir);
      targetDirs.push(hcjeSubmoduleOutputDir);
    }
    return copyDirectories(sourceDirs, targetDirs, {
        includeFiles: includeFilesRegex,
        excludeFiles: excludeFilesRegex,
        excludeDirs: excludeDirsRegex,
        parserConfig: options.parserConfig,
        packageDetails: packageDetails
      });
  })
  .then(() => createZipFile(buildOutputDir, options.zippedOutputDir, options.zipOptions))
  .then(() => {
    console.log(`Build complete.`); 
  });




