const express = require('express');
const path = require('path');

let app = express();
app.use('/', express.static(path.join(__dirname, '../public')));

app.use(function (req, res, next) {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, '../public/500.html'));
});

module.exports = app;
