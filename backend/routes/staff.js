const express = require('express');
const router = express.Router();
const { getStaff, getStaffMember, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const staffUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]);

router.route('/')
  .get(protect, getStaff)
  .post(protect, staffUpload, createStaff);

router.route('/:id')
  .get(protect, getStaffMember)
  .put(protect, staffUpload, updateStaff)
  .delete(protect, deleteStaff);

module.exports = router;
