const express = require('express');
const passport = require('passport');
const router = express.Router();

const authController = require('../controllers/authController');
const { validateLogin } = require('../validator/authValidator');
const { validationResult } = require('express-validator');
const { authorize } = require('../middlewares/roleMiddleware');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/login', validateLogin, handleValidation, authController.login);

router.post(
  '/logout',
  authController.logout
);

module.exports = router;
