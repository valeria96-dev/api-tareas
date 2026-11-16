const path = require('path');
const service = require('../services/task.service');
const AppError = require('../utils/AppError');
const { notify } = require('../realtime/socket');
const { UPLOAD_DIR } = require('../middlewares/upload');

// Express 5 captura automáticamente los errores de las funciones async
const list = async (req, res) => res.json(await service.list(req.session.userId));

const get = async (req, res) => res.json(await service.get(req.params.id, req.session.userId));

const create = async (req, res) => {
  const task = await service.create(req.session.userId, req.body);
  notify(req.session.userId, 'task:created', task);
  res.status(201).location(`/api/tasks/${task.id}`).json(task);
};

const update = async (req, res) => {
  const task = await service.update(req.params.id, req.session.userId, req.body);
  notify(req.session.userId, 'task:updated', task);
  res.json(task);
};

const remove = async (req, res) => {
  await service.remove(req.params.id, req.session.userId);
  notify(req.session.userId, 'task:deleted', { id: req.params.id });
  res.status(204).end();
};

const uploadAttachment = async (req, res) => {
  if (!req.file) throw new AppError(400, 'FILE_REQUIRED', 'Envía un archivo en el campo "archivo"');
  const task = await service.attach(req.params.id, req.session.userId, req.file.filename);
  notify(req.session.userId, 'task:updated', task);
  res.json(task);
};

// La descarga pasa por la API: solo el dueño de la tarea puede ver su archivo
const downloadAttachment = async (req, res) => {
  const task = await service.get(req.params.id, req.session.userId);
  if (!task.attachment) throw new AppError(404, 'NO_ATTACHMENT', 'La tarea no tiene archivo adjunto');
  res.sendFile(path.join(UPLOAD_DIR, path.basename(task.attachment)));
};

module.exports = { list, get, create, update, remove, uploadAttachment, downloadAttachment };
