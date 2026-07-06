const supabase = require('../config/supabase');

exports.getStaff = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase
      .from('staff')
      .select('*, properties(property_name)')
      .order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const mapped = (data || []).map(s => ({
      ...s,
      property: s.properties?.property_name || 'Unknown',
      propertyId: s.property_id,
      employeeId: s.employee_id,
      attendanceStatus: s.attendance_status,
      activeStatus: s.active_status,
      profileImage: s.profile_image,
      idProof: s.id_proof
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStaffMember = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*, properties(property_name)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, data: { ...data, property: data.properties?.property_name || 'Unknown' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { propertyId, employeeId, name, role, phone, email, shift, salary, attendanceStatus, activeStatus } = req.body;
    let profileImage = req.body.profileImage || null;
    let idProof = req.body.idProof || null;
    
    if (req.files) {
      if (req.files.profileImage) profileImage = req.files.profileImage[0].path;
      if (req.files.idProof) idProof = req.files.idProof[0].path;
    }

    const { data, error } = await supabase
      .from('staff')
      .insert([{
        property_id: propertyId,
        employee_id: employeeId,
        name,
        role,
        phone,
        email,
        shift: shift || 'Day',
        salary: Number(salary || 0),
        attendance_status: attendanceStatus || 'Present',
        active_status: activeStatus || 'Active',
        profile_image: profileImage,
        id_proof: idProof
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.shift !== undefined) updateData.shift = req.body.shift;
    if (req.body.salary !== undefined) updateData.salary = Number(req.body.salary);
    if (req.body.attendanceStatus !== undefined) updateData.attendance_status = req.body.attendanceStatus;
    if (req.body.activeStatus !== undefined) updateData.active_status = req.body.activeStatus;
    if (req.body.profileImage !== undefined) updateData.profile_image = req.body.profileImage;
    if (req.body.idProof !== undefined) updateData.id_proof = req.body.idProof;
    
    if (req.files) {
      if (req.files.profileImage) updateData.profile_image = req.files.profileImage[0].path;
      if (req.files.idProof) updateData.id_proof = req.files.idProof[0].path;
    }

    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { error } = await supabase.from('staff').delete().eq('id', req.params.id);
    if (error) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
