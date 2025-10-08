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
 * @module hcje/main
 * @description
 * Main entry code.
 */

import * as utils from "./utils.js";
import * as tiles from "./tiles.js";
import * as scenes from "./scenes.js";
import * as images from "./images.js";
import * as domTools from "./dom_tools.js";
import * as device from "./device.js";
import * as storage from "./storage.js"; 
import * as constants from "./constants.js";
import * as audio from "./audio.js";
import {loadData, loadTranslation, i18n, translate} from './translation.js'; 

/**
 * Show a fatal error. NB we don't use translation in case the error occurred in translation.
 * There is no return as the function either reloads or goes back in the history.
 * @param {string} message
 */
function showAndHandleFatalError(message) {
  const choice = confirm(`Whoops! A serious error has occurred: ${message}\n\nDo you want to reload the page? If you cancel, we'll try to go back to the previous page.`);
  if (choice) {
    location.reload();
  } else {
    history.back();
  }
}

/* Add handlers for unexpected events. */
window.addEventListener('error', ((error) => {
  showAndHandleFatalError(`${error.message} ${error.filename}[${error.lineno}:${error.colno}]`);
}));

window.addEventListener('unhandledrejection', ((event) => {
  showAndHandleFatalError(`Unhandled promise rejection: ${event.reason}`);
}));

  
/** Margin around the puzzle. @type{number} */
const PUZZLE_MARGIN = 8;

/** Minimum size for a tile. @type{number} */
const MIN_TILE_SIZE = 48;

/** Minimum number of divisions @type{number} */
const MIN_DIVISIONS = 3;

/** Maximum number of divisions @type{number} */
const MAX_DIVISIONS = 10;

/** Number of puzzles to solve in order to increase max divisions 
 * @type{number}
 */
const PUZZLES_TO_RAISE_DIVISIONS = 3;

/** Time to display puzzle before shuffle @type{number} */
const INITIAL_PRESENTATION_MS = 2000;

/** Time to display completed puzzle @type{number} */
const COMPLETION_PRESENTATION_MS = 2000;

/** Time to display skipped puzzle @type{number} */
const SKIPPED_PRESENTATION_MS = 1000;

/** Transition time for fading the puzzle. Opacity transition should be set in CSS @type {number} */
const PUZZLE_FADE_S = 1;

/** Key for storing game data @type{string} */
const GAME_DATA_STORAGE_KEY = 'GameData';

/** Key for storing settings data @type{string} */
const SETTINGS_DATA_STORAGE_KEY = 'SettingsData';

/** Key for storing music settings @type{string} */
const MUSIC_OFF_STORAGE_KEY = 'MusicOff';

/** Data for setting swap speeds. @type {{durationMs:number,label:string}} */
const MOVE_DURATIONS = [
  {durationMs: 2000, label: 'LABEL_SLOW_DURATION'}, 
  {durationMs: 1000, label: 'LABEL_MEDIUM_DURATION'},
  {durationMs: 500, label: 'LABEL_FAST_DURATION'}
];

let musicOff = false;

/** 
 * @typedef {Object} SettingsData
 * @property {number} overrideMaxDivisions - allows decide on maximum divisions
 * @property {number} swapSpeedIndex
 */

/** Settings data @type{SettingsData} */
let settingsData;

/** Active menu bar @type {module:domTools~MenuBar} */
let currentMenuBar;

/** 
 * @typedef {Object} GameData
 * @property {number} puzzlesSolved
 * @property {numebr} imageIndex - index into image definitions.
 */

/**
 * Confirmation dialog.
 * @param {string} message
 * @returns {Promise} fulfils to true if confirmed (OK)
 */
async function confirmDialog(message) {
  return domTools.createDialog({
      title: i18n`Confirm`,
      text: message,
      buttonDefns: [
        {imageUrl: './assets/images/buttons_ok.png', label: i18n`OK`, id: 'OK'},
        {imageUrl: './assets/images/buttons_cancel.png', label: i18n`Cancel`, id: 'CANCEL'}
      ]
    })
    .then((response) => response === 'OK');
}

/**
 * Ok dialog.
 * @param {string} message
 * @param {string} [title = 'Information']
 * @returns {Promise} fulfils to undefined
 */
async function okDialog(message, title = i18n`Information`) {
  return domTools.createDialog({
      title,
      text: message,
      buttonDefns: [
        {imageUrl: './assets/images/buttons_ok.png', label: i18n`OK`, id: 'OK'},
      ]
    });
}

/**
 * Show content warning dialog.
 * @param {module:images~ContentWarning} contentWarning
 * @returns {Promise}
 */
function showContentWarningDialog(contentWarning) {
  const warningLabel = i18n`Warning symbol`;
  let markdown = `![${warningLabel}](./assets/images/icons_warning.png "${warningLabel}")\n\n`;
  markdown += `${translate(contentWarning.preamble)}\n\n`;
  for (const warning of contentWarning.topics) {
    markdown += `+ ${translate(warning)}\n`
  }
  return domTools.createDialog({
    title: i18n`Content warning`,
    markdown,
    buttonDefns: [
      {imageUrl: './assets/images/buttons_ok.png', label: i18n`OK`, id: 'OK'},
    ]
  });
  
}

/**
 * Show information dialog
 * @returns {Promise}
 */
function showInfo() {
  return loadData({
      baseUrl: './assets/documents/info.md',
      languageCode: 'en',
      fallbackLanguageCode: 'en',
      asJson: false
    })
    .then((markdown) => { 
      if (!markdown) {
        markdown = i18n`MESSAGE_CHECK_INTERNET`;
      } else {
        markdown = markdown.replace('%%_PUZZLE_PACK_NAME_%%', images.getPackName());
      }
      return domTools.createDialog({
          title: i18n`Information`,
          markdown,
          buttonDefns: [
            {imageUrl: './assets/images/buttons_ok.png', label: i18n`OK`, id: 'OK'},
          ]
        })
      }
    )
}


/** 
 * Wait for the user to initiate a shuffle.
 * Adds a button to the game which is then removed.
 * @returns {Promise}
 */
function waitForUserShuffle() {
  return new Promise((resolve) => {
    const waitForShuffleContainer = domTools.createChild(document.body, 'div',
      'shuffleAndPlay');
    const playButton = domTools.createButton({
      parentElement: waitForShuffleContainer,
      label: i18n`Shuffle and play`,
      url: './assets/images/buttons_play.png',
      className: 'buttonUserShuffle',
      listener: ((ev) => {
        resolve();
        waitForShuffleContainer.remove();
      })
    });
  });
}

/**
 * Show factory reset dialog.
 * Reset occurs if selected.
 * @returns {Promise}
 */
function confirmFactoryReset() {
  return confirmDialog(i18n`MESSAGE_CONFIRM_FACTORY_RESET`)
    .then((ok) => {
      if (ok) {
        storage.clear();
        window.location.reload();
      }
    })
}

/**
 * Show confirm skip puzzle dialog and implement if confirmed.
 * @param {module:tiles~PuzzleManager} puzzleManager
 * @param {module:domTools~MenuBar} menuBar
 * @returns {Promise}
 */
function confirmSkipPuzzle(puzzleManager, menuBar) {
  return confirmDialog(i18n`MESSAGE_CONFIRM_SKIP_PUZZLE`)
    .then((ok) => {
      if (ok) {
        menuBar.disable();
        menuBar.close();
        return puzzleManager.forceCompletion()
          .then(() => menuBar.enable());
      } 
    })
}

/**
 * Show settings dialog. Applies and saves any changes.
 * @param {module:tiles~PuzzleManager} puzzleManager
 * @returns {Promise}
 */
function showSettingsDialog(puzzleManager) {
  const bodyText = i18n`MESSAGE_SETTINGS_INSTRUCTIONS`;


  const divisionsControl = domTools.createSpinner({
    label: i18n`Maximum size`,
    initialValue: settingsData.maxDivisions,
    step: 1,
    downImage: './assets/images/buttons_down.png',
    upImage: './assets/images/buttons_up.png',
    downLabel: i18n`Reduce tiles`,
    upLabel: i18n`Increase tiles`,
    minValue: MIN_DIVISIONS - 1,
    maxValue: MAX_DIVISIONS,
    format: (value) => value < MIN_DIVISIONS ? i18n`default` : `${value} x ${value}`
  });
  
  const swapSpeedControl = domTools.createSpinner({
    label: i18n`Swap speed`,
    initialValue: settingsData.swapSpeedIndex,
    step: 1,
    downImage: './assets/images/buttons_down.png',
    upImage: './assets/images/buttons_up.png',
    downLabel: i18n`Decrease swap speed`,
    upLabel: i18n`Increase swap speed`,
    minValue: 0,
    maxValue: MOVE_DURATIONS.length - 1,
    format: (value) => {
      const label = translate(MOVE_DURATIONS[value].label);
      let duration = (MOVE_DURATIONS[value].durationMs/1000);
      if (duration < 1) {
        duration = duration.toFixed(1);
      }
      return `${label} ${duration}s`;
    }
  });
  
  const shuffleSpeedControl = domTools.createSpinner({
    label: i18n`Shuffle speed`,
    initialValue: settingsData.shuffleSpeedIndex,
    step: 1,
    downImage: './assets/images/buttons_down.png',
    upImage: './assets/images/buttons_up.png',
    downLabel: i18n`Decrease shuffle speed`,
    upLabel: i18n`Increase shuffle speed`,
    minValue: 0,
    maxValue: MOVE_DURATIONS.length - 1,
    format: (value) => {
      const label = translate(MOVE_DURATIONS[value].label);
      let duration = (MOVE_DURATIONS[value].durationMs/1000);
      if (duration < 1) {
        duration = duration.toFixed(1);
      }
      return `${label} ${duration}s`;
    }
  });

  const resetButton = domTools.createButtonControl({
    label: i18n`Factory reset`,
    url: './assets/images/buttons_factory_reset.png',
    className: 'factoryResetButton',
    listener: () => confirmFactoryReset()
  });
  
  const musicToggle = domTools.createButtonControl({
    label: i18n`Music state`,
    url: './assets/images/buttons_music.png',
    urlDown: './assets/images/buttons_music_off.png',
    down: musicOff,
    className: 'musicButton',
    listener: (ev, down) => {
      console.debug(`Music button down = ${down}`);
      musicOff = down;
      storage.setItem(MUSIC_OFF_STORAGE_KEY, musicOff);
      if (musicOff) {
        console.debug('Setting music to off.');
        audio.stopMusic(constants.AUDIO.music.key);
      } else {
        console.debug('Setting music to on.');
        audio.startMusic(constants.AUDIO.music.key);
      }
    }
  });

  return domTools.createDialog({
    title: i18n`Settings`,
    children: [
      divisionsControl.getElement(), musicToggle.getElement(),
      swapSpeedControl.getElement(), shuffleSpeedControl.getElement(),
      resetButton.getElement()
    ],
    text: bodyText,
    buttonDefns: [
      {imageUrl: './assets/images/buttons_ok.png', label: i18n`OK`, id: 'OK'},
    ]
  }).then(() => {
    settingsData.maxDivisions = divisionsControl.getValue();
    settingsData.swapSpeedIndex = swapSpeedControl.getValue(); 
    settingsData.shuffleSpeedIndex = shuffleSpeedControl.getValue(); 
    if (puzzleManager) {
      puzzleManager.setSwapDurationMs(
        MOVE_DURATIONS[settingsData.swapSpeedIndex].durationMs);
      puzzleManager.setShuffleDurationMs(
        MOVE_DURATIONS[settingsData.shuffleSpeedIndex].durationMs);
    }
    storage.setItem(SETTINGS_DATA_STORAGE_KEY, settingsData);
  });
}

/**
 * Popup dialog explaining the puzzle.
 * @param {boolean} firstPuzzle - if true, a full explaination is given. If this
 * is a subsequent puzzle, no explanation is given and the Promise is fulfiled
 * immediately.
 * @returns {Promise}
 */
function explainPuzzle(firstPuzzle) {
  let markdown;
  if (firstPuzzle) {
    markdown = i18n`MESSAGE_FIRST_PUZZLE`; 
  } else {
    return Promise.resolve();
  }
  
  return domTools.createDialog({
    title: i18n`Instructions`,
    className: 'centerContents',
    markdown,
    buttonDefns: [
      {imageUrl: './assets/images/buttons_ok.png', label: i18n`OK`, id: 'OK'},
    ]
  });
}

/**
 * Create front page menu bar.
 * @returns {module:domTols~MenuBar}
 */ 
function createFrontPageMenuBar() {
  const menuOpener = domTools.createButton({
    className: 'menuOpenButton',
    label: i18n`Open menu`,
    url: './assets/images/buttons_menu.png',
  });
  const menuCloser = domTools.createButton({
    className: 'menuCloseButton',
    label: i18n`Close menu`,
    url: './assets/images/buttons_cancel.png',
  });
  
  const info = domTools.createButton({
    className: 'infoButton',
    label: i18n`Information`,
    url: './assets/images/buttons_info.png',
    listener: () => showInfo()
  });
  
  const settings = domTools.createButton({
    className: 'settingsButton',
    label: i18n`Settings`,
    url: './assets/images/buttons_settings.png',
    listener: () => showSettingsDialog()
  });

  return domTools.createMenuBar({
    parentElement: document.body,
    opener: menuOpener,
    closer: menuCloser,
    children: [info, settings]
  });
  

}
/**
 * Create game menu bar.
 * @param {module:tiles~PuzzleManager} puzzleManager
 * @returns {module:domTols~MenuBar}
 */ 
function createPuzzleMenuBar(puzzleManager) {
  let menuBar;

  const menuOpener = domTools.createButton({
    className: 'menuOpenButton',
    label: i18n`Open menu`,
    url: './assets/images/buttons_menu.png',
  });
  const menuCloser = domTools.createButton({
    className: 'menuCloseButton',
    label: i18n`Close menu`,
    url: './assets/images/buttons_cancel.png',
  });
  
  const info = domTools.createButton({
    className: 'infoButton',
    label: i18n`Information`,
    url: './assets/images/buttons_info.png',
    listener: () => showInfo()
  });

  const skipPuzzle = domTools.createButton({
    className: 'skipButton',
    label: i18n`Skip puzzle`,
    url: './assets/images/buttons_skip.png',
    listener: () => confirmSkipPuzzle(puzzleManager, menuBar)
  });

  const settings = domTools.createButton({
    className: 'settingsButton',
    label: i18n`Settings`,
    url: './assets/images/buttons_settings.png',
    listener: () => showSettingsDialog(puzzleManager)
  });
  

  menuBar = domTools.createMenuBar({
    parentElement: document.body,
    opener: menuOpener,
    closer: menuCloser,
    children: [info, skipPuzzle, settings],
    onOpen: () => {
      skipPuzzle.disabled = !puzzleManager.isBeingSolved();
    }
  });
  
  return menuBar;

}


/**
 * Get appropriate puzzle config for puzzle manager
 * @param {Element} gameScreen - element containg game used for
 *   sizing
 * @param {module:main~GameData} gameData
 * @returns {Promise} fulfils to {@link module:tiles~PuzzleConfig}
 */ 
function getPuzzleConfig(gameScreen, gameData) {
  const puzzlesSolved = gameData?.puzzlesSolved ?? 0;
  return images.getDefinitionAtIndex(gameData.imageIndex)
    .then((imageDefinition) => {
      let maxDivisions;
      console.debug(`settingsData.maxDivisions = ${settingsData.maxDivisions}`);
      if (settingsData.maxDivisions >= MIN_DIVISIONS) {
        console.debug(`Using user's max divisions of ${settingsData.maxDivisions} if appropriate.`) ;
        maxDivisions = settingsData.maxDivisions;
      } else {
        const maxDivisionsForLevel = MIN_DIVISIONS + Math.floor(puzzlesSolved / PUZZLES_TO_RAISE_DIVISIONS );
        console.debug(`Max divisions for level is ${maxDivisionsForLevel}`);
        const maxDivisionsForPack = images.getMaxDivisions();
        console.debug(`Max divisions for pack is ${maxDivisionsForPack}`);
        maxDivisions = Math.min(maxDivisionsForLevel,
          maxDivisionsForPack);
      }
      console.debug(`Resulting maximum divisions set to ${maxDivisions}`);

      return {
        imageDefinition,
        rows: utils.getRandomIntInclusive(MIN_DIVISIONS, maxDivisions),
        columns: utils.getRandomIntInclusive(MIN_DIVISIONS, maxDivisions),
      };
    });
}




/**
 * Game loop.
 * @param {module:tiles~PuzzleManager} puzzleManager.
 * @param {module:tiles~PuzzleConstraints} puzzleConstraints
 * @param {module:main~GameData} gameData
 * @param {module:domTools~MenuBar} menuBar
 * @returns {Promise} theoretical return but at present there is none.
 */
async function loopPuzzles(puzzleManager, puzzleConstraints, gameData, menuBar) {
  let firstPuzzle = true;

  const waiter = utils.createWaiter();

  const shuffleAndPlay = document.getElementById('gameShuffleAndPlay');
  const shuffleAndPlayButton = domTools.createButton({
    parentElement: shuffleAndPlay, 
    label: i18n`Shuffle and play`,
    url: './assets/images/buttons_shuffle_and_play.png',
    listener: () => waiter.end()
  });

  /**
   * Set the shuffle button visibility.
   */ 
  function setShuffleButtonVisibility(visible) {
    if (visible) {
      shuffleAndPlayButton.disabled = false;
      shuffleAndPlay.classList.add('onScreen');
    } else {
      shuffleAndPlayButton.disabled = true;
      shuffleAndPlay.classList.remove('onScreen');
    }
  }

  setShuffleButtonVisibility(false);

  while (true) {
    menuBar.enable();
    let solvedIt = false;
    await explainPuzzle(firstPuzzle) 
      .then(() => utils.sleep(INITIAL_PRESENTATION_MS))
      .then(() => {
        setShuffleButtonVisibility(true);
        return waiter.wait()
          .then(() => setShuffleButtonVisibility(false))
      })
      .then(() => menuBar.disable())
      .then(() => puzzleManager.shuffle())
      .then(() => menuBar.enable())
      .then(() => puzzleManager.play())
      .then((completedNormally) => {
        solvedIt = completedNormally;
        if (solvedIt) {
          console.debug('Puzzle completed normally');
          firstPuzzle = false;
          gameData.puzzlesSolved++;
        }
        gameData.imageIndex = images.getNextIndex(gameData.imageIndex);
        storage.setItem(GAME_DATA_STORAGE_KEY, gameData);
      })
      .then(() => utils.sleep(COMPLETION_PRESENTATION_MS))
      .then(() => {
        if (solvedIt) {
          return okDialog(
            i18n`Puzzles solved: ${gameData.puzzlesSolved}`,
            i18n`NICELY DONE!`);
        } else {
          return okDialog(
            `Okay! Let's have a go at a different one.`,
            i18n`BIT TRICKY?`);
        }
      })
      .then(() => puzzleManager.fadeOut(PUZZLE_FADE_S))
      .then(() => getPuzzleConfig( puzzleConstraints.fitWithin, gameData))
      .then((config) => puzzleManager.initialise(config, puzzleConstraints))
      .then(() => puzzleManager.fadeIn(PUZZLE_FADE_S));
  }
}

/**
 * Play the game.
 */
function play() {
  audio.addMusic(constants.AUDIO.music)
    .then((musicChannel) => {
      if (!musicOff) {
        console.debug(`Music is set to on, so starting background.`);
        musicChannel.start();
      } else {
        console.debug(`Music is set to off, so not starting background.`);
      }
    });
  
  const gameData = storage.getItem(GAME_DATA_STORAGE_KEY) ?? {
    puzzlesSolved:0,
    imageIndex: 0,
  };
  let puzzleManager;
  let menuBar;
  scenes.switchScene('./fragment_game.html')
    .then(() => {
      puzzleManager = tiles.createPuzzleManager(document.getElementById('grid')); 
      puzzleManager.setSwapDurationMs(MOVE_DURATIONS[settingsData.swapSpeedIndex ?? 0].durationMs);
      puzzleManager.setShuffleDurationMs(MOVE_DURATIONS[settingsData.shuffleSpeedIndex ?? 0].durationMs);
      menuBar = createPuzzleMenuBar(puzzleManager);
      menuBar.disable();
      const storedPuzzle = puzzleManager.getStoredPuzzle();

      if (storedPuzzle) {
        if (storedPuzzle.puzzleConfig?.imageDefinition?.backgroundImage === 'DYNAMIC') {
          console.log('Recovery of stored puzzles for dynamic images is not supported.');
        } else {
          return confirmDialog( i18n`MESSAGE_CONTINUE_PUZZLE`)
            .then((okay) => okay ? storedPuzzle : null);
        }
      }
      return null
    })
    .then((storedPuzzle) => {
      const gameScreen = document.getElementById('gameScreen');
      if (storedPuzzle) {
        return {
          puzzleConfig: storedPuzzle.puzzleConfig,
          poolGridRefs: storedPuzzle.poolGridRefs
        };
      } else {
        return getPuzzleConfig(gameScreen, gameData)
          .then((config) => {
            return {
              puzzleConfig: config, 
              poolGridRefs: null
            };
          });
      }
    })
    .then((settings) => {
      /**
       * @typedef {Object} PuzzleConstraints
       * @property {Element} fitWithin - element used for sizing the game
       * @property {number} margin - margin around grid when fitting.
       * @property {number} minTileSize - minimum size of a tile.
       */ 
        const puzzleConstraints = {
          fitWithin: gameScreen,
          margin: PUZZLE_MARGIN,
          minTileSize: MIN_TILE_SIZE
        }
        
        if (settings.poolGridRefs) {
          puzzleManager.initialise(settings.puzzleConfig, puzzleConstraints,
            settings.poolGridRefs); 
        } else {
          puzzleManager.initialise(settings.puzzleConfig, puzzleConstraints);
        }
        addEventListener('resize', () => puzzleManager.rescale());
        return puzzleConstraints
    })
    .then((constraints) => loopPuzzles(puzzleManager, constraints, gameData, menuBar));
}

/** 
 * Prepare the launch page.
 * @returns {Promise}
 */
function prepareLaunchPage() {
  storage.setId(images.getPackName());
  settingsData = storage.getItem(SETTINGS_DATA_STORAGE_KEY) ?? {
    maxDivisions: 0,
    swapSpeedIndex: 0,
    shuffleSpeedIndex: 0
  };


  musicOff = storage.getItem(MUSIC_OFF_STORAGE_KEY) ?? false;

  document.getElementById('WelcomeStrapline').innerText = i18n`MESSAGE_WELCOME_STRAPLINE`;
  createFrontPageMenuBar();
  const packNameElement = document.getElementById('packName');
  if (packNameElement) {
    packNameElement.innerText = translate(`${images.getPackName()} pack`);
  }



  if (images.getNumberOfImages() > 0) {
    const playButton = domTools.createButton({
      parentElement: document.getElementById('playButtonContainer'),
      label: i18n`Play game`,
      url: './assets/images/buttons_play.png',
      className: 'playButton',
      listener: () => play()
    });
  }
  const contentWarning = images.getContentWarnings();
  
  if (contentWarning.topics.length > 0) {
    const playContainer = document.getElementById('playButtonContainer');
    const cwContainer = domTools.createChild(playContainer, 'div', 'contentWarning'); 
    domTools.createButton({
      parentElement: cwContainer,
      label: i18n`Content warning`,
      url: './assets/images/buttons_content_warning.png',
      className: 'contentWarningButton',
      listener: () => showContentWarningDialog(contentWarning)
    });
    const label = domTools.createChild(cwContainer, 'p');
    label.innerText = i18n`Content warning`;
  }
  return Promise.resolve();
}


/* Main game entry point. */
images.loadImagePack('./assets/imagePack/pack.json')
  .then(() => loadTranslation({
    baseUrl: './assets/i18n/i18n.json', 
    filter: constants.TRANSLATIONS,
  }))
  .then((success) => {
    if (success) {
      return prepareLaunchPage();
    } else {
      return scenes.switchScene('./fragment_disaster.html')
    }
  });

