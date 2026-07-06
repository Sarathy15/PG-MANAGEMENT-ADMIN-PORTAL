import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  login,
  getMe,
  getDashboardStats,
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getTenants,
  createTenant,
  updateTenant,
  checkoutTenant,
  deleteTenant,
  getRent,
  payRent,
  generateRentBills,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getVisitors,
  createVisitor,
  checkoutVisitor,
  deleteVisitor,
  getComplaints,
  createComplaint,
  updateComplaint,
  updateComplaintStatus,
  commentComplaint,
  deleteComplaint,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  completeMaintenanceTask,
  deleteMaintenance,
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  getSettings,
  updateSettings,
  uploadFile,
  getAuditLogs
} from "../controllers/apiController";

const router = express.Router();

// Auth routes
router.post("/auth/login", login);
router.get("/auth/me", getMe);

// Dashboard routes
router.get("/dashboard", requireAuth, getDashboardStats);

// Properties routes
router.get("/properties", requireAuth, getProperties);
router.post("/properties", requireAuth, createProperty);
router.put("/properties/:id", requireAuth, updateProperty);
router.delete("/properties/:id", requireAuth, deleteProperty);

// Rooms routes
router.get("/rooms", requireAuth, getRooms);
router.post("/rooms", requireAuth, createRoom);
router.put("/rooms/:id", requireAuth, updateRoom);
router.delete("/rooms/:id", requireAuth, deleteRoom);

// Tenants routes
router.get("/tenants", requireAuth, getTenants);
router.post("/tenants", requireAuth, createTenant);
router.put("/tenants/:id", requireAuth, updateTenant);
router.post("/tenants/:id/checkout", requireAuth, checkoutTenant);
router.delete("/tenants/:id", requireAuth, deleteTenant);

// Rent routes
router.get("/rent", requireAuth, getRent);
router.post("/rent/:id/pay", requireAuth, payRent);
router.post("/rent/generate-bills", requireAuth, generateRentBills);

// Staff routes
router.get("/staff", requireAuth, getStaff);
router.post("/staff", requireAuth, createStaff);
router.put("/staff/:id", requireAuth, updateStaff);
router.delete("/staff/:id", requireAuth, deleteStaff);

// Visitors routes
router.get("/visitors", requireAuth, getVisitors);
router.post("/visitors", requireAuth, createVisitor);
router.post("/visitors/:id/checkout", requireAuth, checkoutVisitor);
router.delete("/visitors/:id", requireAuth, deleteVisitor);

// Complaints routes
router.get("/complaints", requireAuth, getComplaints);
router.post("/complaints", requireAuth, createComplaint);
router.put("/complaints/:id", requireAuth, updateComplaint);
router.post("/complaints/:id/status", requireAuth, updateComplaintStatus);
router.post("/complaints/:id/comment", requireAuth, commentComplaint);
router.delete("/complaints/:id", requireAuth, deleteComplaint);

// Maintenance routes
router.get("/maintenance", requireAuth, getMaintenance);
router.post("/maintenance", requireAuth, createMaintenance);
router.put("/maintenance/:id", requireAuth, updateMaintenance);
router.post("/maintenance/:id/complete", requireAuth, completeMaintenanceTask);
router.delete("/maintenance/:id", requireAuth, deleteMaintenance);

// Notices routes
router.get("/notices", requireAuth, getNotices);
router.post("/notices", requireAuth, createNotice);
router.put("/notices/:id", requireAuth, updateNotice);
router.delete("/notices/:id", requireAuth, deleteNotice);

// Settings routes
router.get("/settings", requireAuth, getSettings);
router.put("/settings", requireAuth, updateSettings);

// General logs & upload
router.get("/audit-logs", requireAuth, getAuditLogs);
router.post("/uploads", requireAuth, uploadFile);

export default router;
