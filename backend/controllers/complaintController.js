exports.getComplaints = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase
      .from('complaints')
      .select('*, tenants(full_name, rooms(room_number), properties(property_name))')
      .order('created_at', { ascending: false });
    if (propertyId) {
      const { data: ids } = await supabase.from('tenants').select('id').eq('property_id', propertyId);
      const tenantIds = (ids || []).map(t => t.id);
      if (tenantIds.length > 0) query = query.in('tenant_id', tenantIds);
      else return res.json({ success: true, data: [] });
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const mapped = (data || []).map(c => ({
      ...c,
      tenant: c.tenants?.full_name || 'Unknown',
      property: c.tenants?.properties?.property_name || 'Unknown',
      room: c.tenants?.rooms?.room_number || '—',
      tenantId: c.tenant_id,
      raisedDate: c.created_at?.split('T')[0] || '',
      resolvedDate: c.resolved_at?.split('T')[0] || null
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getComplaint = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, tenants(full_name, rooms(room_number), properties(property_name))')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data: { ...data, tenant: data.tenants?.full_name || 'Unknown', property: data.tenants?.properties?.property_name || 'Unknown', room: data.tenants?.rooms?.room_number || '—' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createComplaint = async (req, res) => {
  try {
    const { tenantId, category, priority, title, description, assignedTo } = req.body;
    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        tenant_id: tenantId,
        title,
        description: description || null,
        status: 'in_progress'
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.status !== undefined) {
      updateData.status = req.body.status === 'Resolved' ? 'resolved' : req.body.status.toLowerCase().replace(' ', '_');
      if (req.body.status === 'Resolved') updateData.resolved_at = new Date().toISOString();
    }
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const { error } = await supabase.from('complaints').delete().eq('id', req.params.id);
    if (error) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
