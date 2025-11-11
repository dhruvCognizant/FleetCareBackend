const Vehicle = require("../models/Vehicle");
const Service = require("../models/Service");

const pad = (num) => String(num).padStart(3, "0");

// POST /api/vehicles/new/odometer
exports.addOdometerReading = async (req, res, next) => {
  try {
    const { mileage, serviceType } = req.body;
    const vin = req.params.id;

    if (typeof mileage !== "number") {
      const err = new Error("mileage must be a number");
      err.statusCode = 400;
      return next(err);
    }

    const vehicle = await Vehicle.findOne({ VIN: vin });
    if (!vehicle) {
      const err = new Error("Vehicle VIN does not exist.");
      err.statusCode = 400;
      return next(err);
    }

    let latest = null;
    if (vehicle.odometerReadings && vehicle.odometerReadings.length > 0) {
      latest = vehicle.odometerReadings.reduce((a, b) =>
        new Date(a.date) > new Date(b.date) ? a : b
      );
    }

    const now = new Date();

    if (latest) {
      if (mileage <= latest.mileage) {
        const err = new Error(
          "Mileage must be greater than the last recorded value."
        );
        err.statusCode = 400;
        return next(err);
      }
      if (now < new Date(latest.date)) {
        const err = new Error("Request can't be processed right now.");
        err.statusCode = 400;
        return next(err);
      }
    }

    const increment =
      vehicle.type && String(vehicle.type).toLowerCase() === "truck"
        ? 20000
        : 10000;
    const computedNextServiceMileage = mileage + increment;

    const existingUnpaidService = await Service.findOne({
      vehicleVIN: vin,
      status: { $ne: "Completed" },
      $or: [
        { "payment.paymentStatus": { $exists: false } },
        { "payment.paymentStatus": { $ne: "Paid" } },
      ],
    });

    if (existingUnpaidService) {
      const err = new Error(
        "Existing unpaid service present; cannot add odometer reading until service is paid or completed"
      );
      err.statusCode = 400;
      err.serviceId = existingUnpaidService._id;
      return next(err);
    }

    const nextIndex =
      vehicle.odometerReadings && vehicle.odometerReadings.length
        ? vehicle.odometerReadings.length + 1
        : 1;
    const newReadingId = "R" + pad(nextIndex);
    const newReading = { readingId: newReadingId, mileage, date: now };

    let createdService = null;
    const hasNextServiceMileage =
      vehicle.nextServiceMileage !== undefined &&
      vehicle.nextServiceMileage !== null &&
      vehicle.nextServiceMileage !== 0;

    if (!hasNextServiceMileage) {
      if (mileage <= 0) {
        const err = new Error("Invalid mileage for initial reading");
        err.statusCode = 400;
        return next(err);
      }

      if (!serviceType || !String(serviceType).trim()) {
        const err = new Error(
          "serviceType is required when creating an initial service"
        );
        err.statusCode = 400;
        return next(err);
      }

      const svcType = String(serviceType).trim();
      const svc = new Service({
        vehicleVIN: vin,
        serviceType: svcType,
        status: "Unassigned",
        createdAt: now,
        readingId: newReading.readingId,
      });
      createdService = await svc.save();

      vehicle.odometerReadings = vehicle.odometerReadings || [];
      vehicle.odometerReadings.push(newReading);
      vehicle.nextServiceMileage = computedNextServiceMileage;
    } else {
      if (mileage < vehicle.nextServiceMileage) {
        const err = new Error(
          "Mileage is less than nextServiceMileage; reading not added until due"
        );
        err.statusCode = 400;
        return next(err);
      }

      if (!serviceType || !String(serviceType).trim()) {
        const err = new Error(
          "serviceType is required when mileage meets or exceeds nextServiceMileage"
        );
        err.statusCode = 400;
        return next(err);
      }

      const svcType = String(serviceType).trim();
      const svc = new Service({
        vehicleVIN: vin,
        serviceType: svcType,
        status: "Unassigned",
        createdAt: now,
        readingId: newReading.readingId,
      });
      createdService = await svc.save();

      vehicle.odometerReadings = vehicle.odometerReadings || [];
      vehicle.odometerReadings.push(newReading);
      vehicle.nextServiceMileage = computedNextServiceMileage;
    }

    await vehicle.save();

    const resp = {
      reading: newReading,
      nextServiceMileage: vehicle.nextServiceMileage,
    };
    if (createdService) {
      resp.serviceId = createdService._id;
    }

    res.status(200).json(resp);
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles/new/odometer
exports.getodometerReading = async (req, res, next) => {
  try {
    const vin = req.params.id;

    const vehicle = await Vehicle.findOne({ VIN: vin }).lean();

    if (!vehicle) {
      const err = new Error("Vehicle not found.");
      err.statusCode = 400;
      return next(err);
    }

    const readings = vehicle.odometerReadings || [];

    res.status(200).json(readings);
  } catch (err) {
    next(err);
  }
};
