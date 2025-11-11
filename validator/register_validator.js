const { checkSchema } = require("express-validator");

exports.createTechnicianSchema = checkSchema({
  firstName: {
    in: ["body"],
    exists: { errorMessage: "First name is required" },
    isString: { errorMessage: "First name must be a string" },
    trim: true,
  },
  lastName: {
    in: ["body"],
    exists: { errorMessage: "Last name is required" },
    isString: { errorMessage: "Last name must be a string" },
    trim: true,
  },
  email: {
    in: ["body"],
    exists: { errorMessage: "Email is required" },
    isEmail: { errorMessage: "Email must be valid" },
    normalizeEmail: true,
    custom: {
      options: (value) => {
        if (!value.toLowerCase().endsWith("@fleet.com")) {
          throw new Error("Email must end with @fleet.com");
        }
        return true;
      },
    },
  },

  password: {
    in: ["body"],
    notEmpty: { errorMessage: "Password is required" },
    isString: { errorMessage: "Password must be a string" },
    matches: {
      options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/],
      errorMessage:
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character",
    },
  },
  skills: {
    in: ["body"],
    optional: true,
    custom: {
      options: (value) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "string") return value.trim().length > 0;
        throw new Error(
          "Skills must be a non-empty array or comma-separated string"
        );
      },
    },
  },
  availability: {
    in: ["body"],
    exists: { errorMessage: "Availability is required" },
    custom: {
      options: (value) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "string") return value.trim().length > 0;
        throw new Error(
          "Availability must be a non-empty array or comma-separated string"
        );
      },
    },
  },
  isAssigned: {
    in: ["body"],
    optional: true,
    isBoolean: { errorMessage: "isAssigned must be a boolean" },
  },
});
