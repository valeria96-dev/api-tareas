const AppError = require('../utils/AppError');

// Función pura: traduce cualquier error a un AppError
const normalizeError = (err) => {
  if (err instanceof AppError) return err;
  if (err.code === 11000)
    return new AppError(409, 'DUPLICATE', 'Ya existe un registro con esos datos', err.keyValue);
  if (err.code === 'LIMIT_FILE_SIZE')
    return new AppError(413, 'FILE_TOO_LARGE', 'El archivo supera el tamaño máximo de 2 MB');
  if (err.name === 'MulterError')
    return new AppError(400, 'UPLOAD_ERROR', err.message);
  if (err.type === 'entity.parse.failed')
    return new AppError(400, 'INVALID_JSON', 'El cuerpo de la petición no es un JSON válido');
  if (err.name === 'ValidationError' || err.name === 'CastError')
    return new AppError(400, 'VALIDATION_ERROR', err.message);
  return new AppError(500, 'INTERNAL_ERROR', 'Error interno del servidor');
};

const notFoundRoute = (req, res, next) =>
  next(new AppError(404, 'ROUTE_NOT_FOUND', `La ruta ${req.method} ${req.originalUrl} no existe`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const e = normalizeError(err);
  if (e.status === 500) console.error(err);
  res.status(e.status).json({ error: { code: e.code, message: e.message, details: e.details } });
};

module.exports = { errorHandler, notFoundRoute, normalizeError };
