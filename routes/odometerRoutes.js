const express = require('express');
const router = express.Router();
const { addOdometerReading, getodometerReading } = require('../controllers/odometerController');
const { odometerSchema } = require('../validator/odometer_validator');
const { validationResult } = require('express-validator');
const { authorizeRole } = require('../middlewares/auth');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
 
router.post('/:id/odometer', authorizeRole('admin'),odometerSchema, handleValidationErrors, addOdometerReading);

router.get('/:id/odometer',authorizeRole('admin'), getodometerReading);

module.exports = router;
