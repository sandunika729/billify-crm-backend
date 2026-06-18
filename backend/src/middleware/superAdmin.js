'use strict';

const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const role = req.user.role || (req.user.roles && req.user.roles[0]);
  if (role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only the Super Admin can perform this action.',
    });
  }

  next();
};

module.exports = { requireSuperAdmin };
