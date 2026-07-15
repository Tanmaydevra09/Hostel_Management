const pool = require('../config/db');
const logAudit = require('../utils/auditLogger');
const { sendToAllActiveUsers } = require('../utils/notifications');

const getAll = async (req, res, next) => {
  try {
    const { category, active_only = 'true' } = req.query;
    let where = ['1=1']; const params = [];
    if (category) { where.push('n.category = ?'); params.push(category); }
    if (active_only === 'true') where.push('n.is_active = TRUE AND (n.expires_at IS NULL OR n.expires_at >= CURDATE())');

    const [rows] = await pool.query(
      `SELECT n.* FROM notices n WHERE ${where.join(' AND ')} ORDER BY n.created_at DESC`, params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { title, content, category, target_audience, expires_at } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'title and content required.' });
    const [result] = await pool.query(
      'INSERT INTO notices (title, content, category, target_audience, posted_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, category || 'General', target_audience || 'All', req.user.full_name || req.user.username, expires_at || null]
    );
    
    await logAudit(req, 'Create', 'Notices', result.insertId, `Posted notice: ${title}`);

    // Notify all active users about the new notice
    const audience = target_audience || 'All';
    const categoryLabel = category || 'General';
    await sendToAllActiveUsers(
      `📢 New Notice: ${title}`,
      `A new ${categoryLabel} notice has been posted${audience !== 'All' ? ` for ${audience}` : ''}. Tap to view.`,
      'General',
      '/notices'
    );

    res.status(201).json({ success: true, message: 'Notice posted.', id: result.insertId });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { title, content, category, is_active, expires_at } = req.body;
    await pool.query(
      'UPDATE notices SET title=?, content=?, category=?, is_active=?, expires_at=? WHERE id=?',
      [title, content, category, is_active !== undefined ? is_active : true, expires_at || null, req.params.id]
    );
    
    await logAudit(req, 'Update', 'Notices', req.params.id, `Updated notice ID ${req.params.id}`);
    
    res.json({ success: true, message: 'Notice updated.' });
  } catch (err) { next(err); }
};

const deleteNotice = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM notices WHERE id = ?', [req.params.id]);
    
    await logAudit(req, 'Delete', 'Notices', req.params.id, `Deleted notice ID ${req.params.id}`);
    
    res.json({ success: true, message: 'Notice deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, deleteNotice };
