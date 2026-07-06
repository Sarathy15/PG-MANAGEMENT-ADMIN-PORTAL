const express = require('express');
const router = express.Router();
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // for room images

router.route('/')
  .get(protect, getRooms)
  .post(protect, upload.array('images', 5), createRoom);

router.route('/:id')
  .get(protect, getRoom)
  .put(protect, upload.array('images', 5), updateRoom)
  .delete(protect, deleteRoom);

module.exports = router;
