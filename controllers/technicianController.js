const ServiceModel = require("../models/Service");
const TechnicianModel = require("../models/TechnicianRegister");
const jwt = require("jsonwebtoken");

// GET /api/technician/unassigned-services
exports.getUnassignedServices = async (req, res, next) => {
  try {
    const services = await ServiceModel.find({
      status: "Unassigned",
      technicianId: { $ne: null },
    }).lean();

    console.log("Unassigned services fetched:", services);

    res.status(200).json(services);
  } catch (err) {
    next(err);
  }
};

// POST /api/technician/assignments
exports.createAssignment = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      const err = new Error("Service ID is required.");
      err.statusCode = 400;
      return next(err);
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      const err = new Error("Corresponding service schedule not found.");
      err.statusCode = 400;
      return next(err);
    }

    const techIdToUse = service.technicianId;
    if (!techIdToUse) {
      const err = new Error("No technician specified on this service.");
      err.statusCode = 400;
      return next(err);
    }

    const tech = await TechnicianModel.findById(techIdToUse).lean();
    if (!tech) {
      const err = new Error("Technician not found");
      err.statusCode = 400;
      return next(err);
    }

    const requiredServiceType = service.serviceType;
    if (!requiredServiceType) {
      const err = new Error("Service record missing serviceType");
      err.statusCode = 400;
      return next(err);
    }
    const hasSkill =
      Array.isArray(tech.skills) &&
      tech.skills.some(
        (s) =>
          String(s).toLowerCase() === String(requiredServiceType).toLowerCase()
      );
    if (!hasSkill) {
      const err = new Error("Technician does not have the required skill");
      err.statusCode = 400;
      return next(err);
    }

    const weekdayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayDay = weekdayNames[new Date().getDay()];
    const availabilityArray = Array.isArray(tech.availability)
      ? tech.availability.map((d) => String(d).toLowerCase())
      : [String(tech.availability || "").toLowerCase()];
    if (!availabilityArray.includes(todayDay)) {
      const err = new Error(`Technician is not available today (${todayDay})`);
      err.statusCode = 400;
      return next(err);
    }

    const busy = await ServiceModel.findOne({
      technicianId: techIdToUse,
      status: { $ne: "Completed" },
      _id: { $ne: service._id },
    });
    if (busy) {
      const err = new Error("Technician already has an active assignment");
      err.statusCode = 400;
      return next(err);
    }

    service.status = "Assigned";
    service.assignmentDate = new Date();
    await service.save();

    return res.status(200).json({
      message: "Service assigned",
      serviceId: service._id,
      technicianName: `${tech.firstName} ${tech.lastName}`.trim(),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/technician/assignments/:id/status
exports.updateAssignmentStatus = async (req, res, next) => {
  try {
    const serviceId = req.params.id; // Service._id from URL
    const { status } = req.body;
    const technicianId = req.user && (req.user.id || req.user._id);

    if (!status) {
      const err = new Error("status is required");
      err.statusCode = 400;
      return next(err);
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      const err = new Error("Service not found");
      err.statusCode = 400;
      return next(err);
    }

    if (
      !service.technicianId ||
      String(service.technicianId) !== String(technicianId)
    ) {
      const err = new Error("You are not assigned to this service");
      err.statusCode = 400;
      return next(err);
    }

    service.status = status;
    if (String(status).toLowerCase() === "completed") {
      service.technicianCompletedOn = new Date();
      service.completedOn = new Date();
    }

    await service.save();

    return res.status(200).json({
      message: "Assignment status updated",
      serviceId: service._id,
      status: service.status,
      technicianCompletedOn: service.technicianCompletedOn || null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/technician/assignments
exports.getAllTechnicianAssignments = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      const err = new Error("Missing token");
      err.statusCode = 400;
      return next(err);
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const credentialId = payload.id;
    const role = payload.role;

    if (role === "admin") {
      const allServices = await ServiceModel.find({
        status: { $in: ["Assigned", "Completed"] },
      })
        .populate("technicianId", "firstName lastName")
        .lean();
      return res.status(200).json(allServices);
    }

    if (role === "technician") {
      const technician = await TechnicianModel.findOne({
        credential: credentialId,
      });
      if (!technician) {
        const err = new Error("Technician not found");
        err.statusCode = 400;
        return next(err);
      }

      const services = await ServiceModel.find({
        technicianId: technician._id,
        status: { $in: ["Assigned", "Completed"] },
      })
        .populate("technicianId", "firstName lastName")
        .lean();

      if (!services.length) {
        const err = new Error("No assignments found for this technician");
        err.statusCode = 400;
        return next(err);
      }
      return res.status(200).json(services);
    }

    const err = new Error("Unauthorized role");
    err.statusCode = 400;
    return next(err);
  } catch (err) {
    next(err);
  }
};
