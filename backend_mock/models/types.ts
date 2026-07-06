export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Property Admin' | 'Manager' | 'Staff';
  avatar?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  amenities: string[];
  totalRooms: number;
  image?: string;
}

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  type: 'Single' | 'Double' | 'Triple' | 'Four-Sharing';
  price: number;
  totalBeds: number;
  occupiedBeds: number;
  status: 'Available' | 'Full' | 'Maintenance';
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: number;
  occupiedByTenantId: string | null;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  idProofType: string;
  idProofNumber: string;
  docUrl: string | null;
  propertyId: string;
  roomId: string;
  roomNumber: string;
  bedNumber: number;
  rentAmount: number;
  depositAmount: number;
  checkInDate: string;
  checkOutDate: string | null;
  emergencyContact: EmergencyContact;
  status: 'Active' | 'Checked Out' | 'Upcoming';
}

export interface Rent {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  month: string; // e.g. "2026-07"
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  dueDate: string;
  paidDate: string | null;
  invoiceId: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  salary: number;
  attendance: 'Present' | 'Absent' | 'On Leave';
  shift: 'Day' | 'Night' | 'Evening';
  performance: string;
}

export interface Visitor {
  id: string;
  name: string;
  hostTenantId: string;
  hostTenantName: string;
  phone: string;
  relation: string;
  checkIn: string;
  checkOut: string | null;
  purpose: string;
  status: 'Approved' | 'Pending' | 'Checked Out';
}

export interface Complaint {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  title: string;
  description: string;
  category: 'Plumbing' | 'Electrical' | 'Internet' | 'Cleaning' | 'Food' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Resolved';
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  comments: string[];
  date: string;
}

export interface Maintenance {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  roomId: string | null;
  roomNumber: string | null;
  cost: number;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  audience: 'All' | 'Tenants' | 'Staff';
  date: string;
  status: 'Published' | 'Draft' | 'Expired';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  date: string;
}

export interface OrgSettings {
  name: string;
  email: string;
  phone: string;
  currency: string;
  taxId: string;
  address: string;
}
