const supabase = require('../config/supabase');

exports.getRents = async (req, res) => {
  try {
    const { propertyId, month } = req.query;
    const targetMonth = month && month !== 'all' ? month : new Date().toISOString().substring(0, 7);

    // 1. Fetch all active tenants
    let tenantQuery = supabase
      .from('tenants')
      .select('*, rooms(room_number, monthly_rent)')
      .ilike('status', 'active');
    if (propertyId) {
      tenantQuery = tenantQuery.eq('property_id', propertyId);
    }

    // 2. Fetch rent payments
    let rentQuery = supabase
      .from('rent_payments');
      
    if (propertyId) {
      rentQuery = rentQuery
        .select('*, tenants!inner(full_name, phone, checkin_date, property_id, room_id, rooms(room_number))')
        .eq('tenants.property_id', propertyId);
    } else {
      rentQuery = rentQuery
        .select('*, tenants(full_name, phone, checkin_date, property_id, room_id, rooms(room_number))');
    }

    if (month && month !== 'all') {
      rentQuery = rentQuery.eq('billing_period', targetMonth);
    }

    // Run queries in parallel
    const [tenantRes, rentRes] = await Promise.all([
      tenantQuery,
      rentQuery
    ]);

    if (tenantRes.error) throw new Error(tenantRes.error.message);
    if (rentRes.error) throw new Error(rentRes.error.message);

    const activeTenants = tenantRes.data || [];
    const rentPayments = rentRes.data || [];

    const hasPaymentForTargetMonth = new Set();
    const mapped = [];

    // Push all database payments
    for (const pay of (rentPayments || [])) {
      if (pay.billing_period === targetMonth) {
        hasPaymentForTargetMonth.add(pay.tenant_id);
      }
      
      mapped.push({
        ...pay,
        tenant: pay.tenants?.full_name || 'Unknown Tenant',
        room: pay.tenants?.rooms?.room_number || '—',
        amount: Number(pay.amount || 0),
        electricityAmount: Number(pay.electricity_amount || 0),
        miscAmount: Number(pay.misc_amount || 0),
        tenantId: pay.tenant_id,
        paymentStatus: pay.payment_status,
        dueDate: pay.due_date,
        paidDate: pay.paid_date,
        paymentMethod: pay.payment_method,
        transactionId: pay.receipt_number,
        notes: pay.notes || '',
        tenants: {
          full_name: pay.tenants?.full_name || 'Unknown Tenant',
          phone: pay.tenants?.phone || '',
          checkin_date: pay.tenants?.checkin_date || ''
        }
      });
    }

    // Synthesize pending for active tenants who don't have a payment in targetMonth
    for (const tenant of (activeTenants || [])) {
      if (!hasPaymentForTargetMonth.has(tenant.id)) {
        const rentAmount = Number(tenant.rooms?.monthly_rent || 0);
        const checkinDate = tenant.checkin_date || new Date().toISOString().split('T')[0];
        const dayStr = checkinDate.split('-')[2] || '05';
        const dueDate = `${targetMonth}-${dayStr}`;

        mapped.push({
          id: `synthesized-${tenant.id}`,
          tenant_id: tenant.id,
          amount: rentAmount,
          electricity_amount: 0,
          misc_amount: 0,
          due_date: dueDate,
          paid_date: null,
          payment_status: 'pending',
          payment_method: 'UPI',
          receipt_number: null,
          billing_period: targetMonth,
          notes: '',
          tenant: tenant.full_name,
          room: tenant.rooms?.room_number || '—',
          electricityAmount: 0,
          miscAmount: 0,
          tenantId: tenant.id,
          paymentStatus: 'pending',
          dueDate: dueDate,
          paidDate: null,
          paymentMethod: 'UPI',
          transactionId: null,
          tenants: {
            full_name: tenant.full_name,
            phone: tenant.phone || '',
            checkin_date: tenant.checkin_date || ''
          }
        });
      }
    }

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRent = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rent_payments')
      .select('*, tenants(full_name, phone, checkin_date, rooms(room_number))')
      .eq('id', Number(req.params.id))
      .single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    if (!data) return res.status(404).json({ success: false, message: 'Rent record not found' });
    res.json({ success: true, data: { ...data, tenant: data.tenants?.full_name || 'Unknown', room: data.tenants?.rooms?.room_number || '—', electricityAmount: Number(data.electricity_amount || 0), miscAmount: Number(data.misc_amount || 0) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRent = async (req, res) => {
  try {
    const { tenantId, amount, electricityAmount, miscAmount, dueDate, paymentStatus, paymentMethod, transactionId } = req.body;
      const finalStatus = (paymentStatus || 'pending').toLowerCase();
      const paidDate = finalStatus === 'paid' ? new Date().toISOString().split('T')[0] : null;
      const { data, error } = await supabase
        .from('rent_payments')
        .insert([{
          tenant_id: tenantId,
          amount: Number(amount),
          electricity_amount: Number(electricityAmount || 0),
          misc_amount: Number(miscAmount || 0),
          due_date: dueDate,
          paid_date: paidDate,
          payment_status: finalStatus,
          payment_method: paymentMethod || 'UPI',
          receipt_number: transactionId || null,
          billing_period: dueDate ? dueDate.substring(0, 7) : null
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
  
      // Sync tenant paymentStatus
      if (paymentStatus) {
        await supabase.from('tenants').update({ payment_status: finalStatus }).eq('id', tenantId);
      }

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRent = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.paymentStatus !== undefined) {
      const finalStatus = req.body.paymentStatus.toLowerCase();
      updateData.payment_status = finalStatus;
      if (finalStatus === 'paid') {
        updateData.paid_date = new Date().toISOString().split('T')[0];
      }
    }
    if (req.body.paymentMethod !== undefined) updateData.payment_method = req.body.paymentMethod;
    if (req.body.transactionId !== undefined) updateData.receipt_number = req.body.transactionId;
    if (req.body.amount !== undefined) updateData.amount = Number(req.body.amount);
    if (req.body.electricityAmount !== undefined) updateData.electricity_amount = Number(req.body.electricityAmount);
    if (req.body.miscAmount !== undefined) updateData.misc_amount = Number(req.body.miscAmount);
    if (req.body.dueDate !== undefined) updateData.due_date = req.body.dueDate;

    const { data, error } = await supabase
      .from('rent_payments')
      .update(updateData)
      .eq('id', Number(req.params.id))
      .select()
      .single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    if (!data) return res.status(404).json({ success: false, message: 'Rent record not found' });

    // Sync tenant paymentStatus
    if (req.body.paymentStatus) {
      await supabase.from('tenants').update({ payment_status: req.body.paymentStatus.toLowerCase() }).eq('id', data.tenant_id);
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRent = async (req, res) => {
  try {
    const { error } = await supabase.from('rent_payments').delete().eq('id', Number(req.params.id));
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Rent record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateRentBills = async (req, res) => {
  try {
    const { month, electricityAmount, miscAmount, notes } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'Billing month is required' });
    }

    // 1. Fetch all active tenants
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, full_name, room_id, rooms(monthly_rent)')
      .eq('status', 'active');
    
    if (tenantError) throw new Error(tenantError.message);

    // 2. Fetch existing rent payments for this billing period
    const { data: existingRents, error: rentError } = await supabase
      .from('rent_payments')
      .select('tenant_id')
      .eq('billing_period', month);

    if (rentError) throw new Error(rentError.message);

    const existingTenantIds = new Set((existingRents || []).map(r => r.tenant_id));

    const inserts = [];
    const dueDate = `${month}-05`;

    for (const tenant of (tenants || [])) {
      if (existingTenantIds.has(tenant.id)) {
        continue;
      }
      
      const rentAmount = Number(tenant.rooms?.monthly_rent || 0);
      const receiptNumber = "INV-" + Math.floor(100000 + Math.random() * 900000);

      inserts.push({
        tenant_id: tenant.id,
        amount: rentAmount,
        electricity_amount: Number(electricityAmount || 0),
        misc_amount: Number(miscAmount || 0),
        due_date: dueDate,
        payment_status: 'pending',
        payment_method: 'UPI',
        receipt_number: receiptNumber,
        billing_period: month,
        notes: notes || null
      });
    }

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('rent_payments')
        .insert(inserts);
      if (insertError) throw new Error(insertError.message);
    }

    res.json({ success: true, count: inserts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
