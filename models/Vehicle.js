const mongoose = require("mongoose");

const OdometerReadingSchema = new mongoose.Schema({
  readingId: { type: String },
  mileage: { type: Number, required: true },
  date: { type: Date, required: true },
});

const ServiceDetailSchema = new mongoose.Schema({
  serviceCompletedOn: { type: Date, required: true },
  serviceType: { type: String, required: true },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TechnicianRegister",
    required: true,
  },
});

const VehicleSchema = new mongoose.Schema({
  VIN: { type: String, unique: true, required: true },
  type: {
    type: String,
    required: true,
    enum: ["Car", "Truck"],
  },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  lastServiceDate: { type: Date, default: null },
  nextServiceMileage: { type: Number, default: null },
  dueServiceDate: { type: Date, default: null },
  ownerName: { type: String, default: "" },
  odometerReadings: [OdometerReadingSchema],
  serviceDetails: [ServiceDetailSchema],
});

module.exports = mongoose.model("Vehicle", VehicleSchema);
