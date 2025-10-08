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
 /*
 * Script for merging the script tag in an html file. The size of the resulting
 * script is reduced by removing comments and leading and trailing spaces.
 */
import * as fsPromises from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';

/**
 * Show usage.
 * @param {string} message
 */
function showUsageAndExit(message) {
  console.error(message);
  console.error('\nUsage: build configFile');
  process.exit(1);
}

/** 
 * Replace template variables with information from package details.
 * Template variables begin are enclosed between %%_ and _%% characters.
 * @param {string} data
 * @param {Object} packageDetails - details from package.json
 * @returns {string}
 */
function replaceTemplateVariables(data) {
  const date = new Date();
  data = data.replace(/%%_AUTHOR_%%/g, packageDetails.author);
  data = data.replace(/%%_BUILD_DATE_ISO_%%/g, date.toISOString().substring(0, 10));
  data = data.replace(/%%_BUILD_YEAR_%%/g, date.getFullYear());
  data = data.replace(/%%_BUILD_ID_%%/g, date.valueOf().toString(36));
  data = data.replace(/%%_DESCRIPTION_%%/g, packageDetails.description);
  data = data.replace(/%%_LICEN[CS]E_%%/g, packageDetails.license);
  data = data.replace(/%%_NAME_%%/g, packageDetails.name);
  data = data.replace(/%%_VERSION_%%/g, packageDetails.version);
  return data;
}

/**
 * Reduce size of js file.
 * @param {string} data - data to parse 
 * @param {string} prefix - added to start of content
 * @param {Object} packageDetails - details from package.json
 * @returns {string}
 */ 
function parseJs(data, prefix, packageDetails) {
    data = data.replace(/(?:^|[\r\n\t]) *\/\*.*?\*\//gs, '');
    data = data.replace(/^\s+/gm, '');
    data = data.replace(/\s+$/gm, '');
    data = prefix + data;
    return replaceTemplateVariables(data, packageDetails);
}

/**
 * Parse markdown file replacing template variables.
 * @param {string} data - data to parse 
 * @param {string} prefix - added to start of content
 * @param {Object} packageDetails - details from package.json
 * @returns {string}
 */ 
function parseMarkdown(data, prefix, packageDetails) {
    data = prefix + data;
    return replaceTemplateVariables(data, packageDetails);
}

/**
 * Parse html file replacing template variables.
 * @param {string} data - data to parse 
 * @param {string} prefix - added to start of content
 * @param {Object} packageDetails - details from package.json
 * @returns {string}
 */ 
function parseHtml(data, prefix, packageDetails) {
    data = prefix + data;
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
 */
function copyAndParse(filePath, destFile, options) {
  return fsPromises.readFile(filePath, {encoding: 'utf-8'})
    .then((contents) => {
      contents = options.parser(contents, options.config.prefix,
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
 * @returns {Promise}
 */
function copyFile(filePath, targetDir, options) {
  console.log(`Copy file ${filePath} to ${targetDir}`);
  const destination = path.join(targetDir, path.basename(filePath));
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
 * @param {*} path
 * @returns Promise which resolves to undefined on success.
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
 * @param {RegExp} options.includeFiles - filter for file names. Only these are included.
 * @param {RegExp} options.excludeDirs - filter for directories that are excluded.
 * @param {Object} options.parserConfig - options for parsers.
 * @returns {Promise}
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
          if (options.includeFiles?.test(dirent.name)) {
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
 * Get a array of the imagePack folders.
 * @param {string} parentDir
 * @returns {Array<string>} 
 */
function getImagePackFolders(parentDir) {
  return fsPromises.readdir(parentDir, {encoding: 'utf-8', withFileTypes: true, recursive: false})
    .then((result) => {
      const imagePacks = [];
      for (const dirent of result) {
        if (dirent.isDirectory()) {
          imagePacks.push(path.join(parentDir, dirent.name));
        }
      }
      return imagePacks;
    })
}

/**
 * Compress folder. 
 * The zip command is executed. The ${sourceDir} and ${outputDir} parameters are replaced by the sourceDir and
 * outputDir parameters.
 * @param {string} zipCommand
 * @param {string} sourceDir
 * @param {string} outputDir
 * @returns {Promise}
 */
function compressFolder(zipCommand, sourceDir, outputDir) {
  let cmd = zipCommand.replace(/\${sourceDir}/g, sourceDir);
  cmd = cmd.replace(/\${outputDir}/g, outputDir);
  console.log(`Zip command: ${cmd}`);

  return new Promise((resolve) => exec(cmd, {encoding: 'utf-8'}, (err, stdout, stderr) => {
    if (err) {
      console.error(`Failed to compress ${sourceDir}: ${err.message}`);
    } else {
      console.log(stdout);
    }
    resolve();
  })); 
}

/**
 * Details of the package. This will be taken from package.json
 * @type {Object}
 */
let packageDetails;


// Execute build
if (process.argv.length < 3) {
  showUsageAndExit('Incorrect arguments.');
} 

let configFile = process.argv[2];
console.log(`Loading options from ${configFile}`);
let options;


fsPromises.readFile('package.json', {encoding: 'utf-8'})
  .then((json) => {
    packageDetails = JSON.parse(json);
  })
  .then(() => fsPromises.readFile(configFile, {encoding: 'utf-8'}))
  .then((json) => {
    options = JSON.parse(json);
    //return fsPromises.readFile(options.indexFile, {encoding: 'utf-8'})    
  })
  .then(() => {
    if (!/^\.\/(?:build|docs)$/.test(options.outputDir)) {
      throw new Error(`Only ./build or ./docs supported as build directories. Will not delete or build to ${options.outputDir}.`);
    }
    return removeDir(options.outputDir);
  })
  .then(() => fsPromises.mkdir(options.outputDir, {recursive: true}))
  .then(() => fsPromises.mkdir(options.zippedOutputDir, {recursive: true}))
  .then(() => getImagePackFolders(options.imagePacksDir))
  .then((imagePacks) => {
    const indexOutputPath = path.join(options.outputDir, path.basename(options.indexFile));
    const includeRegex = new RegExp(options.filter.includeFiles.regex, options.filter.includeFiles.flags);
    const excludeImagePackDir = new RegExp(`assets[\/]${options.assetsImagePackName}`, 'i');
    const promises = [];
    for (const imagePack of imagePacks) {
      const packName = path.basename(imagePack);
      const packFullName = (`${packageDetails.name}_${packName}_${packageDetails.version}`
        .replace(/[.]/g, '_')).toLowerCase();
      const outputDir = path.join(options.outputDir,packName);
      const outputPackDir = path.join(outputDir, 'assets', options.assetsImagePackName);
      console.log(`Build image pack ${packName}`);
      const cpPromise =  copyDirectory(options.root, outputDir, {
          includeFiles: includeRegex,
          excludeDirs: excludeImagePackDir,
          parserConfig: options.parserConfig,
          packageDetails: packageDetails
        })
        .then(() => copyDirectory(imagePack, outputPackDir, {
          includeFiles: includeRegex,
          parserConfig: options.parserConfig,
          packageDetails: packageDetails
        }))
        .then(() => compressFolder(options.zipCommand, outputDir, path.join(options.zippedOutputDir, packFullName)));
      promises.push(cpPromise);
    }
    return Promise.all(promises);
  })
  .then(() => {
    console.log(`Build complete.`); 
  });


