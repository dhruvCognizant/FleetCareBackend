const Vehicle = require("../models/Vehicle");
const Technician = require("../models/TechnicianRegister");
const Service = require("../models/Service");
const History = require("../models/History");

// GET /api/scheduling/vehicle/:id
exports.getVehicle = async (req, res, next) => {
  try {
    const vin = req.params.id;
    const vehicle = await Vehicle.findOne({ VIN: vin }).lean();

    if (!vehicle) {
      const err = new Error("Vehicle not found");
      err.statusCode = 400;
      return next(err);
    }

    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
};

// GET /api/scheduling/available-technicians
exports.getTechnitian = async (req, res, next) => {
  try {
    const curr_day = new Date()
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    const { serviceType } = req.query;
    const query = { availability: curr_day };
    if (serviceType) query.skills = serviceType;

    const technicians = await Technician.find(query).lean();

    const filtered = await Promise.all(
      technicians.map(async (tech) => {
        const activeService = await Service.findOne({
          technicianId: tech._id,
          status: { $ne: "Completed" },
          "payment.paymentStatus": { $ne: "Paid" },
        });
        return activeService ? null : tech;
      })
    );

    res.json({
      technician: filtered.filter(Boolean).map((tech) => ({
        _id: tech._id,
        name: `${tech.firstName} ${tech.lastName}`.trim(),
        skills: tech.skills,
        availability: tech.availability,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/scheduling/schedule
exports.specificScheduleService = async (req, res, next) => {
  try {
    const {
      vehicleVIN,
      vehicleId,
      serviceType,
      dueServiceDate,
      description,
      technicianId,
    } = req.body;

    let vin = vehicleVIN || vehicleId;
    if (!vin) {
      const err = new Error("vehicleVIN or vehicleId is required");
      err.statusCode = 400;
      return next(err);
    }

    let vehicle = null;
    if (vehicleVIN) vehicle = await Vehicle.findOne({ VIN: vehicleVIN });
    else vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      const err = new Error("Vehicle not found");
      err.statusCode = 400;
      return next(err);
    }

    let svcType = serviceType;
    const existingUnassigned = await Service.findOne({
      vehicleVIN: vehicle.VIN,
      status: "Unassigned",
    }).sort({ createdAt: -1 });
    if (!svcType && existingUnassigned)
      svcType = existingUnassigned.serviceType;
    if (!svcType) {
      const err = new Error("serviceType is required");
      err.statusCode = 400;
      return next(err);
    }

    if (existingUnassigned) {
      if (technicianId) {
        const tech = await Technician.findById(technicianId).lean();
        if (!tech) {
          const err = new Error("Technician not found");
          err.statusCode = 400;
          return next(err);
        }

        const hasSkill =
          Array.isArray(tech.skills) &&
          tech.skills.some(
            (s) => String(s).toLowerCase() === String(svcType).toLowerCase()
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
          const err = new Error(
            `Technician is not available today (${todayDay})`
          );
          err.statusCode = 400;
          return next(err);
        }

        const busy = await Service.findOne({
          technicianId: technicianId,
          status: { $ne: "Completed" },
          _id: { $ne: existingUnassigned._id },
        });
        if (busy) {
          const err = new Error("Technician already has an active assignment");
          err.statusCode = 400;
          return next(err);
        }

        existingUnassigned.technicianId = technicianId;
        existingUnassigned.technicianName = (
          (tech.firstName || "") +
          " " +
          (tech.lastName || "")
        ).trim();
      }

      existingUnassigned.serviceType = svcType;
      existingUnassigned.description =
        description || existingUnassigned.description;
      existingUnassigned.dueServiceDate =
        dueServiceDate || existingUnassigned.dueServiceDate;
      await existingUnassigned.save();

      return res.status(200).json({
        message: "Service updated",
        serviceId: existingUnassigned._id,
      });
    }

    const serviceDoc = new Service({
      vehicleVIN: vehicle.VIN,
      serviceType: svcType,
      description: description || "",
      dueServiceDate: dueServiceDate || null,
      status: "Unassigned",
      createdAt: new Date(),
    });

    if (technicianId) {
      const tech = await Technician.findById(technicianId).lean();
      if (!tech) {
        const err = new Error("Technician not found");
        err.statusCode = 400;
        return next(err);
      }

      const hasSkill =
        Array.isArray(tech.skills) &&
        tech.skills.some(
          (s) => String(s).toLowerCase() === String(svcType).toLowerCase()
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
        const err = new Error(
          `Technician is not available today (${todayDay})`
        );
        err.statusCode = 400;
        return next(err);
      }

      const busy = await Service.findOne({
        technicianId: technicianId,
        status: { $ne: "Completed" },
      });
      if (busy) {
        const err = new Error("Technician already has an active assignment");
        err.statusCode = 400;
        return next(err);
      }
      serviceDoc.technicianId = technicianId;
      serviceDoc.technicianName = (
        (tech.firstName || "") +
        " " +
        (tech.lastName || "")
      ).trim();
    }

    const saved = await serviceDoc.save();
    return res
      .status(200)
      .json({ message: "Service scheduled", serviceId: saved._id });
  } catch (err) {
    next(err);
  }
};

// GET /api/scheduling/scheduledServices
exports.getSchechuledServices = async (req, res, next) => {
  try {
    const services = await Service.find().lean();
    res.json({ scheduled_services: services });
  } catch (err) {
    next(err);
  }
};

// GET api/scheduling/unassigned
exports.getUnassignedServices = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      const err = new Error("Access denied. Admins only.");
      err.statusCode = 400;
      return next(err);
    }

    const unassignedServices = await Service.find({
      technicianId: null,
      technicianName: null,
    }).lean();

    const enriched = await Promise.all(
      unassignedServices.map(async (svc) => {
        const vehicle = await Vehicle.findOne({ VIN: svc.vehicleVIN }).lean();
        return {
          ...svc,
          vehicleType: vehicle?.type || "",
          vehicleMake: vehicle?.make || "",
          vehicleModel: vehicle?.model || "",
          vehicleYear: vehicle?.year || null,
          lastServiceDate: vehicle?.lastServiceDate || null,
        };
      })
    );

    res.json({ unassigned_services: enriched });
  } catch (err) {
    next(err);
  }
};
