const logger = require('./logger').logger;
const privateKey = require('./private-key');

let utils = {};

utils.logger = logger;
utils.privateKey = privateKey;

module.exports = utils;
