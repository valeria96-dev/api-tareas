const path = require('path');
const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const { errorHandler, notFoundRoute } = require('./middlewares/errorHandler');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'secreto-solo-para-desarrollo',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 } // 1 hora
});

const app = express();

app.use(express.json());
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFoundRoute);
app.use(errorHandler);

module.exports = { app, sessionMiddleware };
