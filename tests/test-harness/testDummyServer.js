// -----------------------------------------------------------------------------
// DO NOT execute this test against a game and expect meaningful results
// this test is intended specifically for the   test-harness   itself
// this test tests a server running the files in tests/html


// INCLUDES --------------------------------------------------------------------
// logging
const debug = require('debug');
const log = debug('test-harness:tests:sanity');
// standard assert library recommended for use in mocha tests
const assert = require('assert');
// test-harnesses helper functions for setting up and tearing down and executing tests
const { Test }  = require('../../src/Test');


// THE TESTS -------------------------------------------------------------------
describe(
  // this is the name of the Test suite
  'Test-Harness Test(s)',
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

    it('Full test', function () {
      this.timeout(10 * 1000);
      // Unordered list
      return test.expectAnalyticsEvents(['StartupEvent2', 'StartupEvent1'], 1000)
      .then(() => test.expectAnalyticsEvents(['FirstEntry'], 2 * 1000))
      // Ensure timeout works
      .then(() => {
        let error;
        return test.expectAnalyticsEvents(['GameComplete'], 1)
        .catch((_error) => error = _error)
        .finally(() => {
          log('error=', error);
          assert(
            error && error.message.indexOf('GameComplete') > 0,
            'Should throw error: timeout'
          );
        });
      })
      // Ensure error tracking works
      .then(() => {
        let error;
        return test.expectAnalyticsEvents(['RandomGameError'], 1000)
        .catch((_error) => error = _error)
        .finally(() => {
          log('error=', error);
          assert(
            error && error.message.indexOf('RandomGameError') > 0,
            'Should throw error: RandomGameError'
          );
        });
      });
    });

    it('Full test: ignore errors', function () {
      this.timeout(10 * 1000);
      // Ensure ignore errors works
      return test.expectAnalyticsEvents(['GameComplete'], 5 * 1000, true)
      // Cannot consume same event twice
      .then(() => {
        let error;
        return test.expectAnalyticsEvents(['GameComplete'], 500)
        .catch((_error) => error = _error)
        .finally(() => {
          log('error=', error);
          assert(
            error && error.message.indexOf('GameComplete') > 0,
            'Should throw error: timeout'
          );
        });
      });
    });
  }
);
