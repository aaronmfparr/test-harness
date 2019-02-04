const path = require('path');
const debug = require('debug');
const fs = require('fs');
// const http = require('http');
const https = require('https');
const express = require('express');

const config = require('./config');


const log = debug('test-harness:createServer');

// need to navigate around frontend whether we are running this in test-harness or [project]
let FRONTEND_PATH = config.PROJECT_ROOT;
if (FRONTEND_PATH.indexOf('test-harness') !== -1) {
  FRONTEND_PATH = path.join(FRONTEND_PATH, '..');
} else {
  FRONTEND_PATH = path.join(FRONTEND_PATH, 'frontend');
}

const privateKey  = fs.readFileSync(path.join(FRONTEND_PATH, 'arson', 'assets', 'ssl.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(FRONTEND_PATH, 'arson', 'assets', 'cert.pem'), 'utf8');
const credentials = { key: privateKey, cert: certificate };


const createServer = function (staticDir, port) {
  return new Promise((resolve, reject) => {

    const app = express();
    app.use('/', express.static(staticDir));
    var server = https.createServer(credentials, app);
    //var server = http.createServer(server);
    const serverListen = server.listen({
      port: port
    }, (error) => {
      if (error) {
        log(error);
        reject(error);
      } else {
        log('createServer: port=', port);
        resolve(serverListen);
      }
    });
  });
};


module.exports = createServer;
