// Property Controller
const supabase = require('../config/supabase');

exports.getProperties = async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (propertyId) query = query.eq('id', propertyId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProperty = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Full property detail: rooms summary per floor, tenants, revenue
exports.getPropertyDetail = async (req, res) => {
  try {
    const propertyId = req.params.id;

    const { data: property, error: propErr } = await supabase
      .from('properties').select('*').eq('id', propertyId).single();
    if (propErr || !property) return res.status(404).json({ success: false, message: 'Property not found' });

    const { data: rooms } = await supabase
      .from('rooms').select('*').eq('property_id', propertyId).order('floor', { ascending: true });
    const roomList = rooms || [];

    // Group rooms by floor
    const floorMap = {};
    let totalBeds = 0, occupiedBeds = 0;
    for (const room of roomList) {
      const floorKey = String(room.floor || '0');
      if (!floorMap[floorKey]) floorMap[floorKey] = { floor: Number(floorKey), rooms: 0, occupiedRooms: 0 };
      floorMap[floorKey].rooms++;
      if ((room.occupied_beds || 0) > 0) floorMap[floorKey].occupiedRooms++;
      totalBeds += Number(room.capacity || 0);
      occupiedBeds += Number(room.occupied_beds || 0);
    }
    const roomSummary = Object.values(floorMap)
      .sort((a, b) => a.floor - b.floor)
      .map(f => ({
        floor: f.floor,
        label: f.floor === 0 ? 'Ground Floor' : `Floor ${f.floor}`,
        rooms: f.rooms,
        occupiedRooms: f.occupiedRooms,
        availableRooms: f.rooms - f.occupiedRooms
      }));

    const totalRooms = roomList.length;
    const occupiedRooms = roomList.filter(r => (r.occupied_beds || 0) > 0).length;
    const vacantBeds = totalBeds - occupiedBeds;

    const { data: tenants } = await supabase
      .from('tenants').select('id, full_name, created_at, checkin_date')
      .eq('property_id', propertyId).eq('status', 'active')
      .order('created_at', { ascending: false });
    const tenantList = tenants || [];
    const recentlyJoined = tenantList.slice(0, 4).map(t => ({
      id: String(t.id), name: t.full_name, checkInDate: t.checkin_date || t.created_at
    }));

    const { data: rents } = await supabase
      .from('rent_payments').select('amount, status').eq('property_id', propertyId);
    const rentList = rents || [];
    const monthlyRevenue = roomList.reduce((s, r) => s + ((r.occupied_beds || 0) * Number(r.monthly_rent || 0)), 0);
    const collected = rentList.filter(r => r.status === 'Paid').reduce((s, r) => s + Number(r.amount || 0), 0);
    const pending = rentList.filter(r => r.status === 'Pending').reduce((s, r) => s + Number(r.amount || 0), 0);

    const { data: depositData } = await supabase
      .from('tenants').select('security_deposit').eq('property_id', propertyId).eq('status', 'active');
    const securityDeposits = (depositData || []).reduce((s, t) => s + Number(t.security_deposit || 0), 0);

    res.json({
      success: true,
      data: {
        property,
        roomSummary,
        stats: { totalRooms, occupiedRooms, availableRooms: totalRooms - occupiedRooms, totalBeds, occupiedBeds, vacantBeds },
        activeTenants: tenantList.length,
        recentlyJoined,
        revenue: { monthlyRevenue, collected, pending, securityDeposits }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProperty = async (req, res) => {
  try {
    const body = req.body;
    const name = body.name || body.propertyName || 'Unnamed Property';
    const phone = body.phone || body.ownerPhone || '';
    const email = body.email || '';
    const address = body.address || '';
    const status = body.status || 'active';
    const city = body.city || null;
    const state = body.state || null;
    const pincode = body.pincode || null;
    const ownerName = body.ownerName || 'Admin';
    const image = body.image || null;
    const propertyType = body.propertyType || 'Boys PG';
    const description = body.description || null;
    const googleMapsLink = body.googleMapsLink || null;
    const nearbyLandmarks = body.nearbyLandmarks || null;
    const openingDate = body.openingDate || null;
    const buildingStructure = body.buildingStructure
      ? (typeof body.buildingStructure === 'string' ? body.buildingStructure : JSON.stringify(body.buildingStructure))
      : null;
    const galleryImages = body.galleryImages || null;

    const amenities = body.amenities
      ? (Array.isArray(body.amenities) ? body.amenities.join(', ') : body.amenities) : null;
    const propertyCode = body.propertyCode || `PROP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const parsedRooms = typeof body.rooms === 'string' ? JSON.parse(body.rooms) : (body.rooms || []);

    // Auto-generate rooms if buildingStructure is provided but rooms are not
    if (parsedRooms.length === 0 && body.buildingStructure) {
      try {
        const struct = typeof body.buildingStructure === 'string' 
          ? JSON.parse(body.buildingStructure) 
          : body.buildingStructure;
        if (struct && struct.floors && Array.isArray(struct.floors)) {
          struct.floors.forEach(f => {
            const floorNum = Number(f.floor);
            const count = Number(f.rooms || 0);
            for (let i = 1; i <= count; i++) {
              let roomNum = '';
              if (floorNum === 0) {
                roomNum = `G${String(i).padStart(2, '0')}`;
              } else {
                roomNum = `${floorNum}${String(i).padStart(2, '0')}`;
              }
              parsedRooms.push({
                num: roomNum,
                type: 'Double sharing',
                floor: floorNum,
                capacity: 2,
                rent: 6000
              });
            }
          });
        }
      } catch (err) {
        console.error('Error auto-generating rooms:', err.message);
      }
    }

    const calcTotalBeds = parsedRooms.length > 0
      ? parsedRooms.reduce((acc, r) => acc + (Number(r.capacity || r.beds?.length || 1 || 0)), 0)
      : (Number(body.totalBeds) || 0);
    const calcTotalRooms = parsedRooms.length > 0 ? parsedRooms.length : (Number(body.totalRooms) || 0);

    const { data: property, error } = await supabase
      .from('properties')
      .insert([{
        property_name: name,
        property_code: propertyCode,
        address,
        city,
        state,
        pincode,
        owner_name: ownerName,
        owner_phone: phone,
        total_rooms: calcTotalRooms,
        total_beds: calcTotalBeds,
        occupied_beds: 0,
        vacant_beds: calcTotalBeds,
        status,
        email,
        image,
        amenities,
        property_type: body.propertyType || body.property_type || 'Boys PG',
        description: body.description || null,
        google_maps_link: body.googleMapsLink || body.google_maps_link || null,
        nearby_landmarks: body.nearbyLandmarks || body.nearby_landmarks || null,
        gallery_images: body.galleryImages || body.gallery_images || null,
        building_structure: typeof body.buildingStructure === 'object' ? JSON.stringify(body.buildingStructure) : (body.buildingStructure || null),
        opening_date: body.openingDate || body.opening_date || '2025-06-10'
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Bulk-create rooms if provided
    if (parsedRooms.length > 0) {
      const roomDocs = parsedRooms.map(r => ({
        property_id: property.id,
        room_number: r.num || r.roomNumber,
        room_type: r.type || r.roomType,
        floor: String(r.floor),
        capacity: Number(r.capacity || r.beds?.length || 1),
        occupied_beds: 0,
        available_beds: Number(r.capacity || r.beds?.length || 1),
        monthly_rent: Number(r.rent || r.monthlyRent || 0),
        status: 'available'
      }));
      const { error: roomErr } = await supabase.from('rooms').insert(roomDocs);
      if (roomErr) console.error('Room creation error:', roomErr.message);
    }

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const body = req.body;
    const updateData = {};
    
    // Support both frontend and backend naming styles
    if (body.name !== undefined || body.propertyName !== undefined) {
      updateData.property_name = body.name || body.propertyName;
    }
    if (body.address !== undefined) updateData.address = body.address;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.pincode !== undefined) updateData.pincode = body.pincode;
    if (body.ownerName !== undefined) updateData.owner_name = body.ownerName;
    if (body.phone !== undefined || body.ownerPhone !== undefined) {
      updateData.owner_phone = body.phone || body.ownerPhone;
    }
    if (body.email !== undefined) updateData.email = body.email;
    if (body.image !== undefined) updateData.image = body.image;
    
    if (body.amenities !== undefined) {
      updateData.amenities = Array.isArray(body.amenities) ? body.amenities.join(', ') : body.amenities;
    }

    if (body.propertyType !== undefined || body.property_type !== undefined) {
      updateData.property_type = body.propertyType || body.property_type;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.googleMapsLink !== undefined || body.google_maps_link !== undefined) {
      updateData.google_maps_link = body.googleMapsLink || body.google_maps_link;
    }
    if (body.nearbyLandmarks !== undefined || body.nearby_landmarks !== undefined) {
      updateData.nearby_landmarks = body.nearbyLandmarks || body.nearby_landmarks;
    }
    if (body.galleryImages !== undefined || body.gallery_images !== undefined) {
      updateData.gallery_images = body.galleryImages || body.gallery_images;
    }
    if (body.buildingStructure !== undefined || body.building_structure !== undefined) {
      const bs = body.buildingStructure !== undefined ? body.buildingStructure : body.building_structure;
      updateData.building_structure = typeof bs === 'object' ? JSON.stringify(bs) : bs;
    }
    if (body.openingDate !== undefined || body.opening_date !== undefined) {
      updateData.opening_date = body.openingDate || body.opening_date;
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Property not found' });

    // Sync rooms if provided in the body
    if (body.rooms && Array.isArray(body.rooms)) {
      const parsedRooms = body.rooms;
      
      // Fetch existing rooms
      const { data: existingRooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', req.params.id);
        
      // Dynamic cleanup: identify and delete duplicate room numbers from Supabase
      const seenNumbers = new Set();
      const duplicateIdsToDelete = [];
      const uniqueExistingRooms = [];
      
      (existingRooms || []).forEach(r => {
        if (seenNumbers.has(r.room_number)) {
          duplicateIdsToDelete.push(r.id);
        } else {
          seenNumbers.add(r.room_number);
          uniqueExistingRooms.push(r);
        }
      });
      
      if (duplicateIdsToDelete.length > 0) {
        const { error: cleanupErr } = await supabase
          .from('rooms')
          .delete()
          .in('id', duplicateIdsToDelete);
        if (cleanupErr) console.error("Error cleaning up duplicate rooms:", cleanupErr.message);
      }
      
      const existingMap = new Map(uniqueExistingRooms.map(r => [r.room_number, r]));
      const roomsToInsert = [];
      const roomsToUpdate = [];
      const roomNumbersInRequest = new Set(parsedRooms.map(r => r.num || r.roomNumber || r.room_number));
      
      parsedRooms.forEach(r => {
        const roomNum = r.num || r.roomNumber || r.room_number;
        if (!roomNum) return;
        const existing = existingMap.get(roomNum);
        
        if (existing) {
          roomsToUpdate.push({
            id: existing.id,
            property_id: req.params.id,
            room_number: roomNum,
            room_type: r.type || r.roomType || r.room_type || 'Double sharing',
            floor: String(r.floor),
            capacity: Number(r.capacity || 1),
            available_beds: Number(r.capacity || 1) - Number(existing.occupied_beds || 0),
            monthly_rent: Number(r.rent || r.monthlyRent || r.monthly_rent || 0),
            status: existing.status
          });
        } else {
          roomsToInsert.push({
            property_id: req.params.id,
            room_number: roomNum,
            room_type: r.type || r.roomType || r.room_type || 'Double sharing',
            floor: String(r.floor),
            capacity: Number(r.capacity || 1),
            occupied_beds: 0,
            available_beds: Number(r.capacity || 1),
            monthly_rent: Number(r.rent || r.monthlyRent || r.monthly_rent || 0),
            status: 'available'
          });
        }
      });
      
      // Insert new rooms
      if (roomsToInsert.length > 0) {
        const { error: insErr } = await supabase.from('rooms').insert(roomsToInsert);
        if (insErr) console.error("Error inserting rooms during update:", insErr.message);
      }
      
      // Update existing rooms
      if (roomsToUpdate.length > 0) {
        for (const r of roomsToUpdate) {
          const { error: updErr } = await supabase
            .from('rooms')
            .update({
              room_type: r.room_type,
              floor: r.floor,
              capacity: r.capacity,
              available_beds: r.available_beds,
              monthly_rent: r.monthly_rent
            })
            .eq('id', r.id);
          if (updErr) console.error(`Error updating room ${r.room_number}:`, updErr.message);
        }
      }
      
      // Delete rooms that were removed in the edit wizard
      const roomsToDelete = (existingRooms || []).filter(r => !roomNumbersInRequest.has(r.room_number));
      if (roomsToDelete.length > 0) {
        const idsToDelete = roomsToDelete.map(r => r.id);
        const { error: delErr } = await supabase
          .from('rooms')
          .delete()
          .in('id', idsToDelete);
        if (delErr) console.error("Error deleting removed rooms during update:", delErr.message);
      }

      // Recalculate beds for property
      const { data: updatedRooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', req.params.id);
        
      if (updatedRooms) {
        const totalRoomsCount = updatedRooms.length;
        const totalBeds = updatedRooms.reduce((acc, r) => acc + Number(r.capacity || 1), 0);
        const occupiedBeds = updatedRooms.reduce((acc, r) => acc + Number(r.occupied_beds || 0), 0);
        
        await supabase
          .from('properties')
          .update({
            total_rooms: totalRoomsCount,
            total_beds: totalBeds,
            occupied_beds: occupiedBeds,
            vacant_beds: Math.max(0, totalBeds - occupiedBeds)
          })
          .eq('id', req.params.id);
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // 1. Get room IDs for this property
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('id')
      .eq('property_id', propertyId);
    const roomIds = (roomsData || []).map(r => r.id);

    // 2. Delete stays references and beds references first
    const { error: staysErr } = await supabase.from('tenant_stays').delete().eq('property_id', propertyId);
    if (staysErr) console.error("Stays delete error during property deletion:", staysErr.message);

    if (roomIds.length > 0) {
      const { error: staysRoomErr } = await supabase.from('tenant_stays').delete().in('room_id', roomIds);
      if (staysRoomErr) console.error("Stays room delete error during property deletion:", staysRoomErr.message);

      const { error: bedsErr } = await supabase.from('beds').delete().in('room_id', roomIds);
      if (bedsErr) console.error("Beds delete error during property deletion:", bedsErr.message);
    }

    // 3. Update tenants referencing this property or its rooms to prevent constraint violations
    const { error: tenantErr } = await supabase
      .from('tenants')
      .update({ property_id: null, room_id: null })
      .eq('property_id', propertyId);
    if (tenantErr) console.error("Tenant nullify error during property deletion:", tenantErr.message);

    // 4. Delete associated rooms
    const { error: roomErr } = await supabase
      .from('rooms')
      .delete()
      .eq('property_id', propertyId);
    if (roomErr) console.error("Room deletion error during property deletion:", roomErr.message);

    // 5. Finally delete the property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
    if (error) throw new Error(error.message);

    res.json({ success: true, message: 'Property and associated rooms deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPropertyDetail = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // 1. Fetch Property
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
    if (propErr || !property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // 2. Fetch Rooms
    const { data: rooms, error: roomsErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId);
    if (roomsErr) throw new Error(roomsErr.message);

    // 3. Fetch Tenants
    const { data: tenants, error: tenantsErr } = await supabase
      .from('tenants')
      .select('*, rooms(room_number)')
      .eq('property_id', propertyId);
    if (tenantsErr) throw new Error(tenantsErr.message);

    const activeTenants = tenants ? tenants.filter(t => t.status === 'active' || t.status === 'Active') : [];
    
    // Sort tenants by created_at (descending) to get recentlyJoined
    const recentlyJoined = [...activeTenants]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 3)
      .map(t => ({
        id: String(t.id),
        name: t.full_name || t.name || '',
        roomNumber: t.rooms?.room_number || '—',
        checkInDate: t.checkin_date || t.joined_date || ''
      }));

    // Group rooms by floor
    const floorsMap = {};
    let totalBeds = 0;
    let occupiedBeds = 0;
    let vacantBeds = 0;
    let occupiedRoomsCount = 0;

    rooms.forEach(r => {
      const floorNum = String(r.floor || '1');
      if (!floorsMap[floorNum]) {
        floorsMap[floorNum] = {
          floor: floorNum,
          label: floorNum === '0' || floorNum.toLowerCase() === 'g' || floorNum.toLowerCase() === 'ground' ? 'Ground Floor' : `Floor ${floorNum}`,
          rooms: 0,
          occupiedRooms: 0,
          availableRooms: 0,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0
        };
      }
      floorsMap[floorNum].rooms++;
      
      const cap = Number(r.capacity || r.totalBeds || 1);
      const occ = Number(r.occupied_beds || r.occupiedBeds || 0);
      const avail = Math.max(0, cap - occ);

      floorsMap[floorNum].totalBeds += cap;
      floorsMap[floorNum].occupiedBeds += occ;
      floorsMap[floorNum].availableBeds += avail;

      if (occ > 0) {
        floorsMap[floorNum].occupiedRooms++;
      } else {
        floorsMap[floorNum].availableRooms++;
      }

      totalBeds += cap;
      occupiedBeds += occ;
      vacantBeds += avail;
    });

    // Count how many rooms have at least one occupied bed
    occupiedRoomsCount = rooms.filter(r => Number(r.occupied_beds || r.occupiedBeds || 0) > 0).length;

    const roomSummary = Object.values(floorsMap).sort((a, b) => {
      const numA = parseInt(a.floor, 10);
      const numB = parseInt(b.floor, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.floor.localeCompare(b.floor);
    });

    // 4. Fetch Rents to calculate collected and pending
    const tenantIds = tenants ? tenants.map(t => t.id) : [];
    let rents = [];
    if (tenantIds.length > 0) {
      const { data: rentPayments } = await supabase
        .from('rent_payments')
        .select('*')
        .in('tenant_id', tenantIds);
      rents = rentPayments || [];
    }

    const collected = rents.filter(r => r.payment_status === 'paid' || r.payment_status === 'Paid').reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const totalExpected = rents.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const pending = Math.max(0, totalExpected - collected);

    // Monthly Rent configuration total (potential max rent per month)
    const monthly = rooms.reduce((acc, r) => acc + Number(r.monthly_rent || r.price || 0), 0);
    const securityDeposits = activeTenants.reduce((acc, t) => acc + Number(t.security_deposit || t.depositAmount || 0), 0);

    res.json({
      success: true,
      data: {
        property,
        roomSummary,
        stats: {
          totalRooms: rooms.length,
          occupiedRooms: occupiedRoomsCount,
          availableRooms: rooms.length - occupiedRoomsCount,
          totalBeds,
          occupiedBeds,
          vacantBeds
        },
        activeTenants: activeTenants.length,
        recentlyJoined,
        revenue: {
          monthlyRevenue: monthly,
          collected,
          pending,
          securityDeposits
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
