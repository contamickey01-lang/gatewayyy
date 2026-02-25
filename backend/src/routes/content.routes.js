const express = require('express');
const contentController = require('../controllers/content.controller');
const { auth, sellerOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes here are protected and for sellers only
router.use(auth, sellerOnly);

// Modules
router.get('/:productId/modules', contentController.listModules);
router.post('/:productId/modules', contentController.createModule);
router.put('/modules/:moduleId', contentController.updateModule);
router.delete('/modules/:moduleId', contentController.deleteModule);

// Lessons
router.get('/modules/:moduleId/lessons', contentController.listLessons);
router.post('/modules/:moduleId/lessons', contentController.createLesson);
router.put('/lessons/:lessonId', contentController.updateLesson);
router.delete('/lessons/:lessonId', contentController.deleteLesson);

module.exports = router;
