const express = require('express');
const router = express.Router();
const {getSummary } = require('../controllers/dashboardController');
const { authorizeRoles } = require('../middlewares/auth');

router.get('/summary',authorizeRoles(['technician','admin']),getSummary);

module.exports = router;