#!/usr/bin/env node

const path    = require('path');
const express = require('express');
const session = require('express-session');
const routes  = require('./routes');
const config  = require('./config');

const app  = express();
const port = process.argv[2] || config.port;

// Use the session middleware
app.enable('trust proxy');
app.use(session(config.session));

// Use middleware to parse request body as JSON.
// bodyParser is deprecated and now merged into express itself.
app.use(express.json());

// Use middleware to serve static files from the public directory.
app.use(express.static(path.join(__dirname, 'public')));

// Log connections
app.use((req, res, next) => {
  console.log(`From ${req.ip}, Request ${req.url}`);
  next();
});

routes.configureRoutes(app);

const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`Server listening to ${host}:${port}`);
});
