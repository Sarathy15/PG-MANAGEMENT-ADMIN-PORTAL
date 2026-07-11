require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
global.supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

const app = express();

// CORS Middleware
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Response unwrapping and mapping middleware to translate Supabase DB models to frontend camelCase formats
app.use((req, res, next) => {
  const originalJson = res.json;

  res.json = function(body) {
    let data = body;
    
    // 1. Unwrap success/data wrapper if present
    if (body && body.success === true && body.data !== undefined) {
      data = body.data;
    }
    
    // 2. Perform camelCase mappings based on endpoint paths
    const url = req.originalUrl || req.url;

    const mapProperty = (p) => {
      if (!p) return p;
      return {
        id: String(p.id),
        name: p.property_name || p.name || 'Unnamed Property',
        address: p.address || '',
        phone: p.owner_phone || p.phone || '',
        email: p.email || '',
        amenities: p.amenities ? (typeof p.amenities === 'string' ? p.amenities.split(',').map(s => s.trim()) : p.amenities) : [],
        totalRooms: Number(p.total_rooms || p.totalRooms || 0),
        image: p.image || null,
        propertyCode: p.property_code || '',
        city: p.city || '',
        state: p.state || '',
        pincode: p.pincode || '',
        ownerName: p.owner_name || 'Admin',
        totalBeds: Number(p.total_beds || 0),
        occupiedBeds: Number(p.occupied_beds || 0),
        vacantBeds: Number(p.vacant_beds || 0),
        propertyType: p.property_type || 'Boys PG',
        description: p.description || '',
        googleMapsLink: p.google_maps_link || '',
        nearbyLandmarks: p.nearby_landmarks || '',
        galleryImages: p.gallery_images || '',
        buildingStructure: p.building_structure || '',
        openingDate: p.opening_date || '2025-06-10',
        createdAt: p.created_at || null
      };
    };

    const mapRoom = (r) => {
      if (!r) return r;
      return {
        id: String(r.id),
        propertyId: String(r.property_id || r.propertyId),
        roomNumber: r.room_number || r.roomNumber || '',
        floor: Number(r.floor || 0),
        type: r.room_type || r.type || 'Single',
        price: Number(r.monthly_rent || r.price || 0),
        totalBeds: Number(r.capacity || r.totalBeds || 1),
        occupiedBeds: Number(r.occupied_beds || r.occupiedBeds || 0),
        status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Available',
        acType: r.ac_type || r.acType || 'Non-AC',
        securityDeposit: Number(r.security_deposit || r.securityDeposit || 0),
        facilities: r.facilities || '',
        notes: r.notes || '',
        category: r.category || 'Standard',
        photos: r.photos || '',
        propertyName: r.propertyName || r.property || r.properties?.property_name || 'Unknown Property',
        property: r.propertyName || r.property || r.properties?.property_name || 'Unknown Property'
      };
    };

    const mapTenant = (t) => {
      if (!t) return t;
      const resolvedDocUrl = t.aadhaar_pdf_url || t.pan_pdf_url || t.id_card_pdf_url || t.doc_url || t.docUrl || null;
      return {
        id: String(t.id),
        name: t.full_name || t.name || '',
        email: t.email || '',
        phone: t.phone || '',
        commonId: t.common_id || '',
        common_id: t.common_id || '',
        idProofType: t.id_proof_type || t.idProofType || 'Aadhaar Card',
        idProofNumber: t.id_proof_number || t.idProofNumber || t.aadhaar_number || t.pan_number || '',
        docUrl: resolvedDocUrl,
        aadhaar_pdf_url: t.aadhaar_pdf_url || null,
        pan_pdf_url: t.pan_pdf_url || null,
        id_card_pdf_url: t.id_card_pdf_url || null,
        propertyId: String(t.property_id || t.propertyId || ''),
        roomId: String(t.room_id || t.roomId || ''),
        roomNumber: t.rooms?.room_number || t.roomNumber || '',
        bedNumber: (t.bed_number || t.bed_id || t.bedId) ? Number(t.bed_number || t.bed_id || t.bedId) : null,
        rentAmount: Number(t.rent_amount || t.rentAmount || 0),
        depositAmount: Number(t.deposit_amount || t.security_deposit || t.depositAmount || t.securityDeposit || 0),
        checkInDate: t.checkin_date || t.checkInDate || t.joined_date || '',
        checkOutDate: t.checkout_date || t.checkOutDate || null,
        emergencyContact: t.emergencyContact || {
          name: t.emergency_contact_name || '',
          relation: t.emergency_contact_relation || 'Parent',
          phone: t.emergency_contact_phone || ''
        },
        properties: t.properties || null,
        rooms: t.rooms || null,
        status: t.status ? (t.status.toLowerCase() === 'checked_out' || t.status.toLowerCase() === 'checked out' ? 'Checked Out' : (t.status.charAt(0).toUpperCase() + t.status.slice(1))) : 'Active'
      };
    };

    const mapRent = (r) => {
      if (!r) return r;
      const isSynth = String(r.id).startsWith('synthesized-');
      const depositVal = Number(r.security_deposit || r.securityDeposit || 0);
      return {
        id: String(r.id),
        tenantId: String(r.tenant_id || r.tenantId),
        tenantName: r.tenants?.full_name || r.tenantName || 'Unknown Tenant',
        roomNumber: r.tenants?.rooms?.room_number || r.roomNumber || r.room || '—',
        month: r.billing_period || r.month || '',
        amount: Number(r.amount || 0),
        electricityAmount: Number(r.electricity_amount || r.electricityAmount || 0),
        miscAmount: Number(r.misc_amount || r.miscAmount || 0),
        securityDeposit: depositVal,
        security_deposit: depositVal,
        status: r.payment_status ? (r.payment_status.charAt(0).toUpperCase() + r.payment_status.slice(1)) : 'Pending',
        paymentStatus: r.payment_status || r.paymentStatus || 'pending',
        payment_status: r.payment_status || r.paymentStatus || 'pending',
        dueDate: r.due_date || r.dueDate || '',
        paidDate: r.paid_date || r.paidDate || null,
        invoiceId: isSynth ? '—' : (r.receipt_number || r.invoiceId || `INV-${String(r.id).padStart(6, '0')}`),
        notes: r.notes || '',
        tenantPhone: r.tenants?.phone || '',
        checkInDate: r.tenants?.checkin_date || ''
      };
    };

    const mapStaff = (s) => {
      if (!s) return s;
      return {
        id: String(s.id),
        name: s.name || '',
        role: s.role || '',
        phone: s.phone || '',
        email: s.email || '',
        salary: Number(s.salary || 0),
        attendance: s.attendance_status || s.attendance || 'Present',
        shift: s.shift || 'Day',
        performance: s.performance || 'Good',
        profileImage: s.profile_image || s.profileImage || null,
        idProof: s.id_proof || s.idProof || null,
        propertyId: s.property_id || s.propertyId || null,
        activeStatus: s.active_status || s.activeStatus || 'Active'
      };
    };

    const mapVisitor = (v) => {
      if (!v) return v;
      return {
        id: String(v.id),
        name: v.visitor_name || v.name || '',
        hostTenantId: String(v.tenant_id || v.hostTenantId),
        tenantName: v.tenants?.full_name || v.tenantName || 'Unknown',
        roomNumber: v.tenants?.rooms?.room_number || v.roomNumber || '—',
        phone: v.visitor_phone || v.phone || '',
        relation: v.relation || 'Friend',
        checkInTime: v.entry_time || v.checkInTime || '',
        checkOutTime: v.exit_time || v.checkOutTime || null,
        purpose: v.purpose || '',
        status: v.status || 'inside',
        otp: v.otp || '',
        otpVerified: v.otp_verified || false,
        approvalStatus: v.approval_status || 'Pending Resident Approval',
        propertyId: v.tenants?.property_id || v.propertyId || null
      };
    };

    const mapComplaint = (c) => {
      if (!c) return c;
      return {
        id: String(c.id),
        tenantId: String(c.tenant_id || c.tenantId),
        tenantName: c.tenants?.full_name || c.tenantName || 'Unknown',
        roomNumber: c.tenants?.rooms?.room_number || c.roomNumber || '—',
        roomId: c.tenants?.room_id ? String(c.tenants.room_id) : (c.roomId ? String(c.roomId) : null),
        propertyId: String(c.tenants?.property_id || c.propertyId || ''),
        title: c.title,
        description: c.description,
        category: c.category || 'Other',
        priority: c.priority || 'Medium',
        status: c.status === 'resolved' ? 'Resolved' : c.status === 'in_progress' ? 'In Progress' : 'Pending',
        assignedStaffId: String(c.assigned_staff_id || c.assignedStaffId || ''),
        assignedStaffName: c.assignedStaffName || null,
        comments: c.comments || [],
        date: c.created_at ? c.created_at.substring(0, 10) : ''
      };
    };

    const mapNotice = (n) => {
      if (!n) return n;
      return {
        id: String(n.id),
        title: n.title,
        content: n.content || '',
        audience: n.target_audience === 'All Tenants' ? 'Tenants' : n.target_audience === 'All Staff' ? 'Staff' : 'All',
        date: n.publish_date || '',
        status: n.status === 'Active' ? 'Published' : 'Draft'
      };
    };

    // Apply mapper based on URL patterns only if request is successful
    try {
      if (res.statusCode < 400 && !(body && body.success === false)) {
        if (url.includes('/api/v1/properties')) {
          if (url.includes('/detail')) {
            if (data && data.property) {
              data.property = mapProperty(data.property);
            }
          } else {
            data = Array.isArray(data) ? data.map(mapProperty) : mapProperty(data);
          }
        } else if (url.includes('/api/v1/rooms')) {
          data = Array.isArray(data) ? data.map(mapRoom) : mapRoom(data);
        } else if (url.includes('/api/v1/tenants')) {
          data = Array.isArray(data) ? data.map(mapTenant) : mapTenant(data);
        } else if (url.includes('/api/v1/rents') || url.includes('/api/v1/rent')) {
          data = Array.isArray(data) ? data.map(mapRent) : mapRent(data);
        } else if (url.includes('/api/v1/staff')) {
          data = Array.isArray(data) ? data.map(mapStaff) : mapStaff(data);
        } else if (url.includes('/api/v1/visitors')) {
          data = Array.isArray(data) ? data.map(mapVisitor) : mapVisitor(data);
        } else if (url.includes('/api/v1/complaints')) {
          data = Array.isArray(data) ? data.map(mapComplaint) : mapComplaint(data);
        } else if (url.includes('/api/v1/notices')) {
          data = Array.isArray(data) ? data.map(mapNotice) : mapNotice(data);
        }
      }
    } catch (e) {
      console.error("Error in response mapping middleware:", e);
    }

    return originalJson.call(this, data);
  };
  next();
});

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve Static Uploads
app.use('/uploads', express.static(uploadsDir));

// Serve frontend files from /frontend folder
const frontendRoot = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendRoot));

// Clean URLs handler to match Vercel's cleanUrls routing locally
app.use((req, res, next) => {
  if (req.path.indexOf('.') === -1 && !req.path.startsWith('/api/')) {
    const filePath = path.join(frontendRoot, req.path + '.html');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'login.html'));
});

// Health Check / Uptime Monitor Endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});
app.head('/health', (req, res) => {
  res.status(200).end();
});

// Route Mounts
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/properties', require('./routes/properties'));
app.use('/api/v1/rooms', require('./routes/rooms'));
app.use('/api/v1/tenants', require('./routes/tenants'));
app.use('/api/v1/staff', require('./routes/staff'));
app.use('/api/v1/complaints', require('./routes/complaints'));
app.use('/api/v1/notices', require('./routes/notices'));
app.use('/api/v1/audit-logs', require('./routes/auditLogs'));
app.use('/api/v1/visitors', require('./routes/visitors'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/maintenance', require('./routes/maintenance'));
app.use('/api/v1/rents', require('./routes/rents'));
app.use('/api/v1/rent', require('./routes/rents'));
app.use('/api/v1/search', require('./routes/search'));

// Generic Upload Route — uses ImageKit (or fallback)
const upload = require('./middleware/upload');
app.post('/api/v1/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // If ImageKit or Cloudinary: req.file.path is already a full https:// URL
  // If local disk: build a relative /uploads/... URL
  let fileUrl = req.file.path;
  if (fileUrl && !fileUrl.startsWith('http')) {
    const parts = fileUrl.split(path.sep);
    const idx   = parts.indexOf('uploads');
    fileUrl = idx !== -1
      ? '/' + parts.slice(idx).join('/')
      : `/uploads/${req.file.filename}`;
  }

  res.json({
    success: true,
    url: fileUrl,
    fileId: req.file.fileId || null,      // ImageKit fileId (for future deletes)
    provider: process.env.IMAGEKIT_PRIVATE_KEY ? 'imagekit' : 'local'
  });
});

// ImageKit signed auth params (for optional browser-side direct uploads)
app.get('/api/v1/imagekit/auth', (req, res) => {
  try {
    const { getAuthParams } = require('./config/imagekit');
    const params = getAuthParams();
    res.json({ success: true, ...params, urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT });
  } catch (e) {
    res.status(500).json({ success: false, message: 'ImageKit auth failed', error: e.message });
  }
});


// Settings Fallback Routes
app.get('/api/v1/settings', (req, res) => {
  res.json({
    name: "Pleasant Homes Management Co.",
    email: "contact@pleasanthomes.com",
    phone: "+91 99000 88000",
    currency: "INR",
    taxId: "GSTIN-29AAACE1234F1Z5",
    address: "786 Highrise Towers, MG Road, Bangalore",
    paymentQrCodeUrl: process.env.PAYMENT_QR_CODE_URL || ''
  });
});
app.put('/api/v1/settings', (req, res) => {
  res.json(req.body);
});

// Fallback Route
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Startup Seeding Logic for Supabase
const seedDatabase = async () => {
  try {
    // 1. Seed Admin User into users table
    const { data: users, error: userCountErr } = await supabase
      .from('mgmt_users')
      .select('id');
    
    // Fallback to checking the Python users table if mgmt_users is not the correct table
    let countUsers = users ? users.length : 0;
    let targetUserTable = 'mgmt_users';
    
    if (userCountErr) {
      // If mgmt_users table doesn't exist, fall back to users
      const { data: altUsers, error: altErr } = await supabase.from('users').select('id');
      if (!altErr) {
        countUsers = altUsers.length;
        targetUserTable = 'users';
      } else {
        // Create mgmt_users table fallback or try inserting
        console.log('Using mgmt_users for user authentication');
      }
    }

    if (countUsers === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      
      const payload = targetUserTable === 'users' ? {
        full_name: 'Super Admin',
        email: 'admin@pg.com',
        phone: '9999999999',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true
      } : {
        email: 'admin@pg.com',
        password_hash: passwordHash,
        name: 'Super Admin',
        role: 'admin',
        status: 'Active'
      };

      const { error: seedUserErr } = await supabase
        .from(targetUserTable)
        .insert([payload]);
      
      if (seedUserErr) {
        console.error(`Error seeding default admin user: ${seedUserErr.message}`);
      } else {
        console.log('Seeded default admin user: admin@pg.com / admin123');
      }
    }

    // 2. Seed default Property & Rooms
    const { data: existingProps } = await supabase.from('properties').select('id');
    if (!existingProps || existingProps.length === 0) {
      const { data: property, error: propErr } = await supabase
        .from('properties')
        .insert([{
          property_name: 'Pleasant Homes Elite',
          property_code: 'PH-ELITE',
          address: '12, Cathedral Road, Chennai, Tamil Nadu',
          total_rooms: 2,
          total_beds: 6,
          occupied_beds: 0,
          vacant_beds: 6,
          status: 'active'
        }])
        .select()
        .single();
      
      if (propErr) {
        console.error(`Error seeding default property: ${propErr.message}`);
        return;
      }
      console.log('Seeded default property: Pleasant Homes Elite (PH-ELITE)');

      // Create default rooms
      const { error: roomErr } = await supabase.from('rooms').insert([
        {
          property_id: property.id,
          room_number: '101',
          room_type: 'Double Sharing',
          floor: '1',
          capacity: 2,
          occupied_beds: 0,
          available_beds: 2,
          monthly_rent: 8500,
          status: 'available'
        },
        {
          property_id: property.id,
          room_number: '102',
          room_type: 'Triple Sharing',
          floor: '1',
          capacity: 3,
          occupied_beds: 0,
          available_beds: 3,
          monthly_rent: 7000,
          status: 'available'
        }
      ]);

      if (roomErr) {
        console.error(`Error seeding default rooms: ${roomErr.message}`);
      } else {
        console.log('Seeded default rooms: 101, 102');
      }
    }
  } catch (error) {
    console.error('Seeding Error:', error);
  }
};

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = require('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/spa*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, async () => {
    console.log(`[PGMS] Full-Stack server is actively running on http://0.0.0.0:${PORT}`);
    await seedDatabase();
  });
};

startServer();
