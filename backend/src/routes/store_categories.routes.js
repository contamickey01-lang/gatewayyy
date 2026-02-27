const express = require('express');
const router = express.Router();
const storeCategoryController = require('../controllers/store_categories.controller');
const { auth } = require('../middlewares/auth.middleware');

router.use(auth);

router.post('/', storeCategoryController.create);
router.get('/', storeCategoryController.list);
router.put('/:id', storeCategoryController.update);
router.delete('/:id', storeCategoryController.delete);

module.exports = router;
