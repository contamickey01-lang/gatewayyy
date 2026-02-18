const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { auth, sellerOnly } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// Public route for checkout
router.get('/public/:id', productController.getPublic);

// Protected routes (seller)
router.use(auth, sellerOnly);

router.post('/', [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('price').isFloat({ min: 0.01 }).withMessage('Preço deve ser maior que zero'),
    validate
], productController.create);

router.get('/', productController.list);
router.get('/:id', productController.getById);

router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('price').optional().isFloat({ min: 0.01 }).withMessage('Preço deve ser maior que zero'),
    validate
], productController.update);

router.delete('/:id', productController.delete);

module.exports = router;
