// Room Controller
exports.getRooms = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase
      .from('rooms')
      .select('*, properties(property_name)')
      .order('room_number', { ascending: true });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const mapped = (data || []).map(r => ({
      ...r,
      propertyName: r.properties?.property_name || 'Unknown',
      property: r.properties?.property_name || 'Unknown',
      // Expose camelCase aliases for frontend compatibility
      roomNumber: r.room_number,
      roomType: r.room_type,
      monthlyRent: r.monthly_rent,
      occupiedBeds: r.occupied_beds,
      availableBeds: r.available_beds,
      propertyId: r.property_id
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, properties(property_name)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: { ...data, property: data.properties?.property_name || 'Unknown' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const body = req.body;
    const propertyId = body.propertyId;
    const roomNumber = body.roomNumber;
    const floor = String(body.floor || 1);
    const roomType = body.type || body.roomType || 'Single';
    const capacity = Number(body.totalBeds || body.capacity || 1);
    const monthlyRent = Number(body.price || body.monthlyRent || body.monthly_rent || 0);
    const status = body.status ? body.status.toLowerCase() : 'available';

    // New configuration fields
    const acType = body.acType || body.ac_type || 'Non-AC';
    const securityDeposit = Number(body.securityDeposit || body.security_deposit || 0);
    const facilities = body.facilities || null;
    const notes = body.notes || null;
    const category = body.category || 'Standard';
    const photos = body.photos || null;

    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('id, total_rooms, total_beds, vacant_beds, occupied_beds')
      .eq('id', propertyId)
      .single();
    if (propErr || !property) return res.status(404).json({ success: false, message: 'Property not found' });

    const occupiedCount = 0;
    const availableCount = capacity;

    const { data: room, error } = await supabase
      .from('rooms')
      .insert([{
        property_id: propertyId,
        room_number: roomNumber,
        room_type: roomType,
        floor,
        capacity,
        occupied_beds: occupiedCount,
        available_beds: availableCount,
        monthly_rent: monthlyRent,
        status,
        ac_type: acType,
        security_deposit: securityDeposit,
        facilities,
        notes,
        category,
        photos
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Update property aggregates
    await supabase.from('properties').update({
      total_rooms: (property.total_rooms || 0) + 1,
      total_beds: (property.total_beds || 0) + capacity,
      vacant_beds: (property.vacant_beds || 0) + availableCount,
      occupied_beds: (property.occupied_beds || 0) + occupiedCount
    }).eq('id', propertyId);

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { data: oldRoom, error: fetchErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (fetchErr || !oldRoom) return res.status(404).json({ success: false, message: 'Room not found' });

    const body = req.body;
    const updateData = {};
    
    if (body.roomNumber !== undefined) updateData.room_number = body.roomNumber;
    if (body.type !== undefined || body.roomType !== undefined) {
      updateData.room_type = body.type || body.roomType;
    }
    if (body.floor !== undefined) updateData.floor = String(body.floor);
    
    const capacity = body.totalBeds !== undefined ? Number(body.totalBeds) : (body.capacity !== undefined ? Number(body.capacity) : undefined);
    if (capacity !== undefined) updateData.capacity = capacity;
    
    if (body.price !== undefined || body.monthlyRent !== undefined || body.monthly_rent !== undefined) {
      updateData.monthly_rent = Number(body.price || body.monthlyRent || body.monthly_rent);
    }
    if (body.status !== undefined) updateData.status = body.status.toLowerCase();
    
    const occupiedBeds = body.occupiedBeds !== undefined ? Number(body.occupiedBeds) : undefined;
    if (occupiedBeds !== undefined) updateData.occupied_beds = occupiedBeds;
    
    const availableBeds = body.availableBeds !== undefined ? Number(body.availableBeds) : undefined;
    if (availableBeds !== undefined) updateData.available_beds = availableBeds;

    // Recalculate available_beds if capacity changed and availableBeds was not sent explicitly
    if (capacity !== undefined && availableBeds === undefined) {
      const currentOccupied = occupiedBeds !== undefined ? occupiedBeds : (oldRoom.occupied_beds || 0);
      updateData.available_beds = Math.max(0, capacity - currentOccupied);
    }

    // New configuration fields support
    if (body.acType !== undefined || body.ac_type !== undefined) {
      updateData.ac_type = body.acType || body.ac_type;
    }
    if (body.securityDeposit !== undefined || body.security_deposit !== undefined) {
      updateData.security_deposit = Number(body.securityDeposit || body.security_deposit);
    }
    if (body.facilities !== undefined) updateData.facilities = body.facilities;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.photos !== undefined) updateData.photos = body.photos;

    const { data: room, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Update property aggregate beds if capacity or occupancy changed
    const diffCapacity = (room.capacity || 0) - (oldRoom.capacity || 0);
    const diffOccupied = (room.occupied_beds || 0) - (oldRoom.occupied_beds || 0);
    const diffAvailable = (room.available_beds || 0) - (oldRoom.available_beds || 0);
    if (diffCapacity !== 0 || diffOccupied !== 0 || diffAvailable !== 0) {
      const { data: prop } = await supabase.from('properties').select('total_beds, occupied_beds, vacant_beds').eq('id', oldRoom.property_id).single();
      if (prop) {
        await supabase.from('properties').update({
          total_beds: (prop.total_beds || 0) + diffCapacity,
          occupied_beds: (prop.occupied_beds || 0) + diffOccupied,
          vacant_beds: (prop.vacant_beds || 0) + diffAvailable
        }).eq('id', oldRoom.property_id);
      }
    }

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { data: room, error: fetchErr } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (fetchErr || !room) return res.status(404).json({ success: false, message: 'Room not found' });

    // 1. Delete associated stays records for this room first to avoid constraint violations
    const { error: staysErr } = await supabase.from('tenant_stays').delete().eq('room_id', roomId);
    if (staysErr) console.error("Stays delete error during room deletion:", staysErr.message);

    // 2. Delete bed records for this room
    const { error: bedsErr } = await supabase.from('beds').delete().eq('room_id', roomId);
    if (bedsErr) console.error("Beds delete error during room deletion:", bedsErr.message);

    // 3. Nullify tenant references to this room
    const { error: tenantErr } = await supabase.from('tenants').update({ room_id: null }).eq('room_id', roomId);
    if (tenantErr) console.error("Tenant nullify error during room deletion:", tenantErr.message);

    // 4. Update property aggregate counts
    const { data: prop } = await supabase.from('properties').select('total_rooms, total_beds, occupied_beds, vacant_beds').eq('id', room.property_id).single();
    if (prop) {
      await supabase.from('properties').update({
        total_rooms: Math.max(0, (prop.total_rooms || 0) - 1),
        total_beds: Math.max(0, (prop.total_beds || 0) - (room.capacity || 0)),
        occupied_beds: Math.max(0, (prop.occupied_beds || 0) - (room.occupied_beds || 0)),
        vacant_beds: Math.max(0, (prop.vacant_beds || 0) - (room.available_beds || 0))
      }).eq('id', room.property_id);
    }

    // 5. Delete the room unit
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) throw new Error(error.message);

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
