'use strict';

const tenantScope = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Tenant context not available.',
    });
  }

  
  req.tenantId = req.user.tenantId;
  next();
};

module.exports = { tenantScope };
