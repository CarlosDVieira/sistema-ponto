const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth');
const AuthController = require('../controllers/AuthController');

router.post('/login',   AuthController.login);
router.post('/logout',  authMiddleware, AuthController.logout);
router.get('/me',       authMiddleware, AuthController.me);
router.post('/refresh', AuthController.refresh);
router.put('/senha',    authMiddleware, AuthController.alterarSenha);

module.exports = router;
