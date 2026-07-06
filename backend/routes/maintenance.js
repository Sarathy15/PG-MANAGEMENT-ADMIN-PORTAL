const express = require('express');
const router = express.Router();
const { getMainMaintenanceTasks, createMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask } = require('../controllers/maintenanceController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getMainMaintenanceTasks)
  .post(protect, createMaintenanceTask);

router.route('/:id')
  .put(protect, updateMaintenanceTask)
  .delete(protect, deleteMaintenanceTask);

module.exports = router;
