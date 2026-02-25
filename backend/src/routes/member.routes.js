const express = require('express');
const memberController = require('../controllers/member.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

// All member routes require authentication
router.use(auth);

// Product listing for the user
router.get('/my-products', memberController.listMyProducts);

// Course content
router.get('/course/:productId', memberController.getCourseContent);
router.get('/lesson/:lessonId', memberController.getLesson);

module.exports = router;
