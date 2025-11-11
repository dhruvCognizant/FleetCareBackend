const headerSet = (req, res, next) => { 
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://trusted.cdn.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';");
  next();
};

module.exports = {headerSet };