const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const { validateTodo } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

// All todo routes require authentication
router.use(authenticate);

router.get('/', todoController.listTodos);
router.post('/', validateTodo, todoController.createTodo);
router.get('/:id', todoController.getTodoById);
router.put('/:id', validateTodo, todoController.updateTodo);
router.patch('/:id/toggle', todoController.toggleComplete);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
