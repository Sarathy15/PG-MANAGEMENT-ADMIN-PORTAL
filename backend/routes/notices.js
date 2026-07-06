const express = require('express');
const router = express.Router();
const { getNotices, getNotice, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getNotices)
  .post(protect, upload.array('attachments', 5), createNotice);

router.route('/:id')
  .get(protect, getNotice)
  .put(protect, upload.array('attachments', 5), updateNotice)
  .delete(protect, deleteNotice);

module.exports = router;
