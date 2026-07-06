const supabase = require('../config/supabase');

exports.searchAll = async (req, res) => {
  try {
    const { q, propertyId } = req.query;
    if (!q) {
      return res.json({ success: true, data: { rooms: [], tenants: [], staff: [], complaints: [], notices: [], visitors: [] } });
    }

    const searchTerm = `%${q}%`;

    // 1. Rooms
    let roomQuery = supabase
      .from('rooms')
      .select('*, properties(property_name)')
      .or(`room_number.ilike.${searchTerm},room_type.ilike.${searchTerm}`)
      .limit(10);
    if (propertyId) roomQuery = roomQuery.eq('property_id', propertyId);
    const { data: rooms } = await roomQuery;

    // 2. Tenants
    let tenantQuery = supabase
      .from('tenants')
      .select('*, properties(property_name)')
      .or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(10);
    if (propertyId) tenantQuery = tenantQuery.eq('property_id', propertyId);
    const { data: tenants } = await tenantQuery;

    // 3. Staff
    let staffQuery = supabase
      .from('staff')
      .select('*, properties(property_name)')
      .or(`name.ilike.${searchTerm},role.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .limit(10);
    if (propertyId) staffQuery = staffQuery.eq('property_id', propertyId);
    const { data: staff } = await staffQuery;

    // 4. Complaints
    let compQuery = supabase
      .from('complaints')
      .select('*, tenants(full_name, properties(property_name))')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(10);
    const { data: complaints } = await compQuery;

    // 5. Notices
    let noticeQuery = supabase
      .from('notices')
      .select('*, properties(property_name)')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},category.ilike.${searchTerm}`)
      .limit(10);
    if (propertyId) noticeQuery = noticeQuery.eq('property_id', propertyId);
    const { data: notices } = await noticeQuery;

    // 6. Visitors
    let visitorQuery = supabase
      .from('visitors')
      .select('*, tenants(full_name, properties(property_name))')
      .or(`visitor_name.ilike.${searchTerm},visitor_phone.ilike.${searchTerm},purpose.ilike.${searchTerm}`)
      .limit(10);
    const { data: visitors } = await visitorQuery;

    res.json({
      success: true,
      data: {
        rooms: (rooms || []).map(r => ({ ...r, property: r.properties?.property_name || 'Unknown', roomNumber: r.room_number, roomType: r.room_type })),
        tenants: (tenants || []).map(t => ({ ...t, property: t.properties?.property_name || 'Unknown', tenantName: t.full_name })),
        staff: (staff || []).map(s => ({ ...s, property: s.properties?.property_name || 'Unknown' })),
        complaints: (complaints || []).map(c => ({ ...c, property: c.tenants?.properties?.property_name || 'Unknown', tenant: c.tenants?.full_name || 'Unknown' })),
        notices: (notices || []).map(n => ({ ...n, property: n.properties?.property_name || 'Unknown' })),
        visitors: (visitors || []).map(v => ({ ...v, property: v.tenants?.properties?.property_name || 'Unknown', visitorName: v.visitor_name }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
