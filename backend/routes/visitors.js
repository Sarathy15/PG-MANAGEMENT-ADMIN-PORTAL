const express = require('express');
const router = express.Router();
const { getVisitors, getVisitor, createVisitor, updateVisitor, deleteVisitor, verifyOTP, approveVisitor, checkoutVisitor } = require('../controllers/visitorController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getVisitors)
  .post(protect, upload.single('idProof'), createVisitor);

router.route('/:id')
  .get(protect, getVisitor)
  .put(protect, upload.single('idProof'), updateVisitor)
  .delete(protect, deleteVisitor);

router.post('/:id/verify-otp', protect, verifyOTP);
router.post('/:id/approve', protect, approveVisitor);
router.post('/:id/checkout', protect, checkoutVisitor);

module.exports = router;
