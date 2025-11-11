const passport = require("passport");

exports.authenticate = passport.authenticate("jwt", { session: false });

exports.authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user) return res.status(400).json({ error: "Unauthenticated" });
    if (req.user.role === "admin") return next();
    if (req.user.role !== role)
      return res.status(400).json({ error: `Access denied: ${role} only` });
    next();
  };
};

exports.authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(400).json({ error: "Unauthenticated" });
    if (req.user.role === "admin") return next();
    if (!roles.includes(req.user.role))
      return res.status(400).json({ error: "Access denied" });
    next();
  };
};
