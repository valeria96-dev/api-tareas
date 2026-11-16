const repo = require('../repositories/task.repository');
const AppError = require('../utils/AppError');
const { toPublicTask, pickTaskFields } = require('../domain/task');

const notFound = () => new AppError(404, 'NOT_FOUND', 'Tarea no encontrada');

const list = async (owner) => (await repo.findAll(owner)).map(toPublicTask);

const get = async (id, owner) => {
  const task = await repo.findById(id, owner);
  if (!task) throw notFound();
  return toPublicTask(task);
};

const create = async (owner, body) =>
  toPublicTask(await repo.create({ ...pickTaskFields(body), owner }));

const update = async (id, owner, body) => {
  const updated = await repo.updateWithVersion(id, owner, body.version, pickTaskFields(body));
  if (updated) return toPublicTask(updated);

  // No se actualizó: o no existe, o alguien la modificó antes (conflicto de versión)
  const current = await repo.findById(id, owner);
  if (!current) throw notFound();
  throw new AppError(409, 'VERSION_CONFLICT',
    'La tarea fue modificada por otra petición. Vuelve a consultarla e intenta de nuevo.',
    { currentVersion: current.__v, sentVersion: body.version });
};

const remove = async (id, owner) => {
  const deleted = await repo.remove(id, owner);
  if (!deleted) throw notFound();
  return toPublicTask(deleted);
};

const attach = async (id, owner, filename) => {
  const updated = await repo.setAttachment(id, owner, filename);
  if (!updated) throw notFound();
  return toPublicTask(updated);
};

module.exports = { list, get, create, update, remove, attach };
