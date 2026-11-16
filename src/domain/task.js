// Funciones PURAS: no hacen E/S y no mutan sus argumentos.

// Convierte el documento de la BD en la forma pública que devuelve la API
const toPublicTask = (doc) => ({
  id: String(doc._id),
  title: doc.title,
  description: doc.description,
  status: doc.status,
  attachment: doc.attachment,
  version: doc.__v,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

// Toma solo los campos editables y descarta los que no vienen (undefined)
const pickTaskFields = ({ title, description, status }) =>
  Object.fromEntries(
    Object.entries({ title, description, status }).filter(([, value]) => value !== undefined)
  );

const toPublicUser = (doc) => ({ id: String(doc._id), username: doc.username });

module.exports = { toPublicTask, pickTaskFields, toPublicUser };
