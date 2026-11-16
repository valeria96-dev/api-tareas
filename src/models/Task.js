const { Schema, model } = require('mongoose');

const STATUS = ['pendiente', 'en_progreso', 'completada'];

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: STATUS, default: 'pendiente' },
    attachment: { type: String, default: null },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// Un mismo usuario no puede tener dos tareas con el mismo título (genera 409)
taskSchema.index({ owner: 1, title: 1 }, { unique: true });

module.exports = { Task: model('Task', taskSchema), STATUS };
