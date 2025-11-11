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
    const { type, make, model, year, VIN, LastServiceDate } = req.body;

    if (!make || !brands.includes(make)) {
      const err = new Error("Service not available for this brand");
      err.statusCode = 400;
      return next(err);
    }

    if (!type) {
      const err = new Error("Vehicle type is required");
      err.statusCode = 400;
      return next(err);
    }

    const normalizedType =
      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    if (!vehicleTypes.includes(normalizedType)) {
      const err = new Error("Service not available for this vehicle type");
      err.statusCode = 400;
      return next(err);
    }

    function convertDDMMYYYYtoISO(dateStr) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        return `${yyyy}-${mm}-${dd}`;
      }
      return dateStr;
    }

    const isoDateStr = LastServiceDate
      ? convertDDMMYYYYtoISO(LastServiceDate)
      : null;
    const parsedDate = isoDateStr ? new Date(isoDateStr) : null;
    console.log("Parsed LastServiceDate:", parsedDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate && (isNaN(parsedDate.getTime()) || parsedDate > today)) {
      return res
        .status(400)
        .json({ message: "Invalid or future last service date" });
    }

    if (!VIN) {
      const err = new Error("VIN is required");
      err.statusCode = 400;
      return next(err);
    }

    const existing = await Vehicle.findOne({ VIN });
    if (existing) {
      const err = new Error("Vehicle with this VIN already exists");
      err.statusCode = 400;
      return next(err);
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

// GET
exports.getVehicle = async (req, res, next) => {
  try {
    const vin = req.params.id;
    const vehicle = await Vehicle.findOne({ VIN: vin }).lean();

    if (!vehicle) {
      const err = new Error("Vehicle not found");
      err.statusCode = 400;
      return next(err);
    }

    if (
      !brands.includes(vehicle.make) ||
      !vehicleTypes.includes(vehicle.type)
    ) {
      const err = new Error("Vehicle type or brand not supported");
      err.statusCode = 400;
      return next(err);
    }

    res.status(200).json(vehicle);
  } catch (err) {
    next(err);
  }
};
