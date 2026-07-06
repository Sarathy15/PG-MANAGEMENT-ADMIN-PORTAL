const express = require('express');
const router = express.Router();
const { getTenants, getTenant, createTenant, updateTenant, deleteTenant, checkinTenant, checkoutTenant } = require('../controllers/tenantController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const tenantUpload = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'agreement', maxCount: 1 }
]);

router.route('/')
  .get(protect, getTenants)
  .post(protect, tenantUpload, createTenant);

router.post('/add-tenant', protect, tenantUpload, createTenant);

// Support both endpoint patterns and methods (POST and PUT) for checkout and checkin
router.post('/checkin/:id', protect, checkinTenant);
router.put('/checkin/:id', protect, checkinTenant);
router.post('/:id/checkin', protect, checkinTenant);
router.put('/:id/checkin', protect, checkinTenant);

router.post('/checkout/:id', protect, checkoutTenant);
router.put('/checkout/:id', protect, checkoutTenant);
router.post('/:id/checkout', protect, checkoutTenant);
router.put('/:id/checkout', protect, checkoutTenant);

router.route('/:id')
  .get(protect, getTenant)
  .put(protect, tenantUpload, updateTenant)
  .delete(protect, deleteTenant);

module.exports = router;
