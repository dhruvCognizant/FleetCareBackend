const { checkSchema } = require("express-validator");

exports.odometerSchema = checkSchema({
  mileage: {
    in: ["body"],
    isNumeric: {
      errorMessage: "Mileage must be a number",
    },
    toInt: true,
  },
  serviceType: {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "Service type must be a string",
    },
    trim: true,
    isIn: {
      options: [["Oil Change", "Brake Repair", "Battery Test"]],
      errorMessage:
        "Service type must be one of Oil Change, Brake Repair, Battery Test",
    },
  },
  id: {
    in: ["params"],
    notEmpty: {
      errorMessage: "VIN is required in URL",
    },
    isLength: {
      options: { min: 5 },
      errorMessage: "VIN must be at least 5 characters",
    },
  },
});
