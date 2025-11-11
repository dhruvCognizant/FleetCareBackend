const { checkSchema } = require('express-validator');

exports.createAssignmentSchema = checkSchema({
  serviceId: {
    in: ['body'],
    exists: {
      errorMessage: 'Service ID is required',
    },
    isMongoId: {
      errorMessage: 'Service ID must be a valid MongoDB ObjectId',
    },
  },
});

exports.updateAssignmentStatusSchema = checkSchema({
  status: {
    in: ['body'],
    exists: {
      errorMessage: 'Status is required',
    },
    isString: {
      errorMessage: 'Status must be a string',
    },
    isIn: {
      options: [['Assigned', 'Completed', 'In Progress', 'Pending']],
      errorMessage: 'Status must be one of: Assigned, Completed, In Progress, Pending',
    },
  },
  id: {
    in: ['params'],
    isMongoId: {
      errorMessage: 'Service ID in URL must be a valid MongoDB ObjectId',
    },
  },
});
