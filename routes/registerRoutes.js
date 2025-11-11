const express = require("express");
const router = express.Router();
const { createTechnician } = require("../controllers/registerController");
const { createTechnicianSchema } = require("../validator/register_validator");
const { validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/",
  createTechnicianSchema,
  handleValidationErrors,
  createTechnician
);

module.exports = router;
