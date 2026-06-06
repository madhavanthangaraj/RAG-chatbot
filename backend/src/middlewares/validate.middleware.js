const { BadRequestError } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(new BadRequestError(`Validation error: ${messages}`));
    }
    next(error);
  }
};

module.exports = validate;
