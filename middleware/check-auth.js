//route protection middleware ( so certain routes like adding a place or updating a place are not available to folks who don't have jwt token or authorization).

const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {       // mandatory thing need to do to deal with OPTIONS header in browser, dont fret too much over it.
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error('Authentication failed!');
    }
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId };
    
    next();
  } catch (err) {
    const error = new HttpError('Authentication failed!', 401);
    return next(error);
  }
};

