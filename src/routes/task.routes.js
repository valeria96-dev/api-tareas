const router = require('express').Router();
const ctrl = require('../controllers/task.controller');
const { requireAuth } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const { handleValidation, idParam, createTaskRules, updateTaskRules } = require('../middlewares/validate');

router.use(requireAuth); // todas las rutas de tareas requieren sesión

router.get('/', ctrl.list);
router.get('/:id', idParam, handleValidation, ctrl.get);
router.post('/', createTaskRules, handleValidation, ctrl.create);
router.patch('/:id', updateTaskRules, handleValidation, ctrl.update);
router.delete('/:id', idParam, handleValidation, ctrl.remove);
router.post('/:id/attachment', idParam, handleValidation, upload.single('archivo'), ctrl.uploadAttachment);
router.get('/:id/attachment', idParam, handleValidation, ctrl.downloadAttachment);

module.exports = router;
