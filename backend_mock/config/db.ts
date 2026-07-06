import fs from "fs";
import path from "path";
import { 
  User, Property, Room, Tenant, Rent, Staff, Visitor, Complaint, Maintenance, Notice, AuditLog, OrgSettings
} from "../models/types";

const DB_FILE = path.join(process.cwd(), "server_db.json");

export interface Database {
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
    { id: "ROOM-1", propertyId: "PROP-1", roomNumber: "101", floor: 1, type: "Single", price: 12000, totalBeds: 1, occupiedBeds: 1, status: "Full" },
    { id: "ROOM-2", propertyId: "PROP-1", roomNumber: "102", floor: 1, type: "Double", price: 8000, totalBeds: 2, occupiedBeds: 1, status: "Available" },
    { id: "ROOM-3", propertyId: "PROP-1", roomNumber: "103", floor: 1, type: "Triple", price: 6000, totalBeds: 3, occupiedBeds: 3, status: "Full" },
    { id: "ROOM-4", propertyId: "PROP-1", roomNumber: "201", floor: 2, type: "Single", price: 12000, totalBeds: 1, occupiedBeds: 0, status: "Available" },
    { id: "ROOM-5", propertyId: "PROP-1", roomNumber: "202", floor: 2, type: "Double", price: 8500, totalBeds: 2, occupiedBeds: 2, status: "Full" },
    { id: "ROOM-6", propertyId: "PROP-1", roomNumber: "203", floor: 2, type: "Four-Sharing", price: 5000, totalBeds: 4, occupiedBeds: 1, status: "Available" },
    { id: "ROOM-7", propertyId: "PROP-1", roomNumber: "301", floor: 3, type: "Single", price: 12500, totalBeds: 1, occupiedBeds: 0, status: "Maintenance" },

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

export const loadDB = (): Database => {
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
    const initial = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
};

export const saveDB = (db: Database) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error saving db:", err);
  }
};
