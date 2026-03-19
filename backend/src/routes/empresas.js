const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const EmpresaController = require('../controllers/EmpresaController');

router.use(authMiddleware);

router.get('/',      requireRole('master'), EmpresaController.listar);
router.post('/',     requireRole('master'), EmpresaController.criar);
router.get('/:id',   requireRole('master','admin'), EmpresaController.buscar);
router.put('/:id',   requireRole('master','admin'), EmpresaController.atualizar);
router.delete('/:id',requireRole('master'), EmpresaController.excluir);
router.post('/:id/logo', requireRole('master','admin'), upload.single('logo'), EmpresaController.uploadLogo);

module.exports = router;
