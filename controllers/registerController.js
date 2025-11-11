const bcrypt = require("bcrypt");
const TechnicianModel = require("../models/TechnicianRegister");
const CredentialModel = require("../models/Credential");

// GET all technicians from MongoDB
exports.getTechnicians = async (req, res, next) => {
  try {
    const technicians = await TechnicianModel.find().lean();
    if (!technicians.length) {
      const err = new Error("No Technicians Available");
      err.statusCode = 400;
      return next(err);
    }

    const sanitized = technicians.map((tech) => {
      const copy = { ...tech };
      delete copy.password;
      return copy;
    });

    res.status(200).json(sanitized);
  } catch (err) {
    next(err);
  }
};

// POST /api/register
exports.createTechnician = async (req, res, next) => {
  console.log("POST /api/register called with body:", req.body);
  try {
    const {
      firstName,
      lastName,
      skills,
      availability,
      email,
      password,
      isAssigned,
    } = req.body;

    const emailLower = email.trim().toLowerCase();

    const existingCredential = await CredentialModel.findOne({
      email: emailLower,
    });
    if (existingCredential) {
      const err = new Error("User with this email already exists.");
      err.statusCode = 400;
      return next(err);
    }

    const skillsArray = Array.isArray(skills)
      ? skills.map((s) => s.trim())
      : [];

    const availabilityArray = Array.isArray(availability)
      ? availability.map((d) => d.trim().toLowerCase())
      : String(availability)
          .split(",")
          .map((d) => d.trim().toLowerCase());

    if (
      !firstName ||
      !lastName ||
      skillsArray.length === 0 ||
      availabilityArray.length === 0 ||
      !email ||
      !password
    ) {
      const err = new Error("Missing required fields");
      err.statusCode = 400;
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const credential = new CredentialModel({
      email: emailLower,
      password: hashedPassword,
      role: "technician",
    });
    await credential.save();

    const technician = new TechnicianModel({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailLower,
      skills: skillsArray,
      availability: availabilityArray,
      isAssigned: typeof isAssigned === "boolean" ? isAssigned : false,
      credential: credential._id,
    });

    const savedTechnician = await technician.save();

    const responseBody = savedTechnician.toObject();
    delete responseBody.credential;

    res.status(200).json({
      ...responseBody,
      role: "technician",
    });
  } catch (err) {
    next(err);
  }
};
