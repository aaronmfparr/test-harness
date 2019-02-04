const config = require('./config');
const createServer = require('./createServer');

const path = require('path');
// const assert = require('assert');
const debug = require('debug');
const Promise = require('bluebird');



/** Make and return a new selenium+chrome browser instance. */
const makeBrowser = () => {
  const webdriver = eval('require')(
    path.join(config.TEST_HARNESS_ROOT, 'node_modules', 'selenium-webdriver')
  );
  const chrome = eval('require')(
    path.join(config.TEST_HARNESS_ROOT, 'node_modules', 'selenium-webdriver', 'chrome')
  );
  let chromeOpts = new chrome.Options().windowSize({
    width: 500,
    height: 899
  });
  // max out logging preferences
  chromeOpts.setLoggingPreferences( webdriver.logging.Level.ALL );
  const browser = new webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions( chromeOpts )
    .build();
  return browser;
};


/**
* Test prototype for selenium tests
*         instantiation: let test = Object.create(Test);
* browser: is the selenium web driver. this.browser responds to the selenium webdriver api
*         http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/
* all methods
*         are thenable (return a promise)
* methods beginning with 'get'
*         return a promise which resolves to a value.
*/
class Test {

  constructor () {
    this.log = debug('test-harness:Test');
    // establish properties
    this.browser = null; // SELENIUM WEBDRIVER

    this.currentPositionInAnalyticsEventList = 0;

    // this._frame = null; // the frame which is serving the game (used with webpack dev sever)
    this._server = null;
    this._running = false;
  }

  /**
  * Set Up for a test using selenium
  */
  start () {
    this.log('START TEST');

    if (this._running) {
      throw new Error('Test already in progress');
    }
    this._running = true;
    // create a selenium webdriver object and call it "browser"
    this.browser = makeBrowser();

    // initialize test properties
    this.currentPositionInAnalyticsEventList = 0;

    let targetURL = config.SERVER_URL;

    let serverPromise;

    // If SERVER_URL is a path, start a server to host it
    if (path.isAbsolute(targetURL)) {
      const serveDir = path.extname(targetURL)==='' ? targetURL : path.dirname(targetURL);
      this.log('> Directory to serve =',serveDir);
      serverPromise = createServer(serveDir, 0)
      .then((server) => {
        this._server = server;
        const port = this._server.address().port;
        // Rewrite as url
        targetURL = (
          'https://localhost:'
          + port
          + targetURL.substring(serveDir.length, targetURL.length)
        );
        // // ... this needs a method of logging into facebook to work ...
        // const fbGameURL = config.FACEBOOK_INSTANT_GAMES_URL;
        // if (fbGameURL!=='') {
        //   targetURL = fbGameURL+'?game_url='+targetURL;
        // }
      });
    } else {
      serverPromise = Promise.resolve();
    }

    this.log('> SERVER_URL=', targetURL);
    // wait for browser to be open
    // wrap with bluebird for consistent API
    // load the game in the browser
    return serverPromise.then(() => {
      this.log('> SERVER_URL=', targetURL);
      return (
        this.browser.get(targetURL)
        .then(() => { return this._setFrameTarget(); })
      );
    });
  }

  /**
  * Tear Down for a test using selenium
  */
  stop () {
    this.log('STOP TEST');
    if (!this.browser) { return Promise.resolve(); }

    return this._setLocalData(config.LS_KEY_AMPLITUDE, null)
    .then(() => this.browser.quit())
    .finally(() => {
      this.browser = null;
      this.currentPositionInAnalyticsEventList = 0;
      if (this._server) { this._server.close(); }
      this._server = null;
      this._running = false;
    });
  }

  /**
   * Force selenium to target the frame with the game in it
   */
  _setFrameTarget () {
    return (
      this.browser.findElement({ tagName:'iframe' })
      .then((theFrame) => { return this.browser.switchTo().frame(theFrame); } )
      .catch(() => {}) // it doesn't exist so we don't care
    );
  }

  // BROWSER DATA HANDLING
  /**
  * Uses selenium web driver to set the value of an item in the browser's local Storage.
  * @param localKey {string} - string identifier for the local storage data
  * @param localStorageData {object} - JSON object to set in local storage
  */
  _setLocalData (localKey, localStorageData) {
    return this.executeScriptInBrowser(
      `localStorage.setItem("${localKey}", ${JSON.stringify(localStorageData)});`
    );
  }

  /**
  * Uses selenium web driver to get the value of an item in the browser's local Storage.
  * @param localKey {string} - string identifier for the local storage data
  */
  _getLocalData (localKey, displayLog=true) {
    return this.executeScriptInBrowser(
      `return localStorage.getItem("${localKey}")`,
      displayLog
    );
  }

  /**
  * Uses selenium web driver to remove an item from the browser's local Storage.
  * @param localKey {string} - string identifier for the local storage data
  */
  _deleteLocalData (localKey) {
    return this.executeScriptInBrowser(
      `localStorage.removeItem("${localKey}");`
    );
  }

  /**
  * Executes inside the game a qaScript (if qaScripts are setup for your game/project).
  * Look in [project]/src/qaScripts to see what qaScripts you have available.
  * QAScript Setup:  https://docs.google.com/document/d/1DvkoebF-s_no7zlpk97H8nV6yavCE4od0MMDkBqVSuA/edit?usp=sharing
  * @param scriptName {string} - name of the QA Script to execute
  */
  runQaScript (scriptName) {
    this.log('runQaScript: ', scriptName);
    return Promise.resolve(this.browser.executeAsyncScript(
      'var callback = arguments[arguments.length - 1];'
      + 'window.qaScripts.runScript("' + scriptName + '")'
      +'.then(function (result) { callback(result); });'
    ));
  }

  /**
  * Wait for a duration before continuing with the test.
  * @param waitMilliseconds {number} - maximum number of milliseconds to wait
  */
  wait (waitMilliseconds) {
    this.log('wait: ', waitMilliseconds);
    return Promise.resolve(
      this.browser.wait(() => {
        return Promise.delay(100).return(false);
      }, waitMilliseconds)
      .catch(() => {})
    );
  }

  /**
  * Execute a script in the browser's console. Is capable of getting and returning a value.
  * @param scriptContents {string} - JavaScript code to execute in the browser's console.
  */
  executeScriptInBrowser (scriptContents, displayLog=true) {
    if (displayLog) { this.log('executeScriptInBrowser: ', scriptContents); }

    return Promise.resolve(this.browser.executeScript(scriptContents));
  }

  /**
  * Restart the browser. The game will run through some startup functions such as reading data in local storage.
  * @param refreshEventsToWaitFor {array} - Events to wait for after the browser refreshes in order to determine the game has finished rebooting
  * @param maxWaitTime {number} - Maximum amount of time to wait for the reboot of the game
  */
  refreshBrowser (refreshEventsToWaitFor=['ServiceProvider'], maxWaitTime=5000) {
    this.log('refreshBrowser: ', refreshEventsToWaitFor,' maxWaitTime=', maxWaitTime);
    // first get the length of the analytics events
    let analyticsPositionToCheckFromAfterRefresh;
    return this._getAnalyticsEvents()
    .tap((events) => { analyticsPositionToCheckFromAfterRefresh = events.length; })
    .then(() => { return this.browser.navigate().refresh(); })
    // ensure that selenium is targeting the frame we want
    .then(() => { return this._setFrameTarget(); })
    // wait until we see the event we want (but do not collect errors, and do not advance the position in the array)
    .then(() => { return this.waitForAnalyticsEvents(refreshEventsToWaitFor, maxWaitTime, analyticsPositionToCheckFromAfterRefresh); })
    // then give it a second to get into a ready state
    .then(() => { return this.wait(1000); });
  }

  /**
   * @type event
   * @property name
   * @property event
   * @property [event.errorCode]
   * @property [event.errorMessage]
   * @property [event.errorStack]
   */

  /**
  * Returns an array of analytics events from the player's local storage
  */
  _getAnalyticsEvents () {
    return this._getLocalData(config.LS_KEY_AMPLITUDE, false)
    .then((analyticsData) => {
      if (!analyticsData) {
        return [];
      } else {
        analyticsData = JSON.parse(analyticsData);
      }
      // QA analytics is an array named "events"
      return analyticsData.events;
    });
  }

  /**
  * Deletes an array of analytics events from the player's local storage
  */
  deleteAnalyticsEvents () {
    return this._deleteLocalData(config.LS_KEY_AMPLITUDE)
    .then(() => {
      return Promise.resolve(this.currentPositionInAnalyticsEventList = 0);
    });
  }

  /**
   * Look for a list of events specified in eventNameArray
   * Throw an error if an event looked for has an error, or is unfound after timeoutMIlliseconds elapses
   * @param {string[]} eventNameArray
   * @param {number} timeoutMilliseconds
   * @param {boolean} ignoreErrors
   */
  expectAnalyticsEvents (
    eventNameArray,
    timeoutMilliseconds,
    ignoreErrors
  ) {
    this.log('expectAnalyticsEvents: ', eventNameArray, ' timeoutMilliseconds=', timeoutMilliseconds);

    // Resolve once all of these have been found
    const eventsToFind = eventNameArray.slice();

    return this.browser.wait(() => {
      // Get current known events
      return this._getAnalyticsEvents()
      .catch((error) => {
        this.log('> error while scanning events=', error);
      })
      .then((eventList) => {
        if (!eventList) { return; }

        // Check for event name, starting at last found index
        for (
          let i = this.currentPositionInAnalyticsEventList;
          i < eventList.length;
          i++
        ) {
          // Read event from list
          const thisEvent = eventList[i];
          this.log('> event ', i,' = ', thisEvent.name);

          // look for the event
          const foundIndex = eventsToFind.indexOf(thisEvent.name);
          // Store our position in the EventList
          this.currentPositionInAnalyticsEventList = i + 1;

          // is thisEvent in our list of eventsToFind?
          if (foundIndex >= 0) {
            // Remove the found event from list
            eventsToFind.splice(foundIndex, 1);
            this.log('> > Found!');

            // look for an error in the event we found
            if (thisEvent.event.hasOwnProperty('errorCode')) {
              this.log(`> > > Error! (${thisEvent.event.errorCode}) ${thisEvent.event.errorMessage} | Stack=${thisEvent.event.errorStack}`);

              if (!ignoreErrors) {
                throw new Error(`Event error detected "(${thisEvent.event.errorCode}) ${thisEvent.event.errorMessage}" while waiting for ${eventNameArray}`);
              }
            }
            this.log('> > > Remaining eventsToFind=', eventsToFind);
          }
        }
      })
      .then(() => {
        // Resolve a boolean for protractor: is the .wait condition satisfied?
        const isDone = eventsToFind.length === 0;
        if (isDone) {
          this.log('> Done');
        }

        return isDone;
      })
      .tap((done) => {
        // Avoid hammering localStorage
        if (!done) { return Promise.delay(100); }
      });
    }, timeoutMilliseconds)
    .catch((error) => {
      this.log('> error during browser.wait=', error);
      // Wrap timeout with a pretty message
      if (error.message.indexOf('Wait timed out') === 0) {
        throw new Error(`expectAnalyticsEvents timed out after ${timeoutMilliseconds} ms.   Did not find=${eventsToFind}   while looking for=${eventNameArray}`);
      }
      throw error;
    });
  }

  /**
   * Wait for game to emit the specified list of events.
   * eventNameArray is un-ordered.
   * @param {string[]} eventNameArray
   * @param {number} timeoutMilliseconds
   * @param {boolean} ignoreErrors
   */
  waitForAnalyticsEvents (eventsToWaitFor, timeoutMilliseconds, analyticsPositionToCheckFrom = this.currentPositionInAnalyticsEventList) {
    this.log('waitForAnalyticsEvents: eventsToWaitFor=', eventsToWaitFor, 'timeoutMilliseconds=', timeoutMilliseconds, 'analyticsPositionToCheckFrom=', analyticsPositionToCheckFrom);

    // Resolve once all of these have been found
    const eventsToFind = eventsToWaitFor.slice();

    return this.browser.wait(() => {
      // Get current known events
      return this._getAnalyticsEvents()
      .catch((error) => {
        this.log('> error while scanning events=', error);
      })
      .then((eventList) => {
        if (!eventList) { return; }

        // Check for event name, starting at last found index
        for (
          let i = analyticsPositionToCheckFrom;
          i < eventList.length;
          i++
        ) {
          // Read event from list
          const thisEvent = eventList[i];
          this.log('> Waiting... ', i,' = ', thisEvent.name);

          const foundIndex = eventsToFind.indexOf(thisEvent.name);
          if (foundIndex >= 0) {
            // Remove the found event from list
            eventsToFind.splice(foundIndex, 1);
            this.log('> > Found! Remaining eventsToFind=', eventsToFind);
          }

          // Move last found index
          analyticsPositionToCheckFrom = i + 1;
        }
      })
      .then(() => {
        // Resolve a boolean for protractor: is the .wait condition satisfied?
        const isDone = eventsToFind.length === 0;
        return isDone;
      })
      .tap((done) => {
        // Avoid hammering localStorage
        if (!done) { return Promise.delay(100); }
      });
    }, timeoutMilliseconds)
    .catch((error) => {
      this.log('> error during browser.wait=', error);
      // Wrap timeout with a pretty message
      if (error.message.indexOf('Wait timed out') === 0) {
        this.log(`${error}`);
        return Promise.resolve();
      }
      throw error;
    });
  }
}


module.exports = {
  Test : Test
};
