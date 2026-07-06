const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogger');

const getDefaultPropertyAndRoom = async () => {
  const { data: property } = await supabase
    .from('properties')
    .select('id, occupied_beds, vacant_beds')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!property) return { property: null, room: null };

  const { data: room } = await supabase
    .from('rooms')
    .select('id, capacity, occupied_beds, available_beds, status')
    .eq('property_id', property.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return { property, room };
};

exports.getTenants = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase
      .from('tenants')
      .select('*, properties(property_name), rooms(room_number, monthly_rent)')
      .order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const mapped = (data || []).map((t) => {
      const idProofType = t.aadhaar_number ? 'Aadhaar Card' : (t.pan_number ? 'PAN Card' : 'Aadhaar Card');
      const idProofNumber = t.aadhaar_number || t.pan_number || '';
      return {
        ...t,
        tenantName: t.full_name,
        full_name: t.full_name,
        phone: t.phone,
        property: t.properties?.property_name || 'Unknown',
        property_name: t.properties?.property_name || 'Unknown',
        room: t.rooms?.room_number || '—',
        room_number: t.rooms?.room_number || '—',
        propertyId: t.property_id,
        roomId: t.room_id,
        security_deposit: t.security_deposit || 0,
        rent_amount: t.rooms?.monthly_rent || 0,
        rentAmount: t.rooms?.monthly_rent || 0,
        idProofType,
        id_proof_type: idProofType,
        idProofNumber,
        id_proof_number: idProofNumber,
        emergencyContact: {
          name: t.emergency_contact_name || '',
          relation: 'Parent',
          phone: t.emergency_contact_phone || ''
        }
      };
    });
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTenant = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*, properties(property_name), rooms(room_number, monthly_rent)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Tenant not found' });
    
    const idProofType = data.aadhaar_number ? 'Aadhaar Card' : (data.pan_number ? 'PAN Card' : 'Aadhaar Card');
    const idProofNumber = data.aadhaar_number || data.pan_number || '';

    res.json({
      success: true,
      data: {
        ...data,
        full_name: data.full_name,
        property_name: data.properties?.property_name || 'Unknown',
        room_number: data.rooms?.room_number || '—',
        security_deposit: data.security_deposit || 0,
        rent_amount: data.rooms?.monthly_rent || 0,
        rentAmount: data.rooms?.monthly_rent || 0,
        idProofType,
        id_proof_type: idProofType,
        idProofNumber,
        id_proof_number: idProofNumber,
        emergencyContact: {
          name: data.emergency_contact_name || '',
          relation: 'Parent',
          phone: data.emergency_contact_phone || ''
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTenant = async (req, res) => {
  try {
    const body = req.body || {};
    const propertyId = body.propertyId || body.property_id || body.property || null;
    const roomId = body.roomId || body.room_id || body.room || null;
    const tenantName = body.tenantName || body.full_name || body.name || body.tenant || '';
    const phone = body.phone || body.tenantPhone || null;
    const email = body.email || null;
    const joiningDate = body.checkInDate || body.joiningDate || body.checkinDate || body.joinedDate || null;
    const deposit = body.depositAmount ?? body.deposit ?? body.securityDeposit ?? body.security_deposit ?? 0;
    const status = body.status || body.tenantStatus || 'active';
    const bedId = body.bedNumber || body.bedId || body.bed_id || null;

    let property = null;
    let room = null;

    if (roomId) {
      const { data: roomRow } = await supabase.from('rooms').select('id, property_id, capacity, occupied_beds, available_beds, status').eq('id', roomId).single();
      room = roomRow;
    }

    const resolvedPropertyId = propertyId || room?.property_id;

    if (resolvedPropertyId) {
      const { data: propertyRow } = await supabase.from('properties').select('id, occupied_beds, vacant_beds').eq('id', resolvedPropertyId).single();
      property = propertyRow;
    }

    if (propertyId && !property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    if (roomId && !room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (room && (room.available_beds || 0) <= 0) {
      return res.status(400).json({ success: false, message: 'No vacant beds available in this room' });
    }

    let profilePhoto = null;
    const docs = {};
    if (req.files) {
      if (req.files.profilePhoto) profilePhoto = req.files.profilePhoto[0].path;
      if (req.files.aadhaar) docs.aadhaar = req.files.aadhaar[0].path;
      if (req.files.pan) docs.pan = req.files.pan[0].path;
      if (req.files.agreement) docs.agreement = req.files.agreement[0].path;
    }

    const idProofType = body.idProofType || 'Aadhaar Card';
    const idProofNumber = body.idProofNumber || '';
    let aadhaar_number = null;
    let pan_number = null;
    if (idProofType.toLowerCase().includes('aadhaar')) {
      aadhaar_number = idProofNumber;
    } else if (idProofType.toLowerCase().includes('pan')) {
      pan_number = idProofNumber;
    } else {
      aadhaar_number = idProofNumber;
    }

    const emergencyContactName = body.emergencyContact?.name || body.emergency_contact_name || null;
    const emergencyContactPhone = body.emergencyContact?.phone || body.emergency_contact_phone || null;

    // Dynamically map document proof URL to the correct column depending on ID type
    const docUrlVal = body.docUrl || body.aadhaarPdfUrl || body.panPdfUrl || body.idCardPdfUrl || docs.aadhaar || docs.pan || docs.agreement || profilePhoto || null;
    let aadhaar_pdf_url = null;
    let pan_pdf_url = null;
    let id_card_pdf_url = null;

    if (docUrlVal) {
      if (idProofType.toLowerCase().includes('aadhaar')) {
        aadhaar_pdf_url = docUrlVal;
      } else if (idProofType.toLowerCase().includes('pan')) {
        pan_pdf_url = docUrlVal;
      } else {
        id_card_pdf_url = docUrlVal;
      }
    }

    // Generate next common_id starting with PG-001
    let nextCommonId = 'PG-001';
    try {
      const { data: lastTenants, error: lastTenantErr } = await supabase
        .from('tenants')
        .select('common_id')
        .like('common_id', 'PG-%')
        .order('id', { ascending: false })
        .limit(1);

      if (!lastTenantErr && lastTenants && lastTenants.length > 0 && lastTenants[0].common_id) {
        const lastId = lastTenants[0].common_id;
        const match = lastId.match(/^PG-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10) + 1;
          nextCommonId = `PG-${String(num).padStart(3, '0')}`;
        }
      }
    } catch (e) {
      console.error("Error generating next common_id:", e);
    }

    // Auto-create/link a user record in the users table for the tenant
    let tenantUserId = null;
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        tenantUserId = existingUser.id;
      } else {
        try {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash('tenant123', salt);
          
          const { data: newUser, error: userErr } = await supabase
            .from('users')
            .insert([{
              email: normalizedEmail,
              password_hash: passwordHash,
              full_name: tenantName,
              phone: phone || `9${Date.now().toString().slice(-9)}`,
              role: 'tenant',
              is_active: true
            }])
            .select()
            .single();

          if (!userErr && newUser) {
            tenantUserId = newUser.id;
          }
        } catch (uErr) {
          console.error("Error auto-creating user account for tenant:", uErr);
        }
      }
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert([{
        user_id: tenantUserId,
        property_id: property?.id || null,
        room_id: room?.id || null,
        bed_id: bedId,
        full_name: tenantName,
        phone,
        email: email || null,
        checkin_date: joiningDate || null,
        security_deposit: Number(deposit || 0),
        status: status || 'active',
        aadhaar_number,
        pan_number,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        aadhaar_pdf_url,
        pan_pdf_url,
        id_card_pdf_url,
        common_id: nextCommonId
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (room && property) {
      const newOccupied = (room.occupied_beds || 0) + 1;
      const newAvailable = Math.max(0, (room.available_beds || 0) - 1);
      await supabase.from('rooms').update({
        occupied_beds: newOccupied,
        available_beds: newAvailable,
        status: newOccupied >= room.capacity ? 'full' : 'partial'
      }).eq('id', room.id);

      await supabase.from('properties').update({
        occupied_beds: (property.occupied_beds || 0) + 1,
        vacant_beds: Math.max(0, (property.vacant_beds || 0) - 1)
      }).eq('id', property.id);

      // Automatically generate initial rent payment invoice for the new tenant
      const billingMonth = joiningDate ? joiningDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
      const dueDate = joiningDate || new Date().toISOString().split('T')[0];
      const receiptNumber = "INV-" + Math.floor(100000 + Math.random() * 900000);
      const rentAmount = Number(room.monthly_rent || 0);

      await supabase.from('rent_payments').insert([{
        tenant_id: tenant.id,
        amount: rentAmount,
        electricity_amount: 0,
        misc_amount: 0,
        due_date: dueDate,
        payment_status: 'pending',
        payment_method: 'UPI',
        receipt_number: receiptNumber,
        billing_period: billingMonth,
        notes: 'Initial rent invoice created on registration.'
      }]);
      
      // Update tenant's payment status to Pending
      await supabase.from('tenants').update({ payment_status: 'pending' }).eq('id', tenant.id);
    }

    // Log system audit trail
    await logAudit(
      req.user?.full_name || req.user?.name || 'Admin',
      'CHECKIN',
      `Registered and checked in tenant ${tenantName} to Room ${room?.room_number || 'Unassigned'}`
    );

    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTenant = async (req, res) => {
  try {
    const { data: oldTenant } = await supabase.from('tenants').select('*').eq('id', req.params.id).single();
    if (!oldTenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const updateData = {};
    if (req.body.tenantName || req.body.full_name) updateData.full_name = req.body.tenantName || req.body.full_name;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.joiningDate || req.body.checkinDate || req.body.checkInDate) updateData.checkin_date = req.body.joiningDate || req.body.checkinDate || req.body.checkInDate;
    if (req.body.depositAmount !== undefined || req.body.deposit !== undefined || req.body.securityDeposit !== undefined || req.body.security_deposit !== undefined) updateData.security_deposit = Number(req.body.depositAmount ?? req.body.deposit ?? req.body.securityDeposit ?? req.body.security_deposit ?? 0);
    if (req.body.bedId !== undefined || req.body.bedNumber !== undefined) updateData.bed_id = req.body.bedId ?? req.body.bedNumber;

    if (req.body.idProofType && req.body.idProofNumber) {
      if (req.body.idProofType.toLowerCase().includes('aadhaar')) {
        updateData.aadhaar_number = req.body.idProofNumber;
        updateData.pan_number = null;
      } else if (req.body.idProofType.toLowerCase().includes('pan')) {
        updateData.pan_number = req.body.idProofNumber;
        updateData.aadhaar_number = null;
      } else {
        updateData.aadhaar_number = req.body.idProofNumber;
      }
    }

    // Document URL columns — only update the field that corresponds to the current/updated ID Proof Type
    const idProofType = req.body.idProofType || (oldTenant.aadhaar_number ? 'Aadhaar Card' : (oldTenant.pan_number ? 'PAN Card' : 'Aadhaar Card'));
    
    // Get the document URL from payload
    let docUrlVal = req.body.docUrl;
    if (docUrlVal === undefined) {
      // If not sent directly, try separate params
      docUrlVal = req.body.aadhaarPdfUrl || req.body.panPdfUrl || req.body.idCardPdfUrl;
    }

    if (docUrlVal !== undefined) {
      // Reset all document URL columns first, only one should hold the active document URL
      updateData.aadhaar_pdf_url = null;
      updateData.pan_pdf_url = null;
      updateData.id_card_pdf_url = null;

      if (docUrlVal) {
        if (idProofType.toLowerCase().includes('aadhaar')) {
          updateData.aadhaar_pdf_url = docUrlVal;
        } else if (idProofType.toLowerCase().includes('pan')) {
          updateData.pan_pdf_url = docUrlVal;
        } else {
          updateData.id_card_pdf_url = docUrlVal;
        }
      }
    }

    if (req.body.emergencyContact) {
      if (req.body.emergencyContact.name) updateData.emergency_contact_name = req.body.emergencyContact.name;
      if (req.body.emergencyContact.phone) updateData.emergency_contact_phone = req.body.emergencyContact.phone;
    }

    const propertyId = req.body.propertyId || req.body.property_id;
    const roomId = req.body.roomId || req.body.room_id;

    if (roomId && String(roomId) !== String(oldTenant.room_id || '')) {
      // 1. Fetch new room
      const { data: newRoom } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (!newRoom) return res.status(404).json({ success: false, message: 'Target room not found' });
      if ((newRoom.available_beds || 0) <= 0) {
        return res.status(400).json({ success: false, message: 'Target room has no available beds' });
      }

      // 2. Release old room bed if tenant was active
      const isOldTenantActive = oldTenant.status && oldTenant.status.toLowerCase() !== 'checked_out';
      if (oldTenant.room_id && isOldTenantActive) {
        const { data: oldRoom } = await supabase.from('rooms').select('*').eq('id', oldTenant.room_id).single();
        if (oldRoom) {
          const nextOcc = Math.max(0, (oldRoom.occupied_beds || 0) - 1);
          await supabase.from('rooms').update({
            occupied_beds: nextOcc,
            available_beds: (oldRoom.available_beds || 0) + 1,
            status: nextOcc === 0 ? 'available' : 'partial'
          }).eq('id', oldTenant.room_id);
        }
        const { data: oldProp } = await supabase.from('properties').select('occupied_beds, vacant_beds').eq('id', oldTenant.property_id).single();
        if (oldProp) {
          await supabase.from('properties').update({
            occupied_beds: Math.max(0, (oldProp.occupied_beds || 0) - 1),
            vacant_beds: (oldProp.vacant_beds || 0) + 1
          }).eq('id', oldTenant.property_id);
        }
      }

      // 3. Occupy new room bed
      const nextOcc = (newRoom.occupied_beds || 0) + 1;
      await supabase.from('rooms').update({
        occupied_beds: nextOcc,
        available_beds: Math.max(0, (newRoom.available_beds || 0) - 1),
        status: nextOcc >= newRoom.capacity ? 'full' : 'partial'
      }).eq('id', newRoom.id);

      const targetPropId = propertyId || newRoom.property_id;
      const { data: newProp } = await supabase.from('properties').select('occupied_beds, vacant_beds').eq('id', targetPropId).single();
      if (newProp) {
        await supabase.from('properties').update({
          occupied_beds: (newProp.occupied_beds || 0) + 1,
          vacant_beds: Math.max(0, (newProp.vacant_beds || 0) - 1)
        }).eq('id', targetPropId);
      }

      updateData.room_id = newRoom.id;
      updateData.property_id = targetPropId;
      if (req.body.bedId === undefined && req.body.bedNumber === undefined) {
        updateData.bed_id = null;
      }
    } else if (propertyId && String(propertyId) !== String(oldTenant.property_id || '')) {
      updateData.property_id = propertyId;
    }

    const isNewStatusCheckout = req.body.status && (req.body.status.toLowerCase() === 'checked out' || req.body.status.toLowerCase() === 'checked_out');
    const isOldStatusActive = oldTenant.status && oldTenant.status.toLowerCase() !== 'checked_out';

    if (req.body.status) {
      if (isNewStatusCheckout) {
        updateData.status = 'checked_out';
      } else {
        updateData.status = req.body.status.toLowerCase() === 'active' ? 'active' : req.body.status;
      }
    }

    if (isNewStatusCheckout && isOldStatusActive) {
      updateData.checkout_date = new Date().toISOString().split('T')[0];
      updateData.room_id = null;
      const { data: room } = await supabase.from('rooms').select('*').eq('id', oldTenant.room_id).single();
      if (room) {
        const newOcc = Math.max(0, (room.occupied_beds || 0) - 1);
        const newAvail = (room.available_beds || 0) + 1;
        await supabase.from('rooms').update({
          occupied_beds: newOcc,
          available_beds: newAvail,
          status: newOcc === 0 ? 'available' : 'partial'
        }).eq('id', oldTenant.room_id);
      }
      const { data: prop } = await supabase.from('properties').select('occupied_beds, vacant_beds').eq('id', oldTenant.property_id).single();
      if (prop) {
        await supabase.from('properties').update({
          occupied_beds: Math.max(0, (prop.occupied_beds || 0) - 1),
          vacant_beds: (prop.vacant_beds || 0) + 1
        }).eq('id', oldTenant.property_id);
      }
    }

    const { data: tenant, error } = await supabase.from('tenants').update(updateData).eq('id', req.params.id).select().single();
    if (error) throw new Error(error.message);

    // Log system audit trail
    if (isNewStatusCheckout && isOldStatusActive) {
      await logAudit(
        req.user?.full_name || req.user?.name || 'Admin',
        'CHECKOUT',
        `Checked out tenant ${tenant.full_name} from Room ID ${oldTenant.room_id || 'N/A'}`
      );
    } else if (updateData.room_id !== undefined && String(updateData.room_id || '') !== String(oldTenant.room_id || '')) {
      await logAudit(
        req.user?.full_name || req.user?.name || 'Admin',
        'UPDATE',
        `Transferred tenant ${tenant.full_name} from Room ID ${oldTenant.room_id || 'None'} to Room ID ${tenant.room_id || 'None'}`
      );
    } else {
      await logAudit(
        req.user?.full_name || req.user?.name || 'Admin',
        'UPDATE',
        `Updated tenant profile details for ${tenant.full_name}`
      );
    }

    // Create a notification for the tenant if room has changed
    if (updateData.room_id !== undefined && String(updateData.room_id || '') !== String(oldTenant.room_id || '')) {
      try {
        let oldRoomNum = 'None';
        let newRoomNum = 'None';

        if (oldTenant.room_id) {
          const { data: oRoom } = await supabase.from('rooms').select('room_number').eq('id', oldTenant.room_id).single();
          if (oRoom) oldRoomNum = oRoom.room_number;
        }
        if (tenant.room_id) {
          const { data: nRoom } = await supabase.from('rooms').select('room_number').eq('id', tenant.room_id).single();
          if (nRoom) newRoomNum = nRoom.room_number;
        }

        const msg = oldRoomNum === 'None' 
          ? `Your room has been assigned to Room ${newRoomNum}.`
          : `Your room assignment has been updated from Room ${oldRoomNum} to Room ${newRoomNum}.`;

        await supabase.from('notifications').insert([{
          tenant_id: tenant.id,
          title: 'Room Details Updated',
          message: msg,
          is_read: false
        }]);
      } catch (err) {
        console.error("Room update notification error:", err);
      }
    }

    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkinTenant = async (req, res) => {
  try {
    const { data: tenant, error } = await supabase.from('tenants').update({ status: 'active' }).eq('id', req.params.id).select().single();
    if (error || !tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    // Create check-in notification
    try {
      await supabase.from('notifications').insert([{
        tenant_id: tenant.id,
        title: 'Check-In Activated',
        message: 'Welcome! Your check-in stay has been successfully activated.',
        is_read: false
      }]);
    } catch (err) {
      console.error("Check-in notification error:", err);
    }

    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkoutTenant = async (req, res) => {
  try {
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', req.params.id).single();
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    if (tenant.room_id && tenant.status?.toLowerCase() !== 'checked_out') {
      const { data: room } = await supabase.from('rooms').select('*').eq('id', tenant.room_id).single();
      if (room) {
        const nextOccupied = Math.max(0, (room.occupied_beds || 0) - 1);
        const nextStatus = nextOccupied === 0 ? 'available' : 'partial';
        await supabase.from('rooms').update({
          occupied_beds: nextOccupied,
          available_beds: (room.available_beds || 0) + 1,
          status: nextStatus
        }).eq('id', tenant.room_id);
      }
      const { data: prop } = await supabase.from('properties').select('occupied_beds, vacant_beds').eq('id', tenant.property_id).single();
      if (prop) {
        await supabase.from('properties').update({
          occupied_beds: Math.max(0, (prop.occupied_beds || 0) - 1),
          vacant_beds: (prop.vacant_beds || 0) + 1
        }).eq('id', tenant.property_id);
      }
    }

    const { data: updated, error } = await supabase
      .from('tenants')
      .update({ 
        status: 'checked_out', 
        room_id: null,
        checkout_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Create checkout notification
    try {
      await supabase.from('notifications').insert([{
        tenant_id: req.params.id,
        title: 'Check-Out Processed',
        message: 'Your check-out has been processed successfully. Thank you for staying with us!',
        is_read: false
      }]);
    } catch (err) {
      console.error("Checkout notification error:", err);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTenant = async (req, res) => {
  try {
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', req.params.id).single();
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const isTenantActive = tenant.status && tenant.status.toLowerCase() !== 'checked_out';
    if (tenant.room_id && isTenantActive) {
      const { data: room } = await supabase.from('rooms').select('*').eq('id', tenant.room_id).single();
      if (room) {
        const nextOcc = Math.max(0, (room.occupied_beds || 0) - 1);
        await supabase.from('rooms').update({
          occupied_beds: nextOcc,
          available_beds: (room.available_beds || 0) + 1,
          status: nextOcc === 0 ? 'available' : 'partial'
        }).eq('id', tenant.room_id);
      }
      const { data: prop } = await supabase.from('properties').select('occupied_beds, vacant_beds').eq('id', tenant.property_id).single();
      if (prop) {
        await supabase.from('properties').update({
          occupied_beds: Math.max(0, (prop.occupied_beds || 0) - 1),
          vacant_beds: (prop.vacant_beds || 0) + 1
        }).eq('id', tenant.property_id);
      }
    }

    const { error } = await supabase.from('tenants').delete().eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
