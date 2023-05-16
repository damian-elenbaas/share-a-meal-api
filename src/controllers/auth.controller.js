const { privateKey, logger } = require('../utils/utils');
const jwt = require('jsonwebtoken');

let auth = {};

auth.validateToken = (req, res, next) => {
  logger.log('Validation');

  let token = req.headers.authorization;

  if(!token) {
    return res.status(400).json({
      'status': 400,
      'message': 'Authorization header required',
      'data': {}
    });
  }

  // Remove Bearer in front of token
  token = token.substring('Bearer '.length);

  jwt.verify(token, privateKey, (err, decoded) => {
    if(err) {
      return res.status(401).json({
        'status': 401,
        'message': 'Internal token',
        'data': {}
      });
    }

    res.locals.decoded = decoded;
    next();
  });
};

module.exports = auth;
