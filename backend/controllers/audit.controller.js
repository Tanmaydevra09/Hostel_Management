const pool = require('../config/db');

exports.getLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '',
      role = '',
      module = '',
      action = '',
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const queryParams = [];

    if (search) {
      query += ' AND (user_name LIKE ? OR description LIKE ? OR action LIKE ? OR module LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (role) {
      query += ' AND role = ?';
      queryParams.push(role);
    }

    if (module) {
      query += ' AND module = ?';
      queryParams.push(module);
    }

    if (action) {
      query += ' AND action = ?';
      queryParams.push(action);
    }

    if (startDate) {
      query += ' AND DATE(timestamp) >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(timestamp) <= ?';
      queryParams.push(endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    
    // Create params for the main query
    const mainParams = [...queryParams, parseInt(limit), parseInt(offset)];

    // Get total count for pagination
    const countQuery = query.split('ORDER BY')[0].replace('SELECT *', 'SELECT COUNT(*) as total');
    
    const [rows] = await pool.query(query, mainParams);
    const [countResult] = await pool.query(countQuery, queryParams);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFilterOptions = async (req, res, next) => {
    try {
        const [modules] = await pool.query('SELECT DISTINCT module FROM audit_logs WHERE module IS NOT NULL ORDER BY module');
        const [actions] = await pool.query('SELECT DISTINCT action FROM audit_logs WHERE action IS NOT NULL ORDER BY action');
        
        res.json({
            success: true,
            modules: modules.map(m => m.module),
            actions: actions.map(a => a.action)
        });
    } catch (error) {
        next(error);
    }
};
