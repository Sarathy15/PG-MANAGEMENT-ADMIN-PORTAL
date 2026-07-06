exports.getVisitors = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase
      .from('visitors')
      .select('*, tenants(full_name, room_id, property_id, rooms(room_number), properties(property_name))')
      .order('entry_time', { ascending: false });
    if (propertyId) {
      const { data: ids } = await supabase.from('tenants').select('id').eq('property_id', propertyId);
      const tenantIds = (ids || []).map(t => t.id);
      if (tenantIds.length > 0) query = query.in('tenant_id', tenantIds);
      else return res.json({ success: true, data: [] });
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const mapped = (data || []).map(v => ({
      ...v,
      visitorName: v.visitor_name,
      visitingTenant: v.tenants?.full_name || 'Unknown',
      property: v.tenants?.properties?.property_name || 'Unknown',
      room: v.tenants?.rooms?.room_number || '—',
      checkInTime: v.entry_time,
      checkOutTime: v.exit_time,
      tenantId: v.tenant_id,
      otp: v.otp,
      otpVerified: v.otp_verified,
      approvalStatus: v.approval_status,
      propertyId: v.tenants?.property_id || v.propertyId || null
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVisitor = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('visitors')
      .select('*, tenants(full_name, rooms(room_number), properties(property_name))')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Visitor log not found' });
    res.json({ success: true, data: { ...data, visitingTenant: data.tenants?.full_name || 'Unknown', property: data.tenants?.properties?.property_name || 'Unknown', room: data.tenants?.rooms?.room_number || '—', otp: data.otp, otpVerified: data.otp_verified, approvalStatus: data.approval_status } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVisitor = async (req, res) => {
  try {
    const { tenantId, visitorName, name, phone, purpose, relation, checkInTime, checkOutTime, status } = req.body;
    const finalVisitorName = visitorName || name;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const { data, error } = await supabase
      .from('visitors')
      .insert([{
        tenant_id: tenantId,
        visitor_name: finalVisitorName,
        visitor_phone: phone || null,
        purpose: purpose || null,
        relation: relation || 'Friend',
        entry_time: checkInTime || new Date().toISOString(),
        exit_time: checkOutTime || null,
        status: status || 'inside',
        otp: otp,
        otp_verified: true,
        approval_status: 'Approved'
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data: { ...data, otp } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVisitor = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.visitorName !== undefined) updateData.visitor_name = req.body.visitorName;
    if (req.body.phone !== undefined) updateData.visitor_phone = req.body.phone;
    if (req.body.purpose !== undefined) updateData.purpose = req.body.purpose;
    if (req.body.checkInTime !== undefined) updateData.entry_time = req.body.checkInTime;
    if (req.body.checkOutTime !== undefined) updateData.exit_time = req.body.checkOutTime;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const { data, error } = await supabase
      .from('visitors')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Visitor log not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVisitor = async (req, res) => {
  try {
    const { error } = await supabase.from('visitors').delete().eq('id', req.params.id);
    if (error) return res.status(404).json({ success: false, message: 'Visitor log not found' });
    res.json({ success: true, message: 'Visitor log deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const { id } = req.params;
    const { data: visitor, error: getError } = await supabase
      .from('visitors')
      .select('otp')
      .eq('id', id)
      .single();
    if (getError || !visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (visitor.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const { data, error: updateError } = await supabase
      .from('visitors')
      .update({ otp_verified: true })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    res.json({ success: true, message: 'OTP verified successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveVisitor = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const { id } = req.params;
    const { data, error } = await supabase
      .from('visitors')
      .update({ approval_status: status || 'Approved' })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Visitor log not found' });

    res.json({ success: true, message: `Visitor entry ${status || 'Approved'} successfully`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkoutVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('visitors')
      .update({
        exit_time: new Date().toISOString(),
        status: 'Checked Out'
      })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Visitor log not found' });

    res.json({ success: true, message: 'Visitor checked out successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

