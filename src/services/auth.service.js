const bcrypt = require('bcryptjs');
const repo = require('../repositories/user.repository');
const AppError = require('../utils/AppError');
const { toPublicUser } = require('../domain/task');

const register = async (username, password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return toPublicUser(await repo.create({ username, passwordHash }));
};

const verifyCredentials = async (username, password) => {
  const user = await repo.findByUsername(username);
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos');
  return toPublicUser(user);
};

module.exports = { register, verifyCredentials };
