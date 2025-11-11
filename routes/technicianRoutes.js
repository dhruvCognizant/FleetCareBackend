const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const { authorizeRole, authorizeRoles } = require("../middlewares/auth");
const {
  getUnassignedServices,
  createAssignment,
  updateAssignmentStatus,
  getAllTechnicianAssignments,
} = require("../controllers/technicianController");
const {
  createAssignmentSchema,
  updateAssignmentStatusSchema,
} = require("../validator/technician_validator");

router.get(
  "/unassigned-services",
  authorizeRole("admin"),
  getUnassignedServices
);

router.post(
  "/assignments",
  authorizeRole("admin"),
  createAssignmentSchema,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    createAssignment(req, res, next);
  }
);

router.get(
  "/assignments",
  authorizeRoles(["technician", "admin"]),
  getAllTechnicianAssignments
);

router.patch(
  "/assignments/:id/status",
  authorizeRoles(["technician"]),
  updateAssignmentStatusSchema,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    updateAssignmentStatus(req, res, next);
  }
);

module.exports = router;
