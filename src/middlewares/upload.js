const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Nombre aleatorio: evita sobrescrituras y no confía en el nombre que manda el cliente
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ALLOWED[file.mimetype]}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) =>
    ALLOWED[file.mimetype]
      ? cb(null, true)
      : cb(new AppError(415, 'UNSUPPORTED_FILE', 'Solo se permiten archivos JPG, PNG o PDF'))
});

module.exports = { upload, UPLOAD_DIR };
