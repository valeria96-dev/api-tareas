const User = require('../models/User');

const findByUsername = (username) => User.findOne({ username }).lean();
const create = async (data) => (await User.create(data)).toObject();

module.exports = { findByUsername, create };
