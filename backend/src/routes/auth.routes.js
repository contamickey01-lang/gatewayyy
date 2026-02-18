const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

router.post('/register', [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    validate
], authController.register);

router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
    validate
], authController.login);

router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email inválido'),
    validate
], authController.forgotPassword);

router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token é obrigatório'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    validate
], authController.resetPassword);

router.get('/verify-email/:token', authController.verifyEmail);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
