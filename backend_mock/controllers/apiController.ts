import { Request, Response } from "express";
import { loadDB, saveDB } from "../config/db";
import { generateId, logAction } from "../utils/helper";
import { 
  Property, Room, Tenant, Rent, Staff, Visitor, Complaint, Maintenance, Notice
} from "../models/types";

// Auth Controllers
export const login = (req: Request, res: Response) => {
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
};

export const getMe = (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const db = loadDB();
  if (token === "Bearer MOCK-JWT-TOKEN-STAFF") {
    return res.json({ user: db.users.find(u => u.email === "staff@pgms.com") });
  }
  return res.json({ user: db.users.find(u => u.email === "admin@pgms.com") });
};

// Dashboard Stats Controller
export const getDashboardStats = (req: Request, res: Response) => {
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
};

// Properties Controllers
export const getProperties = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.properties);
};

export const createProperty = (req: Request, res: Response) => {
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
};

export const updateProperty = (req: Request, res: Response) => {
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
};

export const deleteProperty = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  const prop = db.properties.find(p => p.id === id);
  if (prop) {
    db.properties = db.properties.filter(p => p.id !== id);
    saveDB(db);
    logAction("PROPERTY_DELETE", `Deleted property: ${prop.name}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Property not found" });
  }
};

// Rooms Controllers
export const getRooms = (req: Request, res: Response) => {
  const { propertyId } = req.query;
  const db = loadDB();
  if (propertyId && propertyId !== "all") {
    return res.json(db.rooms.filter(r => r.propertyId === propertyId as string));
  }
  res.json(db.rooms);
};

export const createRoom = (req: Request, res: Response) => {
  const db = loadDB();
  const newRoom: Room = {
    ...req.body,
    id: "ROOM-" + generateId(),
    occupiedBeds: 0,
    status: "Available"
  };
  db.rooms.push(newRoom);
  
  const prop = db.properties.find(p => p.id === newRoom.propertyId);
  if (prop) {
    prop.totalRooms += 1;
  }
  
  saveDB(db);
  logAction("ROOM_ADD", `Added Room ${newRoom.roomNumber}`);
  res.json(newRoom);
};

export const updateRoom = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.rooms.findIndex(r => r.id === id);
  if (idx > -1) {
    db.rooms[idx] = { ...db.rooms[idx], ...req.body };
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
};

export const deleteRoom = (req: Request, res: Response) => {
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
};

// Tenants Controllers
export const getTenants = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.tenants);
};

export const createTenant = (req: Request, res: Response) => {
  const db = loadDB();
  const tenantData = req.body;
  const newTenant: Tenant = {
    ...tenantData,
    id: "TEN-" + generateId(),
    status: "Active"
  };
  
  const room = db.rooms.find(r => r.id === newTenant.roomId);
  if (room) {
    room.occupiedBeds = Math.min(room.totalBeds, room.occupiedBeds + 1);
    room.status = room.occupiedBeds >= room.totalBeds ? "Full" : "Available";
    newTenant.roomNumber = room.roomNumber;
    newTenant.propertyId = room.propertyId;
  }
  
  db.tenants.push(newTenant);
  
  const currentMonth = new Date().toISOString().substring(0, 7);
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
};

export const updateTenant = (req: Request, res: Response) => {
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
};

export const checkoutTenant = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  const tenant = db.tenants.find(t => t.id === id);
  if (tenant) {
    tenant.status = "Checked Out";
    tenant.checkOutDate = new Date().toISOString().substring(0, 10);
    
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
};

export const deleteTenant = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  const tenant = db.tenants.find(t => t.id === id);
  if (tenant) {
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
};

// Rent Controllers
export const getRent = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.rent);
};

export const payRent = (req: Request, res: Response) => {
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
};

export const generateRentBills = (req: Request, res: Response) => {
  const { month } = req.body;
  const db = loadDB();
  let count = 0;
  
  db.tenants.forEach(tenant => {
    if (tenant.status === "Active") {
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
};

// Staff Controllers
export const getStaff = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.staff);
};

export const createStaff = (req: Request, res: Response) => {
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
};

export const updateStaff = (req: Request, res: Response) => {
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
};

export const deleteStaff = (req: Request, res: Response) => {
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
};

// Visitors Controllers
export const getVisitors = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.visitors);
};

export const createVisitor = (req: Request, res: Response) => {
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
};

export const checkoutVisitor = (req: Request, res: Response) => {
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
};

export const deleteVisitor = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  db.visitors = db.visitors.filter(v => v.id !== id);
  saveDB(db);
  res.json({ success: true });
};

// Complaints Controllers
export const getComplaints = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.complaints);
};

export const createComplaint = (req: Request, res: Response) => {
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
};

export const updateComplaint = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.complaints.findIndex(c => c.id === id);
  if (idx > -1) {
    const updated = { ...db.complaints[idx], ...req.body };
    
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
};

export const commentComplaint = (req: Request, res: Response) => {
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
};

export const deleteComplaint = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  db.complaints = db.complaints.filter(c => c.id !== id);
  saveDB(db);
  res.json({ success: true });
};

export const updateComplaintStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = loadDB();
  const idx = db.complaints.findIndex(c => c.id === id);
  if (idx > -1) {
    db.complaints[idx].status = status;
    saveDB(db);
    logAction("STATUS_CHANGE", `Updated complaint: ${db.complaints[idx].title} to status: ${status}`);
    res.json(db.complaints[idx]);
  } else {
    res.status(404).json({ message: "Complaint not found" });
  }
};

// Maintenance Controllers
export const getMaintenance = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.maintenance);
};

export const createMaintenance = (req: Request, res: Response) => {
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
};

export const updateMaintenance = (req: Request, res: Response) => {
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
};

export const deleteMaintenance = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  db.maintenance = db.maintenance.filter(m => m.id !== id);
  saveDB(db);
  res.json({ success: true });
};

export const completeMaintenanceTask = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  const idx = db.maintenance.findIndex(m => m.id === id);
  if (idx > -1) {
    db.maintenance[idx].status = "Completed";
    saveDB(db);
    logAction("STATUS_CHANGE", `Completed maintenance work: ${db.maintenance[idx].title}`);
    res.json(db.maintenance[idx]);
  } else {
    res.status(404).json({ message: "Maintenance order not found" });
  }
};

// Notices Controllers
export const getNotices = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.notices);
};

export const createNotice = (req: Request, res: Response) => {
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
};

export const updateNotice = (req: Request, res: Response) => {
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
};

export const deleteNotice = (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  db.notices = db.notices.filter(n => n.id !== id);
  saveDB(db);
  res.json({ success: true });
};

// Settings Controllers
export const getSettings = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.settings);
};

export const updateSettings = (req: Request, res: Response) => {
  const db = loadDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  logAction("SETTINGS_EDIT", `Updated Organization profile`);
  res.json(db.settings);
};

// Upload mock
export const uploadFile = (req: Request, res: Response) => {
  res.json({ url: "/uploads/uploaded_document.pdf" });
};

// Audit Logs Controller
export const getAuditLogs = (req: Request, res: Response) => {
  const db = loadDB();
  res.json(db.auditLogs);
};
