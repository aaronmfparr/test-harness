# Test-Harness
`[project]/frontend/test-harness` contains scripts that drive testing, code to be included in tests to make writing them easier, and default tests for all projects.

`[project]/tests` is the user controlled repository for tests of your project.


## Dependencies
* Install the following on the system which is running tests:
  * chrome browser `brew cask install google-chrome`
  * selenium webdriver `brew install chromedriver`
* Add these scripts to your project's `package.json`:
```javascript
"build:test": "npm run build-dev:test",
"build-dev:test": ". ./frontend/test-harness/envs/test && ./frontend/node_modules/.bin/webpack --env.buildType development",
"test": "npm run test-dev",
"test-dev": "HOST=$PWD/build/debug/browser-mobile/ ./frontend/test-harness/node_modules/mocha/bin/mocha --bail frontend/test-harness/tests/ tests/",
```
* Setup [QAScripts](https://docs.google.com/document/d/1DvkoebF-s_no7zlpk97H8nV6yavCE4od0MMDkBqVSuA/edit?usp=sharing) for your project.
* Create the directory `[project]/tests`, and put tests in it.


## [project]/tests
Put your project's tests here.

Make as many tests as you want. Follow these rules:

* Write your tests in JavaScript.
* Write tests for use by the [Mocha framework](https://mochajs.org/).
* Include our test API: `const {Test}    = require(path.join('..', 'frontend', 'test-harness'));`

Example tests are available in `[project]/frontend/test-harness/tests/`. You can use them as a starting point.


## Use
Prior to running tests, you need to generate a test build. Then after that you execute the tests against that particular build. The reason for this is that tests make use of hacks embedded in the game. (These are activated during the build process when the environmental variables `IS_TEST` and `IS_AUTOMATED` are `true`.)

### Continuous Integration
Our build process uses the following two scripts to generate a test build, and then execute tests.
* `npm run build:test` generates the build to test.
* `npm test` executes the tests.

We setup these scripts as aliases pointing to others to make your life easier, and provide configurability. You can create a number of others, and choose which you want the Continuous Integration process to point at. But do not delete these two scripts.

### Webpack Dev Server
The webpack dev server is useful, if you are developing tests, or running tests while developing the game. See the Bonus Material below for the scripts needed to use the webpack dev server.
* `npm run serve:test`: starts the server and the watcher for the build process.
* `npm run test-serve`: executes the tests.


## Bonus Material

### Package.json Options
Configuration of the test process is handled with environemntal variables. This is ugly, but it is explicit which should help with remembering what is what when you look at these things in a month or two.

#### Additional Test Targets

 * **Webpack Dev Server:**
```javascript
"serve:test": ". ./frontend/test-harness/envs/test && ./frontend/node_modules/.bin/webpack-dev-server --env.buildType development --no-inline",
"test-serve": "HOST=https://localhost:8020/webpack-dev-server/  ./frontend/test-harness/node_modules/mocha/bin/mocha --bail tests/",
```

*  **RCO**
```javascript
"build-rc0:test": ". ./frontend/test-harness/envs/test && ./frontend/node_modules/.bin/webpack --env.buildType RC0",
"test-rc0": "HOST=$PWD/build/release/browser-mobile-RC0/ ./frontend/test-harness/node_modules/mocha/bin/mocha --bail frontend/test-harness/tests/ tests/",
```

#### Debugging Tests
To view verbose logs in the console while writing your own tests and trouble shooting them, add `DEBUG='test-harness*'` at the start of a test script line. For example:
```javascript
"test-dev": "DEBUG='test-harness*' HOST=$PWD/build/debug/browser-mobile/ ./frontend/test-harness/node_modules/mocha/bin/mocha --bail frontend/test-harness/tests/ tests/",
```

#### Only Running Particular Tests
Identify the tests you want to run as arguments for the `mocha` command. By default mocha does not look in sub-directories for tests to execute.

 * Only execute your test `myTest.js`:
```javascript
"test-dev":" HOST=$PWD/build/debug/browser-mobile/ ./frontend/test-harness/node_modules/mocha/bin/mocha --bail tests/myTest.js",
```

 * Execute all tests in the subfolder `smoke`:
```javascript
"test-dev":" HOST=$PWD/build/debug/browser-mobile/ ./frontend/test-harness/node_modules/mocha/bin/mocha --bail tests/smoke/",
```


### Unimplemented: Testing Inside Facebook
Testing games inside facebook, as with our `npm run serveFacebook` script, is also desirable, but not yet implemented. We need to figure out how to teach our build agents, and browsers run by selenium (which wipe out user data and cookies when launched) to automatically log into facebook for running these tests.

That said we do have hooks for this already in src/Test.js.

The `package.json` changes to make this work are:

```javascript
"build-fb:test": ". ./frontend/test-harness/envs/test && ./frontend/node_modules/.bin/webpack --env.buildType developmentFacebook",
"test-fb":"DEBUG='test-harness*' SERVE_FACEBOOK_APPID='xxxxxxxxxxxxxxxx' HOST=$PWD/build/debug/browser-mobile/ ./frontend/test-harness/node_modules/mocha/bin/mocha --bail tests/"
```

Substitute your game's SERVE_FACEBOOK_APPID for all those xxxxxxx's.