// Capa de acceso a datos: es el ÚNICO lugar que habla con MongoDB para tareas.
const { Task } = require('../models/Task');

const findAll = (owner) => Task.find({ owner }).sort({ createdAt: -1 }).lean();

const findById = (id, owner) => Task.findOne({ _id: id, owner }).lean();

const create = async (data) => (await Task.create(data)).toObject();

// Bloqueo optimista: solo actualiza si la versión coincide con la que tiene el cliente
const updateWithVersion = (id, owner, version, changes) =>
  Task.findOneAndUpdate(
    { _id: id, owner, __v: version },
    { $set: changes, $inc: { __v: 1 } },
    { new: true, runValidators: true }
  ).lean();

const setAttachment = (id, owner, filename) =>
  Task.findOneAndUpdate(
    { _id: id, owner },
    { $set: { attachment: filename }, $inc: { __v: 1 } },
    { new: true }
  ).lean();

const remove = (id, owner) => Task.findOneAndDelete({ _id: id, owner }).lean();

module.exports = { findAll, findById, create, updateWithVersion, setAttachment, remove };
