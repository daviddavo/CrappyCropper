const path = require('path');

module.exports = {
  entry: './assets/js/src.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'static')
  }
};
