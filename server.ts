import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, Property, Room, Tenant, Rent, Staff, Visitor, Complaint, Maintenance, Notice, AuditLog, OrgSettings
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent database file path
const DB_FILE = path.join(process.cwd(), "server_db.json");

interface Database {
  users: User[];
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  rent: Rent[];
  staff: Staff[];
  visitors: Visitor[];
  complaints: Complaint[];
  maintenance: Maintenance[];
  notices: Notice[];
  auditLogs: AuditLog[];
  settings: OrgSettings;
}

// Function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

// Initial seed data
const getInitialDatabase = (): Database => {
  const properties: Property[] = [
    {
      id: "PROP-1",
      name: "Grand Heights PG",
      address: "124 Elite Avenue, Sector 5, Bangalore",
      phone: "+91 98765 43210",
      email: "grandheights@pgms.com",
      amenities: ["Wi-Fi", "Daily Meals", "Laundry", "Gym", "Power Backup", "CCTV"],
      totalRooms: 10,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "PROP-2",
      name: "Urban Living PG",
      address: "45 Metro Street, Koramangala, Bangalore",
      phone: "+91 98765 11122",
      email: "urbanliving@pgms.com",
      amenities: ["Wi-Fi", "AC Rooms", "Laundry", "24/7 Security", "Fridge"],
      totalRooms: 6,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const rooms: Room[] = [
    // Grand Heights Rooms
    { id: "ROOM-1", propertyId: "PROP-1", roomNumber: "101", floor: 1, type: "Single", price: 12000, totalBeds: 1, occupiedBeds: 1, status: "Full" },
    { id: "ROOM-2", propertyId: "PROP-1", roomNumber: "102", floor: 1, type: "Double", price: 8000, totalBeds: 2, occupiedBeds: 1, status: "Available" },
    { id: "ROOM-3", propertyId: "PROP-1", roomNumber: "103", floor: 1, type: "Triple", price: 6000, totalBeds: 3, occupiedBeds: 3, status: "Full" },
    { id: "ROOM-4", propertyId: "PROP-1", roomNumber: "201", floor: 2, type: "Single", price: 12000, totalBeds: 1, occupiedBeds: 0, status: "Available" },
    { id: "ROOM-5", propertyId: "PROP-1", roomNumber: "202", floor: 2, type: "Double", price: 8500, totalBeds: 2, occupiedBeds: 2, status: "Full" },
    { id: "ROOM-6", propertyId: "PROP-1", roomNumber: "203", floor: 2, type: "Four-Sharing", price: 5000, totalBeds: 4, occupiedBeds: 1, status: "Available" },
    { id: "ROOM-7", propertyId: "PROP-1", roomNumber: "301", floor: 3, type: "Single", price: 12500, totalBeds: 1, occupiedBeds: 0, status: "Maintenance" },

    // Urban Living Rooms
    { id: "ROOM-8", propertyId: "PROP-2", roomNumber: "A-1", floor: 1, type: "Single", price: 15000, totalBeds: 1, occupiedBeds: 1, status: "Full" },
    { id: "ROOM-9", propertyId: "PROP-2", roomNumber: "A-2", floor: 1, type: "Double", price: 9500, totalBeds: 2, occupiedBeds: 1, status: "Available" },
    { id: "ROOM-10", propertyId: "PROP-2", roomNumber: "B-1", floor: 2, type: "Single", price: 15000, totalBeds: 1, occupiedBeds: 0, status: "Available" }
  ];

  const tenants: Tenant[] = [
    {
      id: "TEN-1",
      name: "Rohan Sharma",
      email: "rohan.sharma@gmail.com",
      phone: "+91 99988 77766",
      idProofType: "Aadhaar Card",
      idProofNumber: "1234-5678-9012",
      docUrl: "/uploads/aadhaar.pdf",
      propertyId: "PROP-1",
      roomId: "ROOM-1",
      roomNumber: "101",
      bedNumber: 1,
      rentAmount: 12000,
      depositAmount: 20000,
      checkInDate: "2026-01-10",
      checkOutDate: null,
      emergencyContact: { name: "Vijay Sharma", relation: "Father", phone: "+91 99988 77700" },
      status: "Active"
    },
    {
      id: "TEN-2",
      name: "Priya Nair",
      email: "priya.nair@yahoo.com",
      phone: "+91 98877 66554",
      idProofType: "Passport",
      idProofNumber: "Z9876543",
      docUrl: "/uploads/passport.pdf",
      propertyId: "PROP-1",
      roomId: "ROOM-2",
      roomNumber: "102",
      bedNumber: 1,
      rentAmount: 8000,
      depositAmount: 15000,
      checkInDate: "2026-03-01",
      checkOutDate: null,
      emergencyContact: { name: "Lakshmi Nair", relation: "Mother", phone: "+91 98877 66500" },
      status: "Active"
    },
    {
      id: "TEN-3",
      name: "Amit Patel",
      email: "amit.patel@gmail.com",
      phone: "+91 97766 55443",
      idProofType: "Aadhaar Card",
      idProofNumber: "4567-8901-2345",
      docUrl: null,
      propertyId: "PROP-1",
      roomId: "ROOM-3",
      roomNumber: "103",
      bedNumber: 1,
      rentAmount: 6000,
      depositAmount: 10000,
      checkInDate: "2026-02-15",
      checkOutDate: null,
      emergencyContact: { name: "Rajesh Patel", relation: "Father", phone: "+91 97766 55400" },
      status: "Active"
    },
    {
      id: "TEN-4",
      name: "Saurav Ganguly",
      email: "saurav.g@gmail.com",
      phone: "+91 96655 44332",
      idProofType: "PAN Card",
      idProofNumber: "ABCDE1234F",
      docUrl: null,
      propertyId: "PROP-1",
      roomId: "ROOM-3",
      roomNumber: "103",
      bedNumber: 2,
      rentAmount: 6000,
      depositAmount: 10000,
      checkInDate: "2026-02-15",
      checkOutDate: null,
      emergencyContact: { name: "Geeta Ganguly", relation: "Mother", phone: "+91 96655 44300" },
      status: "Active"
    },
    {
      id: "TEN-5",
      name: "Vikram Malhotra",
      email: "vikram.m@outlook.com",
      phone: "+91 95544 33221",
      idProofType: "Aadhaar Card",
      idProofNumber: "7890-1234-5678",
      docUrl: null,
      propertyId: "PROP-2",
      roomId: "ROOM-8",
      roomNumber: "A-1",
      bedNumber: 1,
      rentAmount: 15000,
      depositAmount: 30000,
      checkInDate: "2026-05-01",
      checkOutDate: null,
      emergencyContact: { name: "Suresh Malhotra", relation: "Father", phone: "+91 95544 33200" },
      status: "Active"
    }
  ];

  const rent: Rent[] = [
    { id: "RENT-1", tenantId: "TEN-1", tenantName: "Rohan Sharma", roomNumber: "101", month: "2026-06", amount: 12000, status: "Paid", dueDate: "2026-06-05", paidDate: "2026-06-04", invoiceId: "INV-260601" },
    { id: "RENT-2", tenantId: "TEN-2", tenantName: "Priya Nair", roomNumber: "102", month: "2026-06", amount: 8000, status: "Paid", dueDate: "2026-06-05", paidDate: "2026-06-05", invoiceId: "INV-260602" },
    { id: "RENT-3", tenantId: "TEN-3", tenantName: "Amit Patel", roomNumber: "103", month: "2026-06", amount: 6000, status: "Paid", dueDate: "2026-06-05", paidDate: "2026-06-08", invoiceId: "INV-260603" },
    { id: "RENT-4", tenantId: "TEN-4", tenantName: "Saurav Ganguly", roomNumber: "103", month: "2026-06", amount: 6000, status: "Pending", dueDate: "2026-06-05", paidDate: null, invoiceId: "INV-260604" },
    { id: "RENT-5", tenantId: "TEN-5", tenantName: "Vikram Malhotra", roomNumber: "A-1", month: "2026-06", amount: 15000, status: "Paid", dueDate: "2026-06-05", paidDate: "2026-06-03", invoiceId: "INV-260605" },
    
    // July 2026 (Current)
    { id: "RENT-6", tenantId: "TEN-1", tenantName: "Rohan Sharma", roomNumber: "101", month: "2026-07", amount: 12000, status: "Paid", dueDate: "2026-07-05", paidDate: "2026-07-02", invoiceId: "INV-260701" },
    { id: "RENT-7", tenantId: "TEN-2", tenantName: "Priya Nair", roomNumber: "102", month: "2026-07", amount: 8000, status: "Pending", dueDate: "2026-07-05", paidDate: null, invoiceId: "INV-260702" },
    { id: "RENT-8", tenantId: "TEN-3", tenantName: "Amit Patel", roomNumber: "103", month: "2026-07", amount: 6000, status: "Pending", dueDate: "2026-07-05", paidDate: null, invoiceId: "INV-260703" },
    { id: "RENT-9", tenantId: "TEN-4", tenantName: "Saurav Ganguly", roomNumber: "103", month: "2026-07", amount: 6000, status: "Overdue", dueDate: "2026-07-05", paidDate: null, invoiceId: "INV-260704" },
    { id: "RENT-10", tenantId: "TEN-5", tenantName: "Vikram Malhotra", roomNumber: "A-1", month: "2026-07", amount: 15000, status: "Paid", dueDate: "2026-07-05", paidDate: "2026-07-01", invoiceId: "INV-260705" }
  ];

  const staff: Staff[] = [
    { id: "STAF-1", name: "Ramesh Kumar", role: "Property Warden", phone: "+91 94433 22110", email: "ramesh@pgms.com", salary: 18000, attendance: "Present", shift: "Day", performance: "Excellent" },
    { id: "STAF-2", name: "Sunita Devi", role: "Housekeeping Head", phone: "+91 93322 11009", email: "sunita@pgms.com", salary: 12000, attendance: "Present", shift: "Day", performance: "Good" },
    { id: "STAF-3", name: "Anil Kumar", role: "Security Guard", phone: "+91 92211 00998", email: "anil@pgms.com", salary: 14000, attendance: "Present", shift: "Night", performance: "Good" },
    { id: "STAF-4", name: "Manish Singh", role: "Maintenance Tech", phone: "+91 91100 99887", email: "manish@pgms.com", salary: 16000, attendance: "On Leave", shift: "Day", performance: "Average" }
  ];

  const visitors: Visitor[] = [
    { id: "VIS-1", name: "Karan Sharma", hostTenantId: "TEN-1", hostTenantName: "Rohan Sharma", phone: "+91 88877 66554", relation: "Brother", checkIn: "2026-07-02 10:00", checkOut: "2026-07-02 18:00", purpose: "Casual Meet", status: "Checked Out" },
    { id: "VIS-2", name: "Meena Nair", hostTenantId: "TEN-2", hostTenantName: "Priya Nair", phone: "+91 87766 55443", relation: "Aunt", checkIn: "2026-07-02 11:30", checkOut: "2026-07-02 15:00", purpose: "Deliver food", status: "Checked Out" },
    { id: "VIS-3", name: "Sanjay Patel", hostTenantId: "TEN-3", hostTenantName: "Amit Patel", phone: "+91 86655 44332", relation: "Friend", checkIn: "2026-07-03 09:30", checkOut: null, purpose: "Study Session", status: "Approved" }
  ];

  const complaints: Complaint[] = [
    { id: "COMP-1", tenantId: "TEN-1", tenantName: "Rohan Sharma", roomNumber: "101", title: "AC Remote not responsive", description: "The remote doesn't turn the AC on even after replacing cells.", category: "Electrical", priority: "Low", status: "Resolved", assignedStaffId: "STAF-4", assignedStaffName: "Manish Singh", comments: ["Warden inspected", "Batteries replaced, remote working"], date: "2026-06-28" },
    { id: "COMP-2", tenantId: "TEN-2", tenantName: "Priya Nair", roomNumber: "102", title: "Shower pipe leak", description: "Water leaking constantly from the shower mixer pipe, causing bathroom floor to remain wet.", category: "Plumbing", priority: "Medium", status: "In Progress", assignedStaffId: "STAF-4", assignedStaffName: "Manish Singh", comments: ["Plumber called", "Waiting for replacement pipe"], date: "2026-07-01" },
    { id: "COMP-3", tenantId: "TEN-5", tenantName: "Vikram Malhotra", roomNumber: "A-1", title: "Wi-Fi disconnected", description: "Constant packet loss and dropping internet connection since yesterday night.", category: "Internet", priority: "High", status: "Pending", assignedStaffId: null, assignedStaffName: null, comments: [], date: "2026-07-02" }
  ];

  const maintenance: Maintenance[] = [
    { id: "MAINT-1", propertyId: "PROP-1", propertyName: "Grand Heights PG", title: "Water Tank Cleaning", roomId: null, roomNumber: null, cost: 4500, description: "Routine semi-annual water tank cleaning and disinfection.", status: "Completed", assignedStaffId: "STAF-4", assignedStaffName: "Manish Singh", date: "2026-06-20" },
    { id: "MAINT-2", propertyId: "PROP-1", propertyName: "Grand Heights PG", title: "Room 301 Wall Crack Repair", roomId: "ROOM-7", roomNumber: "301", cost: 8000, description: "Plastering and painting wall cracks to put the room back into service.", status: "In Progress", assignedStaffId: "STAF-4", assignedStaffName: "Manish Singh", date: "2026-07-01" }
  ];

  const notices: Notice[] = [
    { id: "NOT-1", title: "Elevator Maintenance Notice", content: "The main elevator of Grand Heights PG will remain closed on Sunday, July 5th, from 10:00 AM to 4:00 PM for scheduled maintenance. Please use the staircase.", audience: "All", date: "2026-07-01", status: "Published" },
    { id: "NOT-2", title: "Rent Overdue Deadline", content: "All tenants are requested to pay their monthly rent before the 5th of every month. Late payments are subject to standard delayed charges.", audience: "Tenants", date: "2026-07-02", status: "Published" },
    { id: "NOT-3", title: "Bi-monthly staff meeting", content: "Mandatory review meeting for all warden, housekeeping, security, and cleaning staff in the Warden room at 6 PM.", audience: "Staff", date: "2026-07-02", status: "Published" }
  ];

  const auditLogs: AuditLog[] = [
    { id: "AUD-1", userId: "USER-1", userName: "Admin", action: "LOGIN", details: "User Admin logged in from web portal", date: "2026-07-03 08:30" },
    { id: "AUD-2", userId: "USER-1", userName: "Admin", action: "TENANT_ADD", details: "Added Vikram Malhotra into Room A-1", date: "2026-05-01 11:20" }
  ];

  const settings: OrgSettings = {
    name: "Elite PG Management Co.",
    email: "contact@elitepgs.com",
    phone: "+91 99000 88000",
    currency: "INR",
    taxId: "GSTIN-29AAACE1234F1Z5",
    address: "786 Highrise Towers, MG Road, Bangalore"
  };

  const users: User[] = [
    { id: "USER-1", email: "admin@pgms.com", name: "Property Admin", role: "Property Admin", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
    { id: "USER-2", email: "staff@pgms.com", name: "Staff Member", role: "Staff" }
  ];

  return {
    users,
    properties,
    rooms,
    tenants,
    rent,
    staff,
    visitors,
    complaints,
    maintenance,
    notices,
    auditLogs,
    settings
  };
};

// Database helper
const loadDB = (): Database => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading db, resetting:", err);
    return getInitialDatabase();
  }
};

const saveDB = (db: Database) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error saving db:", err);
  }
};

// Log action helper
const logAction = (action: string, details: string, userName = "Admin") => {
  const db = loadDB();
  const log: AuditLog = {
    id: "AUD-" + generateId(),
    userId: "USER-1",
    userName,
    action,
    details,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 100) {
    db.auditLogs.pop();
  }
  saveDB(db);
};

// API v1 Router

// AUTH APIs
app.post("/api/v1/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  
  if (email === "admin@pgms.com" && password === "admin123") {
    const user = db.users.find(u => u.email === email);
    logAction("LOGIN", "Admin logged in successfully");
    return res.json({ token: "MOCK-JWT-TOKEN-ADMIN", user });
  } else if (email === "staff@pgms.com" && password === "staff123") {
    const user = db.users.find(u => u.email === email);
    logAction("LOGIN", "Staff logged in successfully", "Staff");
    return res.json({ token: "MOCK-JWT-TOKEN-STAFF", user });
  }
  
  return res.status(401).json({ message: "Invalid email or password" });
});

app.get("/api/v1/auth/me", (req, res) => {
  const token = req.headers.authorization;
  const db = loadDB();
  if (token === "Bearer MOCK-JWT-TOKEN-STAFF") {
    return res.json({ user: db.users.find(u => u.email === "staff@pgms.com") });
  }
  // Default to admin for standard mock token
  return res.json({ user: db.users.find(u => u.email === "admin@pgms.com") });
});

// DASHBOARD STATS
app.get("/api/v1/dashboard", (req, res) => {
  const { propertyId } = req.query;
  const db = loadDB();
  
  let rooms = db.rooms;
  let tenants = db.tenants;
  let rents = db.rent;
  let complaints = db.complaints;
  let maintenance = db.maintenance;
  
  if (propertyId && propertyId !== "all") {
    rooms = db.rooms.filter(r => r.propertyId === propertyId);
    tenants = db.tenants.filter(t => t.propertyId === propertyId);
    
    const propRooms = db.rooms.filter(r => r.propertyId === propertyId).map(r => r.roomNumber);
    rents = db.rent.filter(r => propRooms.includes(r.roomNumber));
    complaints = db.complaints.filter(c => propRooms.includes(c.roomNumber));
    maintenance = db.maintenance.filter(m => m.propertyId === propertyId);
  }
  
  // Calculate statistics
  const totalBeds = rooms.reduce((acc, r) => acc + r.totalBeds, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  
  const totalRevenue = rents
    .filter(r => r.status === "Paid")
    .reduce((acc, r) => acc + Number(r.amount), 0);
  
  const pendingRent = rents
    .filter(r => r.status === "Pending" || r.status === "Overdue")
    .reduce((acc, r) => acc + Number(r.amount), 0);

  const activeComplaints = complaints.filter(c => c.status !== "Resolved").length;
  
  res.json({
    totalRooms: rooms.length,
    totalBeds,
    occupiedBeds,
    occupancyRate,
    totalRevenue,
    pendingRent,
    activeComplaints,
    recentActivity: db.auditLogs.slice(0, 10),
    recentComplaints: complaints.slice(0, 5),
    visitorCount: db.visitors.filter(v => v.status === "Approved").length,
    notices: db.notices.filter(n => n.status === "Published").slice(0, 3)
  });
});

// PROPERTIES CRUD
app.get("/api/v1/properties", (req, res) => {
  const db = loadDB();
  res.json(db.properties);
});

app.post("/api/v1/properties", (req, res) => {
  const db = loadDB();
  const newProp: Property = {
    ...req.body,
    id: "PROP-" + generateId(),
    totalRooms: 0
  };
  db.properties.push(newProp);
  saveDB(db);
  logAction("PROPERTY_ADD", `Created property: ${newProp.name}`);
  res.json(newProp);
});

app.put("/api/v1/properties/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.properties.findIndex(p => p.id === id);
  if (idx > -1) {
    db.properties[idx] = { ...db.properties[idx], ...req.body };
    saveDB(db);
    logAction("PROPERTY_EDIT", `Edited property: ${db.properties[idx].name}`);
    res.json(db.properties[idx]);
  } else {
    res.status(404).json({ message: "Property not found" });
  }
});

app.delete("/api/v1/properties/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const prop = db.properties.find(p => p.id === id);
  if (prop) {
    db.properties = db.properties.filter(p => p.id !== id);
    // Cascade delete rooms, etc.? We keep it simple
    saveDB(db);
    logAction("PROPERTY_DELETE", `Deleted property: ${prop.name}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Property not found" });
  }
});

// ROOMS CRUD
app.get("/api/v1/rooms", (req, res) => {
  const { propertyId } = req.query;
  const db = loadDB();
  if (propertyId && propertyId !== "all") {
    return res.json(db.rooms.filter(r => r.propertyId === propertyId));
  }
  res.json(db.rooms);
});

app.post("/api/v1/rooms", (req, res) => {
  const db = loadDB();
  const newRoom: Room = {
    ...req.body,
    id: "ROOM-" + generateId(),
    occupiedBeds: 0,
    status: "Available"
  };
  db.rooms.push(newRoom);
  
  // Update property room count
  const prop = db.properties.find(p => p.id === newRoom.propertyId);
  if (prop) {
    prop.totalRooms += 1;
  }
  
  saveDB(db);
  logAction("ROOM_ADD", `Added Room ${newRoom.roomNumber}`);
  res.json(newRoom);
});

app.put("/api/v1/rooms/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.rooms.findIndex(r => r.id === id);
  if (idx > -1) {
    db.rooms[idx] = { ...db.rooms[idx], ...req.body };
    // Recalculate status based on occupied vs total beds
    const r = db.rooms[idx];
    if (r.status !== "Maintenance") {
      r.status = r.occupiedBeds >= r.totalBeds ? "Full" : "Available";
    }
    saveDB(db);
    logAction("ROOM_EDIT", `Edited Room ${r.roomNumber}`);
    res.json(r);
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

app.delete("/api/v1/rooms/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const rIdx = db.rooms.findIndex(r => r.id === id);
  if (rIdx > -1) {
    const room = db.rooms[rIdx];
    const prop = db.properties.find(p => p.id === room.propertyId);
    if (prop) {
      prop.totalRooms = Math.max(0, prop.totalRooms - 1);
    }
    db.rooms.splice(rIdx, 1);
    saveDB(db);
    logAction("ROOM_DELETE", `Deleted Room ${room.roomNumber}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

// TENANTS CRUD
app.get("/api/v1/tenants", (req, res) => {
  const db = loadDB();
  res.json(db.tenants);
});

app.post("/api/v1/tenants", (req, res) => {
  const db = loadDB();
  const tenantData = req.body;
  const newTenant: Tenant = {
    ...tenantData,
    id: "TEN-" + generateId(),
    status: "Active"
  };
  
  // Allocate room bed
  const room = db.rooms.find(r => r.id === newTenant.roomId);
  if (room) {
    room.occupiedBeds = Math.min(room.totalBeds, room.occupiedBeds + 1);
    room.status = room.occupiedBeds >= room.totalBeds ? "Full" : "Available";
    newTenant.roomNumber = room.roomNumber;
    newTenant.propertyId = room.propertyId;
  }
  
  db.tenants.push(newTenant);
  
  // Create first month rent entry
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const rentDueDate = new Date();
  rentDueDate.setDate(rentDueDate.getDate() + 5);
  
  const newRent: Rent = {
    id: "RENT-" + generateId(),
    tenantId: newTenant.id,
    tenantName: newTenant.name,
    roomNumber: newTenant.roomNumber,
    month: currentMonth,
    amount: newTenant.rentAmount,
    status: "Pending",
    dueDate: rentDueDate.toISOString().substring(0, 10),
    paidDate: null,
    invoiceId: "INV-" + Math.floor(100000 + Math.random() * 900000)
  };
  db.rent.push(newRent);
  
  saveDB(db);
  logAction("TENANT_ADD", `Registered tenant ${newTenant.name} in Room ${newTenant.roomNumber}`);
  res.json(newTenant);
});

app.put("/api/v1/tenants/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.tenants.findIndex(t => t.id === id);
  if (idx > -1) {
    db.tenants[idx] = { ...db.tenants[idx], ...req.body };
    saveDB(db);
    logAction("TENANT_EDIT", `Edited Tenant: ${db.tenants[idx].name}`);
    res.json(db.tenants[idx]);
  } else {
    res.status(404).json({ message: "Tenant not found" });
  }
});

app.post("/api/v1/tenants/:id/checkout", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const tenant = db.tenants.find(t => t.id === id);
  if (tenant) {
    tenant.status = "Checked Out";
    tenant.checkOutDate = new Date().toISOString().substring(0, 10);
    
    // Free room bed
    const room = db.rooms.find(r => r.id === tenant.roomId);
    if (room) {
      room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
      room.status = room.occupiedBeds >= room.totalBeds ? "Full" : "Available";
    }
    
    saveDB(db);
    logAction("TENANT_CHECKOUT", `Checked out tenant: ${tenant.name} from Room ${tenant.roomNumber}`);
    res.json(tenant);
  } else {
    res.status(404).json({ message: "Tenant not found" });
  }
});

app.delete("/api/v1/tenants/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const tenant = db.tenants.find(t => t.id === id);
  if (tenant) {
    // If active, free the bed
    if (tenant.status === "Active") {
      const room = db.rooms.find(r => r.id === tenant.roomId);
      if (room) {
        room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
        room.status = room.occupiedBeds >= room.totalBeds ? "Full" : "Available";
      }
    }
    db.tenants = db.tenants.filter(t => t.id !== id);
    saveDB(db);
    logAction("TENANT_DELETE", `Removed tenant record: ${tenant.name}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Tenant not found" });
  }
});

// RENT CRUD
app.get("/api/v1/rent", (req, res) => {
  const db = loadDB();
  res.json(db.rent);
});

app.post("/api/v1/rent/:id/pay", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const rentItem = db.rent.find(r => r.id === id);
  if (rentItem) {
    rentItem.status = "Paid";
    rentItem.paidDate = new Date().toISOString().substring(0, 10);
    saveDB(db);
    logAction("RENT_PAY", `Rent of ${rentItem.amount} Paid by ${rentItem.tenantName}`);
    res.json(rentItem);
  } else {
    res.status(404).json({ message: "Rent entry not found" });
  }
});

// Create generic bills for all active tenants for a new month
app.post("/api/v1/rent/generate-bills", (req, res) => {
  const { month } = req.body; // e.g., "2026-08"
  const db = loadDB();
  let count = 0;
  
  db.tenants.forEach(tenant => {
    if (tenant.status === "Active") {
      // Check if already exists
      const exists = db.rent.some(r => r.tenantId === tenant.id && r.month === month);
      if (!exists) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(5);
        
        const newRent: Rent = {
          id: "RENT-" + generateId(),
          tenantId: tenant.id,
          tenantName: tenant.name,
          roomNumber: tenant.roomNumber,
          month,
          amount: tenant.rentAmount,
          status: "Pending",
          dueDate: dueDate.toISOString().substring(0, 10),
          paidDate: null,
          invoiceId: "INV-" + Math.floor(100000 + Math.random() * 900000)
        };
        db.rent.push(newRent);
        count++;
      }
    }
  });
  
  if (count > 0) {
    saveDB(db);
    logAction("RENT_GENERATE", `Generated ${count} rent bills for month ${month}`);
  }
  
  res.json({ success: true, count });
});

// STAFF CRUD
app.get("/api/v1/staff", (req, res) => {
  const db = loadDB();
  res.json(db.staff);
});

app.post("/api/v1/staff", (req, res) => {
  const db = loadDB();
  const newStaff: Staff = {
    ...req.body,
    id: "STAF-" + generateId(),
    attendance: "Present",
    performance: "Good"
  };
  db.staff.push(newStaff);
  saveDB(db);
  logAction("STAFF_ADD", `Added staff member: ${newStaff.name}`);
  res.json(newStaff);
});

app.put("/api/v1/staff/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.staff.findIndex(s => s.id === id);
  if (idx > -1) {
    db.staff[idx] = { ...db.staff[idx], ...req.body };
    saveDB(db);
    logAction("STAFF_EDIT", `Edited staff: ${db.staff[idx].name}`);
    res.json(db.staff[idx]);
  } else {
    res.status(404).json({ message: "Staff not found" });
  }
});

app.delete("/api/v1/staff/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const s = db.staff.find(staffMember => staffMember.id === id);
  if (s) {
    db.staff = db.staff.filter(staffMember => staffMember.id !== id);
    saveDB(db);
    logAction("STAFF_DELETE", `Removed staff member: ${s.name}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Staff not found" });
  }
});

// VISITORS CRUD
app.get("/api/v1/visitors", (req, res) => {
  const db = loadDB();
  res.json(db.visitors);
});

app.post("/api/v1/visitors", (req, res) => {
  const db = loadDB();
  const tenant = db.tenants.find(t => t.id === req.body.hostTenantId);
  const newVisitor: Visitor = {
    ...req.body,
    id: "VIS-" + generateId(),
    hostTenantName: tenant ? tenant.name : "Unknown",
    checkIn: new Date().toISOString().replace('T', ' ').substring(0, 16),
    checkOut: null,
    status: "Approved"
  };
  db.visitors.push(newVisitor);
  saveDB(db);
  logAction("VISITOR_CHECKIN", `Checked-in visitor: ${newVisitor.name} for Tenant ${newVisitor.hostTenantName}`);
  res.json(newVisitor);
});

app.post("/api/v1/visitors/:id/checkout", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const visitor = db.visitors.find(v => v.id === id);
  if (visitor) {
    visitor.status = "Checked Out";
    visitor.checkOut = new Date().toISOString().replace('T', ' ').substring(0, 16);
    saveDB(db);
    logAction("VISITOR_CHECKOUT", `Checked-out visitor: ${visitor.name}`);
    res.json(visitor);
  } else {
    res.status(404).json({ message: "Visitor not found" });
  }
});

app.delete("/api/v1/visitors/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.visitors = db.visitors.filter(v => v.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// COMPLAINTS CRUD
app.get("/api/v1/complaints", (req, res) => {
  const db = loadDB();
  res.json(db.complaints);
});

app.post("/api/v1/complaints", (req, res) => {
  const db = loadDB();
  const tenant = db.tenants.find(t => t.id === req.body.tenantId);
  const newComplaint: Complaint = {
    ...req.body,
    id: "COMP-" + generateId(),
    tenantName: tenant ? tenant.name : "Unknown",
    roomNumber: tenant ? tenant.roomNumber : "N/A",
    status: "Pending",
    comments: [],
    assignedStaffId: null,
    assignedStaffName: null,
    date: new Date().toISOString().substring(0, 10)
  };
  db.complaints.unshift(newComplaint);
  saveDB(db);
  logAction("COMPLAINT_ADD", `Registered complaint: ${newComplaint.title} by ${newComplaint.tenantName}`);
  res.json(newComplaint);
});

app.put("/api/v1/complaints/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.complaints.findIndex(c => c.id === id);
  if (idx > -1) {
    const updated = { ...db.complaints[idx], ...req.body };
    
    // Assigning staff details
    if (req.body.assignedStaffId && req.body.assignedStaffId !== db.complaints[idx].assignedStaffId) {
      const s = db.staff.find(st => st.id === req.body.assignedStaffId);
      if (s) {
        updated.assignedStaffName = s.name;
      }
    }
    
    db.complaints[idx] = updated;
    saveDB(db);
    logAction("COMPLAINT_EDIT", `Updated complaint: ${updated.title} (Status: ${updated.status})`);
    res.json(updated);
  } else {
    res.status(404).json({ message: "Complaint not found" });
  }
});

app.post("/api/v1/complaints/:id/comment", (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const db = loadDB();
  const complaint = db.complaints.find(c => c.id === id);
  if (complaint) {
    complaint.comments.push(comment);
    saveDB(db);
    res.json(complaint);
  } else {
    res.status(404).json({ message: "Complaint not found" });
  }
});

app.delete("/api/v1/complaints/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.complaints = db.complaints.filter(c => c.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// MAINTENANCE CRUD
app.get("/api/v1/maintenance", (req, res) => {
  const db = loadDB();
  res.json(db.maintenance);
});

app.post("/api/v1/maintenance", (req, res) => {
  const db = loadDB();
  const prop = db.properties.find(p => p.id === req.body.propertyId);
  const room = db.rooms.find(r => r.id === req.body.roomId);
  const staffMember = db.staff.find(s => s.id === req.body.assignedStaffId);

  const newMaint: Maintenance = {
    ...req.body,
    id: "MAINT-" + generateId(),
    propertyName: prop ? prop.name : "Unknown",
    roomNumber: room ? room.roomNumber : null,
    assignedStaffName: staffMember ? staffMember.name : null,
    date: new Date().toISOString().substring(0, 10)
  };
  
  db.maintenance.unshift(newMaint);
  saveDB(db);
  logAction("MAINT_ADD", `Logged maintenance order: ${newMaint.title}`);
  res.json(newMaint);
});

app.put("/api/v1/maintenance/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.maintenance.findIndex(m => m.id === id);
  if (idx > -1) {
    const updated = { ...db.maintenance[idx], ...req.body };
    
    if (req.body.assignedStaffId) {
      const s = db.staff.find(st => st.id === req.body.assignedStaffId);
      if (s) {
        updated.assignedStaffName = s.name;
      }
    }
    
    db.maintenance[idx] = updated;
    saveDB(db);
    logAction("MAINT_EDIT", `Updated maintenance work: ${updated.title}`);
    res.json(updated);
  } else {
    res.status(404).json({ message: "Maintenance order not found" });
  }
});

app.delete("/api/v1/maintenance/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.maintenance = db.maintenance.filter(m => m.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// NOTICES CRUD
app.get("/api/v1/notices", (req, res) => {
  const db = loadDB();
  res.json(db.notices);
});

app.post("/api/v1/notices", (req, res) => {
  const db = loadDB();
  const newNotice: Notice = {
    ...req.body,
    id: "NOT-" + generateId(),
    date: new Date().toISOString().substring(0, 10)
  };
  db.notices.unshift(newNotice);
  saveDB(db);
  logAction("NOTICE_ADD", `Published announcement: ${newNotice.title}`);
  res.json(newNotice);
});

app.put("/api/v1/notices/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.notices.findIndex(n => n.id === id);
  if (idx > -1) {
    db.notices[idx] = { ...db.notices[idx], ...req.body };
    saveDB(db);
    logAction("NOTICE_EDIT", `Edited announcement: ${db.notices[idx].title}`);
    res.json(db.notices[idx]);
  } else {
    res.status(404).json({ message: "Notice not found" });
  }
});

app.delete("/api/v1/notices/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.notices = db.notices.filter(n => n.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// SETTINGS APIS
app.get("/api/v1/settings", (req, res) => {
  const db = loadDB();
  res.json(db.settings);
});

app.put("/api/v1/settings", (req, res) => {
  const db = loadDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  logAction("SETTINGS_EDIT", `Updated Organization profile`);
  res.json(db.settings);
});

// RECOGNIZED DOCUMENT UPLOAD MOCK
app.post("/api/v1/uploads", (req, res) => {
  res.json({ url: "/uploads/uploaded_document.pdf" });
});

// AUDIT LOGS
app.get("/api/v1/audit-logs", (req, res) => {
  const db = loadDB();
  res.json(db.auditLogs);
});

// Serving the React Client Side SPA in production, and Vite in development
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PGMS] Full-Stack server is actively running on port ${PORT}`);
  });
};

startServer();
