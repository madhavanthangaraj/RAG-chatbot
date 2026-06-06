const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const userRepository = require('../repositories/user.repository');

const protect = async (req, res, next) => {
  try {
    // Check for System Key fallback to allow AI microservice calls
    if (req.headers['x-system-key'] === config.jwtSecret) {
      const userId = req.headers['x-user-id'] || (req.body && req.body.user_id);
      let sysUser = null;
      if (userId) {
        sysUser = await userRepository.findById(userId);
      }
      if (!sysUser) {
        const db = require('../config/db');
        sysUser = await db.get("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
      }
      if (sysUser) {
        req.user = sysUser;
        return next();
      }
    }

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.'));
    }


    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token. Please log in again.'));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
