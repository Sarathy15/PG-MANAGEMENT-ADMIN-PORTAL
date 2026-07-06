import { 
  User, Property, Room, Tenant, Rent, Staff, Visitor, Complaint, Maintenance, Notice, AuditLog, OrgSettings
} from "../types";

const getHeaders = () => {
  const token = localStorage.getItem("pgms_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const api = {
  // Authentication
  async login(email: string, password: string) {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Invalid credentials");
    }
    return res.json(); // returns { token, user }
  },

  async me() {
    const res = await fetch("/api/v1/auth/me", {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json(); // returns { user }
  },

  // Dashboard Stats
  async getDashboardStats(propertyId: string) {
    const url = propertyId && propertyId !== "all" 
      ? `/api/v1/dashboard?propertyId=${propertyId}`
      : "/api/v1/dashboard";
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  // Properties
  async getProperties(): Promise<Property[]> {
    const res = await fetch("/api/v1/properties", { headers: getHeaders() });
    return res.json();
  },

  async createProperty(data: Partial<Property>): Promise<Property> {
    const res = await fetch("/api/v1/properties", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateProperty(id: string, data: Partial<Property>): Promise<Property> {
    const res = await fetch(`/api/v1/properties/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteProperty(id: string) {
    const res = await fetch(`/api/v1/properties/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Rooms
  async getRooms(propertyId?: string): Promise<Room[]> {
    const url = propertyId && propertyId !== "all"
      ? `/api/v1/rooms?propertyId=${propertyId}`
      : "/api/v1/rooms";
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  async createRoom(data: Partial<Room>): Promise<Room> {
    const res = await fetch("/api/v1/rooms", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    const res = await fetch(`/api/v1/rooms/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteRoom(id: string) {
    const res = await fetch(`/api/v1/rooms/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    const res = await fetch("/api/v1/tenants", { headers: getHeaders() });
    return res.json();
  },

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    const res = await fetch("/api/v1/tenants", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const res = await fetch(`/api/v1/tenants/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async checkoutTenant(id: string): Promise<Tenant> {
    const res = await fetch(`/api/v1/tenants/${id}/checkout`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  async deleteTenant(id: string) {
    const res = await fetch(`/api/v1/tenants/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Rent Entries
  async getRent(): Promise<Rent[]> {
    const res = await fetch("/api/v1/rent", { headers: getHeaders() });
    return res.json();
  },

  async payRent(id: string): Promise<Rent> {
    const res = await fetch(`/api/v1/rent/${id}/pay`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  async generateRentBills(month: string) {
    const res = await fetch("/api/v1/rent/generate-bills", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ month })
    });
    return res.json();
  },

  // Staff
  async getStaff(): Promise<Staff[]> {
    const res = await fetch("/api/v1/staff", { headers: getHeaders() });
    return res.json();
  },

  async createStaff(data: Partial<Staff>): Promise<Staff> {
    const res = await fetch("/api/v1/staff", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
    const res = await fetch(`/api/v1/staff/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteStaff(id: string) {
    const res = await fetch(`/api/v1/staff/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Visitors
  async getVisitors(): Promise<Visitor[]> {
    const res = await fetch("/api/v1/visitors", { headers: getHeaders() });
    return res.json();
  },

  async createVisitor(data: Partial<Visitor>): Promise<Visitor> {
    const res = await fetch("/api/v1/visitors", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async checkoutVisitor(id: string): Promise<Visitor> {
    const res = await fetch(`/api/v1/visitors/${id}/checkout`, {
      method: "POST",
      headers: getHeaders()
    });
    return res.json();
  },

  async deleteVisitor(id: string) {
    const res = await fetch(`/api/v1/visitors/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Complaints
  async getComplaints(): Promise<Complaint[]> {
    const res = await fetch("/api/v1/complaints", { headers: getHeaders() });
    return res.json();
  },

  async createComplaint(data: Partial<Complaint>): Promise<Complaint> {
    const res = await fetch("/api/v1/complaints", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateComplaint(id: string, data: Partial<Complaint>): Promise<Complaint> {
    const res = await fetch(`/api/v1/complaints/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async addComplaintComment(id: string, comment: string): Promise<Complaint> {
    const res = await fetch(`/api/v1/complaints/${id}/comment`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ comment })
    });
    return res.json();
  },

  async deleteComplaint(id: string) {
    const res = await fetch(`/api/v1/complaints/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Maintenance
  async getMaintenance(): Promise<Maintenance[]> {
    const res = await fetch("/api/v1/maintenance", { headers: getHeaders() });
    return res.json();
  },

  async createMaintenance(data: Partial<Maintenance>): Promise<Maintenance> {
    const res = await fetch("/api/v1/maintenance", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateMaintenance(id: string, data: Partial<Maintenance>): Promise<Maintenance> {
    const res = await fetch(`/api/v1/maintenance/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteMaintenance(id: string) {
    const res = await fetch(`/api/v1/maintenance/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Notices
  async getNotices(): Promise<Notice[]> {
    const res = await fetch("/api/v1/notices", { headers: getHeaders() });
    return res.json();
  },

  async createNotice(data: Partial<Notice>): Promise<Notice> {
    const res = await fetch("/api/v1/notices", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateNotice(id: string, data: Partial<Notice>): Promise<Notice> {
    const res = await fetch(`/api/v1/notices/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteNotice(id: string) {
    const res = await fetch(`/api/v1/notices/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.json();
  },

  // Settings
  async getSettings(): Promise<OrgSettings> {
    const res = await fetch("/api/v1/settings", { headers: getHeaders() });
    return res.json();
  },

  async updateSettings(data: OrgSettings): Promise<OrgSettings> {
    const res = await fetch("/api/v1/settings", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch("/api/v1/audit-logs", { headers: getHeaders() });
    return res.json();
  },

  // Document Uploads (Mock)
  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/v1/uploads", {
      method: "POST",
      headers: {
        ...(localStorage.getItem("pgms_token") ? { "Authorization": `Bearer ${localStorage.getItem("pgms_token")}` } : {})
      },
      body: formData
    });
    return res.json();
  }
};
