// Pruebas de integración con el runner nativo de Node (node --test) y supertest.
// Requiere MongoDB corriendo; usa una base de datos de prueba separada.
require('dotenv').config();
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/app');
const { pickTaskFields } = require('../src/domain/task');

const agent = request.agent(app); // agent conserva la cookie de sesión entre peticiones

before(async () => {
  mongoose.set('sanitizeFilter', true);
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/api_tareas_test');
  await mongoose.connection.dropDatabase();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Funciones puras', () => {
  test('pickTaskFields descarta campos no permitidos y no muta la entrada', () => {
    const input = { title: 'Hola', owner: 'hacker', __v: 99 };
    assert.deepEqual(pickTaskFields(input), { title: 'Hola' });
    assert.deepEqual(input, { title: 'Hola', owner: 'hacker', __v: 99 });
  });
});

describe('Autenticación', () => {
  test('401 si no hay sesión', async () => {
    const res = await request(app).get('/api/tasks');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  test('400 con datos de registro inválidos', async () => {
    const res = await agent.post('/api/auth/register').send({ username: 'a', password: '1' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.details.length > 0);
  });

  test('201 al registrarse y 409 si el usuario ya existe', async () => {
    const ok = await agent.post('/api/auth/register').send({ username: 'ana', password: 'secreto123' });
    assert.equal(ok.status, 201);
    const dup = await request(app).post('/api/auth/register').send({ username: 'ana', password: 'secreto123' });
    assert.equal(dup.status, 409);
  });

  test('401 con contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'ana', password: 'malamala' });
    assert.equal(res.status, 401);
  });

  test('inyección NoSQL en el login no funciona', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });
});

describe('CRUD de tareas', () => {
  let task;

  test('201 al crear', async () => {
    const res = await agent.post('/api/tasks').send({ title: 'Estudiar Node', description: 'Unidad 2' });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'pendiente');
    assert.equal(res.body.version, 0);
    task = res.body;
  });

  test('400 si falta el título', async () => {
    const res = await agent.post('/api/tasks').send({ description: 'sin título' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  test('409 si el título está repetido', async () => {
    const res = await agent.post('/api/tasks').send({ title: 'Estudiar Node' });
    assert.equal(res.status, 409);
  });

  test('200 al listar y al obtener por id', async () => {
    assert.equal((await agent.get('/api/tasks')).body.length, 1);
    assert.equal((await agent.get(`/api/tasks/${task.id}`)).status, 200);
  });

  test('400 con id inválido y 404 con id inexistente', async () => {
    assert.equal((await agent.get('/api/tasks/123')).status, 400);
    assert.equal((await agent.get('/api/tasks/507f1f77bcf86cd799439011')).status, 404);
  });

  test('200 al actualizar y 409 si la versión está desactualizada', async () => {
    const ok = await agent.patch(`/api/tasks/${task.id}`).send({ status: 'completada', version: 0 });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.version, 1);
    const conflict = await agent.patch(`/api/tasks/${task.id}`).send({ status: 'pendiente', version: 0 });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.error.code, 'VERSION_CONFLICT');
  });

  test('415 con tipo de archivo no permitido y 200 con PNG', async () => {
    const bad = await agent.post(`/api/tasks/${task.id}/attachment`)
      .attach('archivo', Buffer.from('hola'), { filename: 'x.txt', contentType: 'text/plain' });
    assert.equal(bad.status, 415);
    const ok = await agent.post(`/api/tasks/${task.id}/attachment`)
      .attach('archivo', Buffer.from('fakepng'), { filename: 'x.png', contentType: 'image/png' });
    assert.equal(ok.status, 200);
    assert.match(ok.body.attachment, /\.png$/);
    const download = await agent.get(`/api/tasks/${task.id}/attachment`);
    assert.equal(download.status, 200);
  });

  test('otro usuario no puede ver la tarea (404)', async () => {
    const other = request.agent(app);
    await other.post('/api/auth/register').send({ username: 'beto', password: 'secreto123' });
    assert.equal((await other.get(`/api/tasks/${task.id}`)).status, 404);
  });

  test('204 al eliminar y 404 al repetir', async () => {
    assert.equal((await agent.delete(`/api/tasks/${task.id}`)).status, 204);
    assert.equal((await agent.delete(`/api/tasks/${task.id}`)).status, 404);
  });

  test('404 en ruta inexistente y 400 con JSON mal formado', async () => {
    const res = await agent.get('/api/nada');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
    const bad = await agent.post('/api/tasks').set('Content-Type', 'application/json').send('{malo');
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'INVALID_JSON');
  });
});
