const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey', {
    expiresIn: '30d'
  });
};

const buildUniquePhone = async (preferredPhone) => {
  const candidates = [];
  if (preferredPhone) {
    candidates.push(preferredPhone);
  }

  for (let i = 0; i < 4; i += 1) {
    candidates.push(`9${Date.now().toString().slice(-9)}${i}`);
  }

  for (const candidate of candidates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('phone', candidate)
        .single();

      if (error || !data) {
        return candidate;
      }
    } catch (err) {
      return candidate;
    }
  }

  return `9${Math.floor(100000000 + Math.random() * 900000000).toString()}`;
};

const insertUserWithPhoneRetry = async (payload, preferredPhone) => {
  let attempt = 0;
  let currentPayload = { ...payload };

  while (attempt < 3) {
    const { data, error } = await supabase
      .from('users')
      .insert([currentPayload])
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    }

    if (error.message && error.message.toLowerCase().includes('phone')) {
      attempt += 1;
      currentPayload = {
        ...currentPayload,
        phone: await buildUniquePhone(preferredPhone || currentPayload.phone)
      };
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: new Error('Unable to create account due to a phone conflict') };
};

exports.register = async (req, res) => {
  const { email, password, name, phone } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPhone = phone ? String(phone).trim() : null;

    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    let safePhone = null;
    if (normalizedPhone) {
      safePhone = await buildUniquePhone(normalizedPhone);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const payload = {
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: name || normalizedEmail.split('@')[0],
      phone: safePhone,
      role: 'admin',
      is_active: true
    };

    const { data: user, error } = await insertUserWithPhoneRetry(payload, normalizedPhone);

    if (error) {
      if (error.message && error.message.toLowerCase().includes('phone')) {
        return res.status(409).json({ success: false, message: 'This phone number is already registered' });
      }
      throw new Error(error.message);
    }

    res.status(201).json({
      success: true,
      token: generateToken(user.id),
      user: { id: user.id, email: user.email, role: user.role, status: user.is_active ? 'Active' : 'Inactive' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, common_id, commonId } = req.body;
  const inputCommonId = common_id || commonId;
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // If common_id is provided, verify tenant mapping
    if (inputCommonId) {
      const { data: tenant, error: tenantErr } = await supabase
        .from('tenants')
        .select('*')
        .eq('common_id', inputCommonId.trim())
        .single();

      if (tenantErr || !tenant) {
        return res.status(401).json({ success: false, message: 'Invalid Common ID' });
      }

      // Check if the tenant email matches the login email
      if (!tenant.email || tenant.email.toLowerCase().trim() !== normalizedEmail) {
        return res.status(401).json({ success: false, message: 'Email does not match the registered Tenant ID' });
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Support both plaintext check (for python registers/dev mocks) and bcrypt
    let isMatch = false;
    if (user.password_hash.startsWith('$2') || user.password_hash.length > 30) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = (password === user.password_hash); // plain-text backup
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if the user is a tenant and if a Common ID was required but not provided
    if (user.role === 'tenant' && !inputCommonId) {
      return res.status(400).json({ success: false, message: 'Common ID is required for tenant login' });
    }

    // Fetch tenant details to attach to the login response if user is a tenant
    let tenantInfo = null;
    if (user.role === 'tenant') {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*, properties(property_name), rooms(room_number)')
        .eq('email', normalizedEmail)
        .single();
      tenantInfo = tenant;
    }

    res.json({
      success: true,
      token: generateToken(user.id),
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        status: user.is_active ? 'Active' : 'Inactive',
        name: user.full_name || user.email.split('@')[0],
        tenant: tenantInfo ? {
          id: tenantInfo.id,
          commonId: tenantInfo.common_id,
          name: tenantInfo.full_name,
          propertyName: tenantInfo.properties?.property_name,
          roomNumber: tenantInfo.rooms?.room_number
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { ...user, name: user.full_name, status: user.is_active ? 'Active' : 'Inactive' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
