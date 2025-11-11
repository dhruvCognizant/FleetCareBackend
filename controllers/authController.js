const Credential = require("../models/Credential");
const RevokedToken = require("../models/RevokedToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/jwt");

const SECRET = process.env.JWT_SECRET || "fallback_secret";

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password required");
      err.statusCode = 400;
      return next(err);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await Credential.findOne({ email: normalizedEmail });

    if (!user) {
      const err = new Error("Invalid credentials");
      err.statusCode = 400;
      return next(err);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid credentials");
      err.statusCode = 400;
      return next(err);
    }

    const token = generateToken({ id: user._id.toString(), role: user.role });

    res.json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
exports.logout = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const err = new Error("Missing token");
    err.statusCode = 400;
    return next(err);
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, SECRET);
    console.log("Decoded token:", decoded);

    await RevokedToken.create({
      jti: decoded.jti,
      expiresAt: new Date(decoded.exp * 1000),
    });

    console.log("Revoked token saved");
    res.json({ message: "Logout successful. Token revoked." });
  } catch (err) {
    err.statusCode = 400; 
    next(err);
  }
};
