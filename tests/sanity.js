// -----------------------------------------------------------------------------
// this is a classic sanity test which can be run against any game
// it determines whether or not the game starts up


// INCLUDES --------------------------------------------------------------------
// standard assert library recommended for use in mocha tests
// const assert = require('assert');
// test-harnesses helper functions for setting up and tearing down and executing tests
const { Test }  = require('../src/Test');


// THE TESTS -------------------------------------------------------------------
describe
(
  // this is the name of the Test suite
  'Sanity Test(s)',
  function () {
    // create the test object, which will be used by each test in this Suite.
    const test = new Test();

    // executes before each test in the suite
    beforeEach(function () {
      this.timeout(10 * 1000); // millisecond limit for this function
      return test.start(); // initializes the test, and creates a selenium web browser test.browser;
    });

    // executes before each test in the suite (unless you manually throw an error)
    afterEach(function () {
      return test.stop(); // tear down function for each test
    });

    // a test
    it(
      // name of the test
      'Start Up Test',
      function () {
        const maxMS = 15 * 1000;
        this.timeout(maxMS);
        // expect the analytics event 'session' to be posted by game
        return (
          test.expectAnalyticsEvents(['session'], maxMS)
        );
      }
    );
  }
);
