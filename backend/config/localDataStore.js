const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'local-db.json');

const initialState = {
  users: [
    {
      id: 'user_admin',
      email: 'admin@pg.com',
      password_hash: 'admin123',
      full_name: 'Super Admin',
      phone: '9999999999',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  mgmt_users: [
    {
      id: 'mgmt_admin',
      email: 'admin@pg.com',
      password_hash: 'admin123',
      name: 'Super Admin',
      role: 'admin',
      status: 'Active',
      created_at: new Date().toISOString()
    }
  ],
  properties: [
    {
      id: 'prop_pleasant_homes',
      property_name: 'Pleasant Homes Elite',
      property_code: 'PH-ELITE',
      address: '12, Cathedral Road, Chennai, Tamil Nadu',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      owner_name: 'Mr. Arun',
      owner_phone: '9876543210',
      total_rooms: 2,
      total_beds: 6,
      occupied_beds: 0,
      vacant_beds: 6,
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  rooms: [
    {
      id: 'room_101',
      property_id: 'prop_pleasant_homes',
      room_number: '101',
      room_type: 'Double Sharing',
      floor: '1',
      capacity: 2,
      occupied_beds: 0,
      available_beds: 2,
      monthly_rent: 8500,
      status: 'available',
      created_at: new Date().toISOString()
    },
    {
      id: 'room_102',
      property_id: 'prop_pleasant_homes',
      room_number: '102',
      room_type: 'Triple Sharing',
      floor: '1',
      capacity: 3,
      occupied_beds: 0,
      available_beds: 3,
      monthly_rent: 7000,
      status: 'available',
      created_at: new Date().toISOString()
    }
  ],
  tenants: [
    {
      id: 'tenant_1',
      property_id: 'prop_pleasant_homes',
      room_id: 'room_101',
      full_name: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya@example.com',
      status: 'active',
      payment_status: 'paid',
      created_at: new Date().toISOString()
    }
  ],
  staff: [
    {
      id: 'staff_1',
      property_id: 'prop_pleasant_homes',
      name: 'Ravi Kumar',
      role: 'Maintenance',
      phone: '9876543212',
      email: 'ravi@example.com',
      active_status: 'Active',
      created_at: new Date().toISOString()
    }
  ],
  complaints: [
    {
      id: 'complaint_1',
      tenant_id: 'tenant_1',
      title: 'Water leakage in bathroom',
      description: 'Leakage reported in the bathroom area',
      status: 'in_progress',
      created_at: new Date().toISOString()
    }
  ],
  notices: [
    {
      id: 'notice_1',
      property_id: 'prop_pleasant_homes',
      title: 'Maintenance scheduled',
      content: 'Plumbing maintenance will be handled tomorrow morning.',
      category: 'General',
      created_at: new Date().toISOString()
    }
  ],
  visitors: [
    {
      id: 'visitor_1',
      tenant_id: 'tenant_1',
      visitor_name: 'Anita Singh',
      visitor_phone: '9876543213',
      purpose: 'Family Visit',
      entry_time: new Date().toISOString(),
      status: 'approved'
    }
  ],
  rent_payments: [
    {
      id: 'rent_1',
      tenant_id: 'tenant_1',
      amount: 8500,
      payment_status: 'paid',
      month: 'June',
      created_at: new Date().toISOString()
    }
  ]
};

let storeCache = null;

function ensureStoreFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2));
  }
}

function loadStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    const normalized = { ...initialState, ...parsed };
    for (const key of Object.keys(initialState)) {
      if (!Array.isArray(normalized[key])) {
        normalized[key] = initialState[key];
      }
    }
    return normalized;
  } catch (error) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2));
    return JSON.parse(JSON.stringify(initialState));
  }
}

function saveStore() {
  if (!storeCache) {
    storeCache = loadStore();
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(storeCache, null, 2));
}

function getStore() {
  if (!storeCache) {
    storeCache = loadStore();
  }
  return storeCache;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function applyProjection(row, selectColumns) {
  if (!selectColumns || selectColumns === '*' || String(selectColumns).includes('*')) {
    return row;
  }
  const fields = String(selectColumns)
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);
  const projected = {};
  for (const field of fields) {
    const cleanField = field.split('(')[0].trim();
    if (Object.prototype.hasOwnProperty.call(row, cleanField)) {
      projected[cleanField] = row[cleanField];
    }
  }
  return projected;
}

function enrichRow(table, row) {
  const store = getStore();
  const enriched = clone(row);
  if (table === 'rooms' && row.property_id) {
    const property = store.properties.find((item) => item.id === row.property_id);
    enriched.properties = property ? { property_name: property.property_name } : null;
  }
  if (table === 'tenants' && row.property_id) {
    const property = store.properties.find((item) => item.id === row.property_id);
    enriched.properties = property ? { property_name: property.property_name } : null;
    if (row.room_id) {
      const room = store.rooms.find((item) => item.id === row.room_id);
      enriched.rooms = room ? { room_number: room.room_number } : null;
    }
  }
  if (table === 'staff' && row.property_id) {
    const property = store.properties.find((item) => item.id === row.property_id);
    enriched.properties = property ? { property_name: property.property_name } : null;
  }
  if (table === 'notices' && row.property_id) {
    const property = store.properties.find((item) => item.id === row.property_id);
    enriched.properties = property ? { property_name: property.property_name } : null;
  }
  if (table === 'complaints' && row.tenant_id) {
    const tenant = store.tenants.find((item) => item.id === row.tenant_id);
    if (tenant) {
      enriched.tenants = {
        full_name: tenant.full_name,
        properties: tenant.property_id ? (store.properties.find((item) => item.id === tenant.property_id) ? { property_name: store.properties.find((item) => item.id === tenant.property_id).property_name } : null) : null,
        rooms: tenant.room_id ? (store.rooms.find((item) => item.id === tenant.room_id) ? { room_number: store.rooms.find((item) => item.id === tenant.room_id).room_number } : null) : null
      };
    }
  }
  if (table === 'visitors' && row.tenant_id) {
    const tenant = store.tenants.find((item) => item.id === row.tenant_id);
    if (tenant) {
      enriched.tenants = {
        full_name: tenant.full_name,
        properties: tenant.property_id ? (store.properties.find((item) => item.id === tenant.property_id) ? { property_name: store.properties.find((item) => item.id === tenant.property_id).property_name } : null) : null
      };
    }
  }
  return enriched;
}

function applyFilters(rows, query) {
  let filtered = clone(rows);
  for (const filter of query.filters) {
    if (filter.type === 'eq') {
      filtered = filtered.filter((row) => row[filter.column] === filter.value);
    }
    if (filter.type === 'in') {
      filtered = filtered.filter((row) => filter.values.includes(row[filter.column]));
    }
    if (filter.type === 'or') {
      filtered = filtered.filter((row) => {
        return filter.clauses.some((clause) => {
          const match = clause.match(/([^\.]+)\.ilike\.(.+)$/);
          if (!match) return false;
          const [, column, pattern] = match;
          const raw = row[column];
          if (raw == null) return false;
          const normalized = String(raw).toLowerCase();
          const search = String(pattern).replace(/^%|%$/g, '').toLowerCase();
          return normalized.includes(search);
        });
      });
    }
  }
  return filtered;
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.operation = 'select';
    this.selectColumns = '*';
    this.selectOptions = {};
    this.payload = null;
    this.orderBy = null;
    this.orderAscending = true;
    this.limitCount = null;
    this.singleMode = false;
  }

  select(columns, options = {}) {
    this.selectColumns = columns;
    this.selectOptions = options || {};
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column, values) {
    this.filters.push({ type: 'in', column, values });
    return this;
  }

  or(clause) {
    this.filters.push({ type: 'or', clauses: clause.split(',').filter(Boolean) });
    return this;
  }

  order(column, options = {}) {
    this.orderBy = column;
    this.orderAscending = options.ascending !== false;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.payload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  async execute() {
    const store = getStore();
    const rows = store[this.table] || [];

    if (this.operation === 'select') {
      let filtered = applyFilters(rows, this);
      if (this.orderBy) {
        filtered = filtered.sort((a, b) => {
          const left = a[this.orderBy];
          const right = b[this.orderBy];
          if (left == null || right == null) return 0;
          if (left < right) return this.orderAscending ? -1 : 1;
          if (left > right) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }
      if (this.limitCount) {
        filtered = filtered.slice(0, Number(this.limitCount));
      }
      const mapped = filtered.map((row) => applyProjection(enrichRow(this.table, row), this.selectColumns));
      const response = {
        data: this.singleMode ? mapped[0] || null : mapped,
        error: null,
        count: this.selectOptions.count === 'exact' ? mapped.length : undefined
      };
      if (this.selectOptions.count === 'exact') {
        response.count = mapped.length;
      }
      return response;
    }

    if (this.operation === 'insert') {
      const inserted = [];
      for (const item of this.payload || []) {
        const doc = { ...item, id: item.id || uid(this.table), created_at: item.created_at || new Date().toISOString() };
        rows.push(doc);
        inserted.push(doc);
      }
      store[this.table] = rows;
      saveStore();
      return {
        data: this.singleMode ? (inserted[0] || null) : inserted,
        error: null
      };
    }

    if (this.operation === 'update') {
      const updated = [];
      for (const row of rows) {
        if (this.matches(row)) {
          const nextRow = { ...row, ...this.payload };
          Object.assign(row, nextRow);
          updated.push(row);
        }
      }
      saveStore();
      return {
        data: this.singleMode ? (updated[0] || null) : updated,
        error: null
      };
    }

    if (this.operation === 'delete') {
      const remaining = rows.filter((row) => !this.matches(row));
      store[this.table] = remaining;
      saveStore();
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }

  matches(row) {
    return this.filters.every((filter) => {
      if (filter.type === 'eq') return row[filter.column] === filter.value;
      if (filter.type === 'in') return filter.values.includes(row[filter.column]);
      return true;
    });
  }

  then(resolve, reject) {
    return this.execute().then(resolve).catch(reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

function createSupabaseLikeClient() {
  return {
    from(table) {
      return new QueryBuilder(table);
    },
    __internal: {
      getStore,
      resetStore: () => {
        storeCache = clone(initialState);
        saveStore();
        return storeCache;
      }
    }
  };
}

module.exports = {
  createSupabaseLikeClient,
  getStore,
  resetStore: () => {
    storeCache = clone(initialState);
    saveStore();
    return storeCache;
  }
};
