const express = require('express');
const router = express.Router();

const {  addServiceRecord, getAllHistories } = require('../controllers/historyController');

const { authenticate } = require('../middlewares/auth');
const { authorizeRole } = require('../middlewares/auth');
const { addServiceSchema } = require('../validator/history_validator');

router.post('/addService', addServiceSchema, authenticate, authorizeRole('admin'), addServiceRecord);
router.get('/allHistories', authenticate, authorizeRole('admin'), getAllHistories);

module.exports = router;