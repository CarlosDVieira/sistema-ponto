const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middlewares/auth');
const DeptoController = require('../controllers/DeptoController');

router.use(authMiddleware);

router.get('/',       DeptoController.listar);
router.post('/',      requireRole('master','admin'), DeptoController.criar);
router.put('/:id',    requireRole('master','admin'), DeptoController.atualizar);
router.delete('/:id', requireRole('master','admin'), DeptoController.excluir);

module.exports = router;
