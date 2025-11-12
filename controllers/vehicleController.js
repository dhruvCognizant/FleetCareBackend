const Vehicle = require("../models/Vehicle");
const Service = require("../models/Service");

const brands = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Hyundai",
  "Kia",
  "Volkswagen",
  "Nissan",
  "Tata",
  "Mahindra",
  "Suzuki",
  "Renault",
];
const vehicleTypes = ["Car", "Truck"];

// POST /api/vehicles
exports.createVehicle = async (req, res, next) => {
  try {
    const { type, make, model, year, VIN, lastServiceDate } = req.body;

    if (!make || !brands.includes(make)) {
      return res
        .status(400)
        .json({ message: "Service not available for this brand" });
    }

    if (!type) {
      return res.status(400).json({ message: "Vehicle type is required" });
    }

    const normalizedType =
      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    if (!vehicleTypes.includes(normalizedType)) {
      return res
        .status(400)
        .json({ message: "Service not available for this vehicle type" });
    }

    const parsedDate = lastServiceDate ? new Date(lastServiceDate) : null;
    if (parsedDate) {
      parsedDate.setHours(0, 0, 0, 0);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate && (isNaN(parsedDate.getTime()) || parsedDate > today)) {
      return res
        .status(400)
        .json({ message: "Invalid or future last service date" });
    }

    if (!VIN) {
      return res.status(400).json({ message: "VIN is required" });
    }

    const existing = await Vehicle.findOne({ VIN });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Vehicle with this VIN already exists" });
    }

    const vehicleDoc = new Vehicle({
      VIN,
      type: normalizedType,
      make,
      model,
      year,
      lastServiceDate: parsedDate || null,
      odometerReadings: [],
      serviceDetails: [],
    });

    const saved = await vehicleDoc.save();
    res.status(200).json(saved);
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find().lean();

    const filtered = vehicles.filter(
      (v) => brands.includes(v.make) && vehicleTypes.includes(v.type)
    );

    if (filtered.length === 0) {
      return res.status(200).json([]);
    }

    const enriched = await Promise.all(
      filtered.map(async (v) => {
        const unpaid = await Service.findOne({
          vehicleVIN: v.VIN,
          status: { $ne: "Completed" },
          $or: [
            { "payment.paymentStatus": { $exists: false } },
            { "payment.paymentStatus": { $ne: "Paid" } },
          ],
        }).lean();

        return {
          ...v,
          nextServiceMileage:
            v.nextServiceMileage !== undefined && v.nextServiceMileage !== null
              ? v.nextServiceMileage
              : null,
          hasOpenUnpaidService: Boolean(unpaid),
        };
      })
    );

    res.status(200).json(enriched);
  } catch (err) {
    next(err);
  }
};
