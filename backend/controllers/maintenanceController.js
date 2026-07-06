const supabase = require('../config/supabase');

exports.getMainMaintenanceTasks = async (req, res) => {
  try {
    const { propertyId, status } = req.query;
    let query = supabase
      .from('maintenance_tasks')
      .select('*, properties(property_name), rooms(room_number), staff(name)')
      .order('date', { ascending: false });

    if (propertyId && propertyId !== 'all') {
      query = query.eq('property_id', propertyId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const mapped = (data || []).map(task => ({
      id: String(task.id),
      propertyId: String(task.property_id),
      propertyName: task.properties?.property_name || 'Common Area',
      roomId: task.room_id ? String(task.room_id) : null,
      roomNumber: task.rooms?.room_number || 'Common Area',
      complaintId: task.complaint_id ? String(task.complaint_id) : null,
      title: task.title,
      description: task.description || '',
      assignedStaffId: task.assigned_staff_id ? String(task.assigned_staff_id) : null,
      assignedStaffName: task.staff?.name || 'Unassigned',
      cost: Number(task.cost || 0),
      status: task.status || 'Pending',
      date: task.date || ''
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMaintenanceTask = async (req, res) => {
  try {
    const { propertyId, roomId, roomNumber, complaintId, title, description, assignedStaffId, staffId, cost, status, date } = req.body;
    
    let finalRoomId = roomId || null;
    if (!finalRoomId && roomNumber && propertyId) {
      const { data: rm } = await supabase
        .from('rooms')
        .select('id')
        .eq('property_id', propertyId)
        .eq('room_number', roomNumber)
        .limit(1);
      if (rm && rm.length > 0) finalRoomId = rm[0].id;
    }

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert([{
        property_id: propertyId,
        room_id: finalRoomId,
        complaint_id: complaintId || null,
        title,
        description: description || null,
        assigned_staff_id: assignedStaffId || staffId || null,
        cost: cost || 0,
        status: status || 'Pending',
        date: date || new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMaintenanceTask = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.cost !== undefined) updateData.cost = req.body.cost;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.assignedStaffId !== undefined) updateData.assigned_staff_id = req.body.assignedStaffId || null;
    if (req.body.date !== undefined) updateData.date = req.body.date;

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Maintenance task not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMaintenanceTask = async (req, res) => {
  try {
    const { error } = await supabase.from('maintenance_tasks').delete().eq('id', req.params.id);
    if (error) return res.status(404).json({ success: false, message: 'Maintenance task not found' });
    res.json({ success: true, message: 'Maintenance task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
