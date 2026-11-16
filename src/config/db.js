const mongoose = require('mongoose');

// Protege contra inyección NoSQL: los filtros con operadores ($gt, $ne...) se tratan como texto
mongoose.set('sanitizeFilter', true);

const connectDB = async (uri) => {
  await mongoose.connect(uri);
  console.log('MongoDB conectado');
};

module.exports = connectDB;
