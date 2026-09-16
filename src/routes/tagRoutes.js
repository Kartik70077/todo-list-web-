const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { validateTag } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', tagController.listTags);
router.post('/', validateTag, tagController.createTag);
router.delete('/:id', tagController.deleteTag);

module.exports = router;
