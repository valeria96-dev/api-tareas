require('dotenv').config();
const http = require('http');
const { app, sessionMiddleware } = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./realtime/socket');

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/api_tareas');
  const server = http.createServer(app);
  initSocket(server, sessionMiddleware);
  server.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
};

start().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});
