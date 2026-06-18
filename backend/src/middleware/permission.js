'use strict';

const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    
    if (req.user.roles && (req.user.roles.includes('super_admin') || req.user.roles.includes('admin'))) {
      return next();
    }

    const requiredPermission = `crm_${module}_${action}`;

    if (!req.user.permissions || !req.user.permissions.has(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${requiredPermission}`,
      });
    }

    next();
  };
};

const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.roles && (req.user.roles.includes('super_admin') || req.user.roles.includes('admin'))) {
      return next();
    }

    const hasPermission = permissions.some(({ module, action }) =>
      req.user.permissions && req.user.permissions.has(`crm_${module}_${action}`)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

module.exports = { requirePermission, requireAnyPermission };
