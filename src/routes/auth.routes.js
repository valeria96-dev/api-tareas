const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');
const { authRules, handleValidation } = require('../middlewares/validate');

router.post('/register', authRules, handleValidation, ctrl.register);
router.post('/login', authRules, handleValidation, ctrl.login);
router.post('/logout', requireAuth, ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
