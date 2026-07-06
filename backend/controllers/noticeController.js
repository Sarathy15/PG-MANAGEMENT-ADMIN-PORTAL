const supabase = require('../config/supabase');
const { logAudit } = require('../utils/auditLogger');

exports.getNotices = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase
      .from('notices')
      .select('*, properties(property_name)')
      .order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const mapped = (data || []).map(n => ({
      ...n,
      property: n.properties?.property_name || 'Unknown',
      propertyId: n.property_id,
      targetAudience: n.target_audience,
      publishDate: n.publish_date,
      expiryDate: n.expiry_date,
      readCount: n.read_count
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotice = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*, properties(property_name)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: { ...data, property: data.properties?.property_name || 'Unknown' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const { propertyId, title, content, category, targetAudience, publishDate, expiryDate, status } = req.body;
    
    const dbPropertyId = (propertyId === 'all' || !propertyId) ? null : Number(propertyId);

    const { data, error } = await supabase
      .from('notices')
      .insert([{
        property_id: dbPropertyId,
        title,
        content,
        category: category || 'General',
        target_audience: targetAudience || 'All Tenants',
        publish_date: publishDate || new Date().toISOString().split('T')[0],
        expiry_date: expiryDate || null,
        status: status || 'Active',
        read_count: 0
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Broadcast notifications to all active tenants under this notice scope
    try {
      let tenantQuery = supabase
        .from('tenants')
        .select('id')
        .eq('status', 'active');
      
      if (dbPropertyId) {
        tenantQuery = tenantQuery.eq('property_id', dbPropertyId);
      }
      
      const { data: tenantsList, error: tenantErr } = await tenantQuery;
      
      if (!tenantErr && tenantsList && tenantsList.length > 0) {
        const categoryEmoji = category === 'Food' ? '🍽️' : category === 'Utility' ? '⚡' : category === 'Maintenance' ? '🛠️' : category === 'Warning' ? '⚠️' : '📢';
        const notificationInserts = tenantsList.map(t => ({
          tenant_id: t.id,
          title: `${categoryEmoji} Notice: ${title}`,
          message: content,
          is_read: false
        }));
        await supabase.from('notifications').insert(notificationInserts);
      }
    } catch (notifyErr) {
      console.error("Notice notification broadcast failed:", notifyErr);
    }

    // Log system audit trail
    await logAudit(
      req.user?.full_name || req.user?.name || 'Admin',
      'CREATE',
      `Published announcement: "${title}" (${category || 'General'} notice)`
    );

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.targetAudience !== undefined) updateData.target_audience = req.body.targetAudience;
    if (req.body.publishDate !== undefined) updateData.publish_date = req.body.publishDate;
    if (req.body.expiryDate !== undefined) updateData.expiry_date = req.body.expiryDate;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const { data, error } = await supabase
      .from('notices')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const { error } = await supabase.from('notices').delete().eq('id', req.params.id);
    if (error) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
