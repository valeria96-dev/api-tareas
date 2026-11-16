const service = require('../services/auth.service');

const register = async (req, res) => {
  const user = await service.register(req.body.username, req.body.password);
  req.session.userId = user.id;
  res.status(201).json(user);
};

const login = async (req, res) => {
  const user = await service.verifyCredentials(req.body.username, req.body.password);
  req.session.userId = user.id;
  res.json(user);
};

const logout = (req, res, next) =>
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.status(204).end();
  });

const me = (req, res) => res.json({ id: req.session.userId });

module.exports = { register, login, logout, me };
