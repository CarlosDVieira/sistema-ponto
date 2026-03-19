const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const PontoController = require('../controllers/PontoController');

router.use(authMiddleware);

router.post('/registrar',         PontoController.registrar);
router.get('/hoje',               PontoController.hoje);
router.get('/status',             PontoController.status);
router.get('/online',             requireRole('master','admin','supervisor'), PontoController.online);

module.exports = router;
