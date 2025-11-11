const { checkSchema } = require("express-validator");

exports.validateVehicle = checkSchema({
  type: {
    in: ["body"],
    isString: { errorMessage: "Type must be a string" },
    isIn: {
      options: [["Car", "Truck"]],
      errorMessage: "Invalid vehicle type",
    },
  },
  make: {
    in: ["body"],
    isString: { errorMessage: "Make must be a string" },
    isIn: {
      options: [
        [
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
        ],
      ],
      errorMessage: "Unsupported brand",
    },
  },
  model: {
    in: ["body"],
    isString: { errorMessage: "Model must be a string" },
    notEmpty: { errorMessage: "Model is required" },
  },
  year: {
    in: ["body"],
    isInt: {
      options: { min: 2000 },
      errorMessage: "Year must be an integer >= 2000",
    },
  },
  VIN: {
    in: ["body"],
    isString: { errorMessage: "VIN must be a string" },
    notEmpty: { errorMessage: "VIN is required" },
  },
  LastServiceDate: {
    in: ["body"],
    optional: true,
    custom: {
      options: (value) => {
        const date = new Date(value);
        if (!value || !date || isNaN(date)) return true;
        if (date > new Date()) throw new Error("Date cannot be in the future");
        return true;
      },
    },
  },
});
