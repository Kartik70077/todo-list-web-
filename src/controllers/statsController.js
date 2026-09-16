const { queryAll, queryOne } = require('../../database/db');

function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Status counts
    const statusCounts = queryOne(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN due_date = ? AND status != 'completed' THEN 1 ELSE 0 END) as due_today,
        SUM(CASE WHEN due_date < ? AND status != 'completed' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN due_date > ? AND status != 'completed' THEN 1 ELSE 0 END) as upcoming
       FROM todos
       WHERE user_id = ?`,
      [todayStr, todayStr, todayStr, userId]
    );

    // Priority breakdown
    const priorityCounts = queryOne(
      `SELECT 
        SUM(CASE WHEN priority = 'high' AND status != 'completed' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN priority = 'medium' AND status != 'completed' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN priority = 'low' AND status != 'completed' THEN 1 ELSE 0 END) as low
       FROM todos
       WHERE user_id = ?`,
      [userId]
    );

    // Categories summary
    const categoryStats = queryAll(
      `SELECT c.id, c.name, c.color,
              COUNT(t.id) as total_tasks,
              SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
       FROM categories c
       LEFT JOIN todos t ON t.category_id = c.id AND t.user_id = ?
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY total_tasks DESC`,
      [userId, userId]
    );

    const total = statusCounts.total || 0;
    const completed = statusCounts.completed || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        total,
        pending: statusCounts.pending || 0,
        in_progress: statusCounts.in_progress || 0,
        completed,
        due_today: statusCounts.due_today || 0,
        overdue: statusCounts.overdue || 0,
        upcoming: statusCounts.upcoming || 0,
        completionRate,
        priorities: {
          high: priorityCounts.high || 0,
          medium: priorityCounts.medium || 0,
          low: priorityCounts.low || 0
        },
        categories: categoryStats
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats
};
