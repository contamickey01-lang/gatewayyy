const express = require('express');
const { body } = require('express-validator');
const checkoutController = require('../controllers/checkout.controller');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

router.post('/pay', [
    body('product_id').notEmpty().withMessage('Produto é obrigatório'),
    body('payment_method').isIn(['pix', 'credit_card']).withMessage('Método de pagamento inválido'),
    body('buyer.name').notEmpty().withMessage('Nome do comprador é obrigatório'),
    body('buyer.email').isEmail().withMessage('Email do comprador é inválido'),
    body('buyer.cpf').notEmpty().withMessage('CPF do comprador é obrigatório'),
    validate
], checkoutController.processPayment);

router.get('/order/:id', checkoutController.getOrderStatus);

module.exports = router;
