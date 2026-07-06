const supabase = require('../config/supabase');

const checkUpcomingRentBills = async () => {
  try {
    // 1. Fetch all active tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, full_name, checkin_date, property_id, rooms(monthly_rent)')
      .eq('status', 'active');

    if (!tenants || tenants.length === 0) return;

    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 2);
    const targetDay = targetDate.getDate();
    
    // We get YYYY-MM of the target date to represent the upcoming billing period
    const billingPeriod = targetDate.toISOString().substring(0, 7);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    for (const tenant of tenants) {
      if (!tenant.checkin_date) continue;
      
      const checkinDate = new Date(tenant.checkin_date);
      const checkinDay = checkinDate.getDate();

      if (checkinDay === targetDay) {
        const noticeTitle = `Rent Bill Reminder: ${tenant.full_name}`;
        
        // Check if notice already created in this billing month
        const { data: existingNotice } = await supabase
          .from('notices')
          .select('id')
          .eq('title', noticeTitle)
          .gte('created_at', `${billingPeriod}-01`)
          .limit(1);

        if (!existingNotice || existingNotice.length === 0) {
          const rentAmt = tenant.rooms?.monthly_rent || 0;
          await supabase.from('notices').insert([{
            property_id: tenant.property_id,
            title: noticeTitle,
            content: `Friendly reminder: Monthly rent invoice of ₹${Number(rentAmt).toLocaleString()} for ${tenant.full_name} is billing in 2 days (on ${targetDateStr}).`,
            category: 'Billing',
            target_audience: 'All Tenants',
            publish_date: today.toISOString().split('T')[0],
            status: 'Active',
            read_count: 0
          }]);
          console.log(`[Billing System] Generated upcoming bill reminder notice for ${tenant.full_name}`);
        }
      }
    }
  } catch (err) {
    console.error('Failed to run checkUpcomingRentBills:', err);
  }
};

exports.getSummary = async (req, res) => {
  // Fire background billing reminder checker
  checkUpcomingRentBills().catch(err => console.error(err));

  try {
    const { propertyId } = req.query;

    // 1. Properties
    let propQuery = supabase.from('properties').select('id, total_rooms, total_beds, occupied_beds, vacant_beds');
    if (propertyId) propQuery = propQuery.eq('id', propertyId);
    const { data: properties } = await propQuery;
    const totalProperties = (properties || []).length;

    // Aggregate beds from properties
    const totalBeds = (properties || []).reduce((sum, p) => sum + (p.total_beds || 0), 0);
    const occupiedBeds = (properties || []).reduce((sum, p) => sum + (p.occupied_beds || 0), 0);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // 2. Rooms
    let roomQuery = supabase.from('rooms').select('id, occupied_beds, capacity');
    if (propertyId) roomQuery = roomQuery.eq('property_id', propertyId);
    const { data: rooms } = await roomQuery;
    const totalRooms = (rooms || []).length;
    const occupiedRooms = (rooms || []).filter(r => (r.occupied_beds || 0) > 0).length;
    const vacantRooms = totalRooms - occupiedRooms;

    // Get tenant IDs for this property (for sub-filters)
    let tenantIds = null;
    if (propertyId) {
      const { data: tenants } = await supabase.from('tenants').select('id').eq('property_id', propertyId);
      tenantIds = (tenants || []).map(t => t.id);
    }

    // 3. Active Tenants
    let tenantQuery = supabase.from('tenants').select('id', { count: 'exact' }).eq('status', 'active');
    if (propertyId) tenantQuery = tenantQuery.eq('property_id', propertyId);
    const { count: totalTenants } = await tenantQuery;

    // 4. Active Staff
    let staffQuery = supabase.from('staff').select('id', { count: 'exact' }).eq('active_status', 'Active');
    if (propertyId) staffQuery = staffQuery.eq('property_id', propertyId);
    const { count: totalStaff } = await staffQuery;

    // 5. Active Complaints
    let activeComplaints = 0;
    if (!propertyId || (tenantIds && tenantIds.length > 0)) {
      let compQuery = supabase.from('complaints').select('id', { count: 'exact' }).eq('status', 'in_progress');
      if (propertyId && tenantIds) {
        compQuery = compQuery.in('tenant_id', tenantIds);
      }
      const { count } = await compQuery;
      activeComplaints = count || 0;
    }

    // 6. Revenue
    let rents = [];
    if (!propertyId || (tenantIds && tenantIds.length > 0)) {
      let rentQuery = supabase.from('rent_payments').select('amount, payment_status, due_date');
      if (propertyId && tenantIds) {
        rentQuery = rentQuery.in('tenant_id', tenantIds);
      }
      const { data } = await rentQuery;
      rents = data || [];
    }

    const paidAmount = rents.filter(r => r.payment_status && r.payment_status.toLowerCase() === 'paid').reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const expectedAmount = rents.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const dueAmount = Math.max(0, expectedAmount - paidAmount);
    const overdueCount = rents.filter(r => (!r.payment_status || r.payment_status.toLowerCase() !== 'paid') && r.due_date && new Date(r.due_date) < new Date()).length;
    const collectionRate = expectedAmount > 0 ? Math.round((paidAmount / expectedAmount) * 100) : 100;

    // 7. Visitors
    let visitorsToday = 0;
    if (!propertyId || (tenantIds && tenantIds.length > 0)) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      let visitorQuery = supabase.from('visitors').select('id', { count: 'exact' })
        .gte('entry_time', todayStart.toISOString())
        .lt('entry_time', tomorrowStart.toISOString());
      if (propertyId && tenantIds) {
        visitorQuery = visitorQuery.in('tenant_id', tenantIds);
      }
      const { count: visitorCount } = await visitorQuery;
      visitorsToday = visitorCount || 0;
    }

    // Fetch recent complaints
    let recentComplaints = [];
    try {
      const { data: compList } = await supabase
        .from('complaints')
        .select('*, tenants(full_name, rooms(room_number))')
        .order('created_at', { ascending: false })
        .limit(5);
      if (compList) {
        recentComplaints = compList.map(c => ({
          id: String(c.id),
          tenantId: String(c.tenant_id),
          tenantName: c.tenants?.full_name || 'Unknown',
          roomNumber: c.tenants?.rooms?.room_number || '—',
          title: c.title,
          description: c.description,
          category: c.category || 'Other',
          priority: c.priority || 'Medium',
          status: c.status === 'resolved' ? 'Resolved' : c.status === 'in_progress' ? 'In Progress' : 'Pending',
          comments: c.comments || [],
          date: c.created_at ? c.created_at.substring(0, 10) : ''
        }));
      }
    } catch (err) {
      console.error(err);
    }

    // Fetch recent notices
    let notices = [];
    try {
      const { data: noticeList } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (noticeList) {
        notices = noticeList.map(n => ({
          id: String(n.id),
          title: n.title,
          content: n.content,
          audience: n.target_audience === 'All Tenants' ? 'Tenants' : n.target_audience === 'All Staff' ? 'Staff' : 'All',
          date: n.publish_date,
          status: n.status === 'Active' ? 'Published' : 'Draft'
        }));
      }
    } catch (err) {
      console.error(err);
    }

    res.json({
      success: true,
      data: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        occupancyRate,
        totalRevenue: paidAmount,
        pendingRent: dueAmount,
        activeComplaints,
        recentActivity: [],
        recentComplaints,
        visitorCount: visitorsToday,
        notices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
