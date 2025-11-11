const express = require('express');
const router = express.Router();
const { createVehicle, getVehicles } = require('../controllers/vehicleController');
const { validateVehicle } = require('../validator/vehicle_validator');
const { validationResult } = require('express-validator');
const { authorizeRole } = require('../middlewares/auth');

router.post('/vehicles', validateVehicle, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
},authorizeRole('admin'), createVehicle);
router.get('/vehicles', authorizeRole('admin'),getVehicles);

module.exports = router;