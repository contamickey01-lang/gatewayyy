const express = require('express');
const { body } = require('express-validator');
const withdrawalController = require('../controllers/withdrawal.controller');
const { auth, sellerOnly } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

router.use(auth, sellerOnly);

router.post('/', [
    body('amount').isFloat({ min: 1 }).withMessage('Valor mínimo de R$1,00'),
    validate
], withdrawalController.request);

router.get('/', withdrawalController.list);
router.get('/balance', withdrawalController.getBalance);

module.exports = router;
