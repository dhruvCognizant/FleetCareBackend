const Service = require("../models/Service");
const Vehicle = require("../models/Vehicle");
const History = require("../models/History");

// POST /api/history/addService.
exports.addServiceRecord = async (req, res, next) => {
  try {
    const { serviceId, paymentStatus, cost } = req.body;
    if (!serviceId || !paymentStatus) {
      const err = new Error("serviceId and paymentStatus are required");
      err.statusCode = 400;
      return next(err);
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      const err = new Error("Service not found");
      err.statusCode = 400;
      return next(err);
    }

    const now = new Date();

    service.payment = service.payment || {};

    service.payment.paymentStatus = paymentStatus;

    if (typeof cost === "number") {
      service.payment.cost = cost;
    }

    let historyDoc = null;
    if (String(paymentStatus).toLowerCase() === "paid") {
      if (!service.completedOn) service.completedOn = now;

      historyDoc = new History({
        serviceId: service._id,
        vehicleVIN: service.vehicleVIN,
        technicianId: service.technicianId || null,
        technicianName: service.technicianName || "",
        serviceType: service.serviceType || "",
        dueServiceDate: service.dueServiceDate || null,
        paymentStatus: "Paid",
        cost: typeof cost === "number" ? cost : service.payment.cost || 0,
        workStatus: service.status || "Completed",
      });

      await historyDoc.save();

      service.payment.paymentStatus = "Paid";
      service.payment.cost = cost;
      service.payment.historyId = historyDoc._id;
    }

    const vehicle = await Vehicle.findOne({ VIN: service.vehicleVIN });
    if (vehicle) {
      vehicle.lastServiceDate = now;
      vehicle.serviceDetails = vehicle.serviceDetails || [];

      vehicle.serviceDetails.push({
        serviceId: service._id,
        serviceType: service.serviceType,
        technicianId: service.technicianId || null,
        serviceCompletedOn: now,
        cost: service.payment.cost || 0,
      });
      await vehicle.save();
    }

    await service.save();

    return res.status(200).json({
      message: "Payment status updated",
      serviceId: service._id,
      historyId: historyDoc ? historyDoc._id : null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/history/serviceHistory
exports.getAllHistories = async (req, res, next) => {
  try {
    const histories = await History.find().lean();
    res.status(200).json(histories);
  } catch (err) {
    next(err);
  }
};
