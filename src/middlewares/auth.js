const AppError = require('../utils/AppError');

const requireAuth = (req, res, next) =>
  req.session.userId
    ? next()
    : next(new AppError(401, 'UNAUTHORIZED', 'Debes iniciar sesión'));

module.exports = { requireAuth };
