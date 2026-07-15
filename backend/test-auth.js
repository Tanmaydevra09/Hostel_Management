const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET);
console.log("Token:", token);

const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log("Decoded:", decoded);

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('Not authenticated');
      return;
    }
    if (!roles.includes(req.user.role)) {
      console.log(`Access denied. Required role: ${roles.join(' or ')}.`);
      console.log(`User role was: ${req.user.role}`);
      return;
    }
    console.log('Authorized');
  };
};

authorize('admin', 'warden')({ user: decoded }, null, () => {});
