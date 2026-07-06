const express = require('express');
const router = express.Router();
const { getRents, getRent, createRent, updateRent, deleteRent, generateRentBills } = require('../controllers/rentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getRents)
  .post(protect, upload.single('invoicePdf'), createRent);

router.post('/generate-bills', protect, generateRentBills);

router.route('/:id')
  .get(protect, getRent)
  .put(protect, upload.single('invoicePdf'), updateRent)
  .delete(protect, deleteRent);

module.exports = router;
