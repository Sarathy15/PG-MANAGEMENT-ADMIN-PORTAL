const supabase = require('../config/supabase');

exports.logAudit = async (operator, action, details) => {
  try {
    await supabase
      .from('audit_logs')
      .insert([{
        operator: operator || 'System',
        action: action,
        details: details,
        date: new Date().toISOString()
      }]);
  } catch (err) {
    console.error("Failed to write system audit log:", err);
  }
};
