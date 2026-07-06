const express = require('express');
const router = express.Router();
const { getComplaints, getComplaint, createComplaint, updateComplaint, deleteComplaint } = require('../controllers/complaintController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getComplaints)
  .post(protect, upload.array('photos', 5), createComplaint);

router.route('/:id')
  .get(protect, getComplaint)
  .put(protect, upload.array('photos', 5), updateComplaint)
  .delete(protect, deleteComplaint);

module.exports = router;
