const { checkSchema } = require("express-validator");

exports.addServiceSchema = checkSchema({
  serviceId: {
    in: ["body"],
    notEmpty: { errorMessage: "serviceId is required" },
    isMongoId: { errorMessage: "serviceId must be a valid ObjectId" },
  },
  paymentStatus: {
    in: ["body"],
    notEmpty: { errorMessage: "paymentStatus is required" },
    isIn: {
      options: [["Paid", "Unpaid"]],
      errorMessage: "paymentStatus must be either Paid or Unpaid",
    },
  },
  cost: {
    in: ["body"],
    optional: true,
    isNumeric: { errorMessage: "cost must be a number" },
    toFloat: true,
  },
});
