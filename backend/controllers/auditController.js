const supabase = require('../config/supabase');

exports.getAuditLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    res.json({
      success: true,
      data: (data || []).map(log => ({
        id: String(log.id),
        operator: log.operator || 'System',
        action: log.action,
        details: log.details || '',
        date: log.date ? log.date.substring(0, 19).replace('T', ' ') : ''
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
