const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const RelatorioController = require('../controllers/RelatorioController');

router.use(authMiddleware);

router.get('/meu',         RelatorioController.meu);
router.get('/departamento',requireRole('master','admin','supervisor'), RelatorioController.departamento);
router.get('/empresa',     requireRole('master','admin'), RelatorioController.empresa);
router.get('/exportar',    requireRole('master','admin','supervisor'), RelatorioController.exportarCSV);

module.exports = router;
