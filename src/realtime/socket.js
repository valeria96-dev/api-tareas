const { Server } = require('socket.io');

let io = null;

// Comparte la sesión de Express con Socket.io: solo usuarios con sesión se conectan,
// y cada uno entra a su propia "sala" para recibir solo SUS notificaciones.
const initSocket = (server, sessionMiddleware) => {
  io = new Server(server);
  io.engine.use(sessionMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.request.session?.userId;
    if (!userId) return socket.disconnect(true);
    socket.join(`user:${userId}`);
    console.log(`Socket conectado (usuario ${userId})`);
  });
};

// Si Socket.io no está iniciado (por ejemplo en las pruebas), no hace nada
const notify = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, notify };
