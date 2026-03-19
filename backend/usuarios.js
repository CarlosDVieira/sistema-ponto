const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const UsuarioController = require('../controllers/UsuarioController');

router.use(authMiddleware);

router.get('/',       requireRole('master','admin','supervisor'), UsuarioController.listar);
router.post('/',      requireRole('master','admin'), UsuarioController.criar);
router.get('/:id',    UsuarioController.buscar);
router.put('/:id',    requireRole('master','admin'), UsuarioController.atualizar);
router.delete('/:id', requireRole('master','admin'), UsuarioController.excluir);
router.post('/:id/foto', upload.single('foto'), UsuarioController.uploadFoto);

module.exports = router;
