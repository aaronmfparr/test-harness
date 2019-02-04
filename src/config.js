const path = require('path');


// Used in createServer.js
const PROJECT_ROOT      = process.cwd();

// Used in Test.js
// Can be URL or absolute path
const SERVER_URL        = process.env.HOST;

const TEST_HARNESS_ROOT = path.resolve(__dirname, '..');

// serving through facebook needs a method of logging in to work
// currently does not work
// serve through facebook?
let FACEBOOK_INSTANT_GAMES_URL = '';
if (process.env.SERVE_FACEBOOK_APPID) {
  FACEBOOK_INSTANT_GAMES_URL = 'https://www.facebook.com/instantgames/'+process.env.SERVE_FACEBOOK_APPID+'/';
}

// local storage key for the qa hack which stores analytics events
const LS_KEY_AMPLITUDE = 'QA_amplitude';

module.exports = {
  PROJECT_ROOT: PROJECT_ROOT,
  SERVER_URL: SERVER_URL,
  FACEBOOK_INSTANT_GAMES_URL: FACEBOOK_INSTANT_GAMES_URL,
  TEST_HARNESS_ROOT: TEST_HARNESS_ROOT,
  LS_KEY_AMPLITUDE: LS_KEY_AMPLITUDE
};
