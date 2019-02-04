/// #if IS_DEVELOPMENT || IS_TEST
import Promise from 'bluebird';
import debug from 'debug';

class QAScripts {
  constructor () {
    this._log = debug('test-harness:QAScripts');
    this._scripts = {};
  }

  addScript (scriptObject) {
    this._scripts[scriptObject.name] = scriptObject.fn;
  }

  runScript (scriptName) {
    console.log(`Running script: ${scriptName}`);
    return Promise.try(() => {
      return this._scripts[scriptName]();
    }).tap((result) => {
      console.log('Script complete: result=', result);
    }).catch((error) => {
      console.error('Error while running script: error=', error);
      throw error;
    });
  }

  listScripts () {
    return Object.keys(this._scripts);
  }
}

const qaScripts = new QAScripts();
window.qaScripts = qaScripts;
module.exports = qaScripts;
/// #endif
