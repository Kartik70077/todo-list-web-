const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { validateCategory } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', categoryController.listCategories);
router.post('/', validateCategory, categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
