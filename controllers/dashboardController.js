const Vehicle = require("../models/Vehicle");
const Service = require("../models/Service");
const Technician = require("../models/TechnicianRegister");

// GET /api/dashboard/summary
exports.getSummary = async (req, res, next) => {
  try {
    const totalVehicals = await Vehicle.countDocuments();
    const scheduledServices = await Service.countDocuments();
    const inProgress = await Service.countDocuments({
      status: { $in: ["Work In Progress", "Assigned"] },
    });

    const completed = await Service.countDocuments({ status: "Completed" });

    const activeTechnicianIds = await Service.distinct("technicianId", {
      status: { $in: ["Work In Progress", "Assigned"] },
    });

    const activeTechnicians = activeTechnicianIds.filter(Boolean).length;

    const totalTechnicians = await Technician.countDocuments();

    res.json({
      totalVehicals,
      scheduledServices,
      inProgress,
      completed,
      activeTechnicians,
      totalTechnicians,
    });
  } catch (err) {
    next(err);
  }
};
