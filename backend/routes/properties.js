const express = require('express');
const router = express.Router();
const { getProperties, getProperty, getPropertyDetail, createProperty, updateProperty, deleteProperty } = require('../controllers/propertyController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getProperties)
  .post(protect, upload.array('images', 5), createProperty);

router.route('/:id/detail')
  .get(protect, getPropertyDetail);

router.route('/:id')
  .get(protect, getProperty)
  .put(protect, upload.array('images', 5), updateProperty)
  .delete(protect, deleteProperty);

module.exports = router;
