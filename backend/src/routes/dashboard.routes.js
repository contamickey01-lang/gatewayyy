const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { auth, sellerOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(auth, sellerOnly);
router.get('/stats', dashboardController.getStats);

module.exports = router;
