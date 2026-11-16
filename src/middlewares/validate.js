const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { STATUS } = require('../models/Task');

// Convierte los errores de express-validator al formato uniforme de la API
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(new AppError(400, 'VALIDATION_ERROR', 'Datos de entrada inválidos', details));
};

const idParam = [param('id').isMongoId().withMessage('El id no es válido')];

const titleRule = (required) => {
  const rule = body('title');
  return (required ? rule : rule.optional())
    .isString().withMessage('El título debe ser texto').bail()
    .trim().isLength({ min: 3, max: 100 }).withMessage('El título debe tener entre 3 y 100 caracteres');
};

const descriptionRule = () =>
  body('description').optional().isString().withMessage('La descripción debe ser texto').bail()
    .isLength({ max: 500 }).withMessage('La descripción admite máximo 500 caracteres');

const statusRule = () =>
  body('status').optional().isIn(STATUS).withMessage(`El estado debe ser: ${STATUS.join(', ')}`);

const createTaskRules = [titleRule(true), descriptionRule(), statusRule()];

const updateTaskRules = [
  ...idParam,
  titleRule(false),
  descriptionRule(),
  statusRule(),
  body('version').isInt({ min: 0 }).withMessage('version es obligatoria y debe ser un entero').toInt()
];

const authRules = [
  body('username').isString().withMessage('El usuario es obligatorio').bail().trim()
    .isLength({ min: 3, max: 30 }).withMessage('El usuario debe tener entre 3 y 30 caracteres')
    .isAlphanumeric().withMessage('El usuario solo puede tener letras y números'),
  body('password').isString().withMessage('La contraseña es obligatoria').bail()
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

module.exports = { handleValidation, idParam, createTaskRules, updateTaskRules, authRules };
