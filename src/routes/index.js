const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const todoRoutes = require('./todoRoutes');
const categoryRoutes = require('./categoryRoutes');
const tagRoutes = require('./tagRoutes');
const statsRoutes = require('./statsRoutes');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/todos', todoRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/stats', statsRoutes);
router.use('/users', userRoutes);

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
