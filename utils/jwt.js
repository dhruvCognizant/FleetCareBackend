const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const SECRET = process.env.JWT_SECRET || 'fallback_secret';
const expiresIn = process.env.JWT_EXPIRES_IN;

function generateToken(user) {
  const jti = uuidv4();
  return jwt.sign({ id: user.id, role: user.role, jti }, SECRET, { expiresIn }); 
}

module.exports = { generateToken };
