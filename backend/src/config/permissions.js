const CRM_MODULES = {
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  LEADS: 'leads',
  DEALS: 'deals',
  QUOTES: 'quotes',
  TICKETS: 'tickets',
  SUPPORT_DASHBOARD: 'support_dashboard',
  INBOX: 'inbox',
  PAYMENTS: 'payments',
  PRODUCTS: 'products',
  DOCUMENTS: 'documents',
  ADMIN_ROLES: 'admin_roles',
  ADMIN_USERS: 'admin_users',
  AUDIT_LOGS: 'audit_logs',
  REPORTS: 'reports',
};

const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  ASSIGN: 'assign',
  APPROVE: 'approve',
};

const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: {
    
    ...Object.keys(CRM_MODULES).reduce((acc, mod) => {
      acc[CRM_MODULES[mod]] = Object.values(ACTIONS);
      return acc;
    }, {}),
  },

  admin: {
    [CRM_MODULES.DASHBOARD]: ['view'],
    [CRM_MODULES.CUSTOMERS]: ['view', 'create', 'update', 'delete', 'export'],
    [CRM_MODULES.LEADS]: ['view', 'create', 'update', 'delete', 'assign', 'export'],
    [CRM_MODULES.DEALS]: ['view', 'create', 'update', 'delete', 'assign', 'export'],
    [CRM_MODULES.QUOTES]: ['view', 'create', 'update', 'delete', 'approve', 'export'],
    [CRM_MODULES.TICKETS]: ['view', 'create', 'update', 'delete', 'assign'],
    [CRM_MODULES.SUPPORT_DASHBOARD]: ['view'],
    [CRM_MODULES.INBOX]: ['view', 'create'],
    [CRM_MODULES.PAYMENTS]: ['view'],
    [CRM_MODULES.PRODUCTS]: ['view'],
    [CRM_MODULES.DOCUMENTS]: ['view', 'create', 'update', 'delete'],
    [CRM_MODULES.ADMIN_ROLES]: ['view'],
    [CRM_MODULES.ADMIN_USERS]: ['view', 'create', 'update'],
    [CRM_MODULES.AUDIT_LOGS]: ['view'],
    [CRM_MODULES.REPORTS]: ['view', 'export'],
  },

  sales_manager: {
    [CRM_MODULES.DASHBOARD]: ['view'],
    [CRM_MODULES.CUSTOMERS]: ['view', 'create', 'update', 'export'],
    [CRM_MODULES.LEADS]: ['view', 'create', 'update', 'assign', 'export'],
    [CRM_MODULES.DEALS]: ['view', 'create', 'update', 'assign', 'export'],
    [CRM_MODULES.QUOTES]: ['view', 'create', 'update', 'approve', 'export'],
    [CRM_MODULES.PRODUCTS]: ['view'],
    [CRM_MODULES.REPORTS]: ['view', 'export'],
  },

  sales_user: {
    [CRM_MODULES.DASHBOARD]: ['view'],
    [CRM_MODULES.CUSTOMERS]: ['view', 'create', 'update'],
    [CRM_MODULES.LEADS]: ['view', 'create', 'update'],
    [CRM_MODULES.DEALS]: ['view', 'create', 'update'],
    [CRM_MODULES.QUOTES]: ['view', 'create', 'update'],
    [CRM_MODULES.PRODUCTS]: ['view'],
  },

  support_manager: {
    [CRM_MODULES.DASHBOARD]: ['view'],
    [CRM_MODULES.CUSTOMERS]: ['view'],
    [CRM_MODULES.TICKETS]: ['view', 'create', 'update', 'delete', 'assign'],
    [CRM_MODULES.SUPPORT_DASHBOARD]: ['view'],
    [CRM_MODULES.INBOX]: ['view', 'create'],
  },

  support_agent: {
    [CRM_MODULES.CUSTOMERS]: ['view'],
    [CRM_MODULES.TICKETS]: ['view', 'create', 'update'],
    [CRM_MODULES.INBOX]: ['view', 'create'],
  },

  accountant: {
    [CRM_MODULES.DASHBOARD]: ['view'],
    [CRM_MODULES.CUSTOMERS]: ['view'],
    [CRM_MODULES.PAYMENTS]: ['view', 'export'],
    [CRM_MODULES.QUOTES]: ['view'],
    [CRM_MODULES.REPORTS]: ['view', 'export'],
  },

  read_only: {
    [CRM_MODULES.DASHBOARD]: ['view'],
    [CRM_MODULES.CUSTOMERS]: ['view'],
    [CRM_MODULES.LEADS]: ['view'],
    [CRM_MODULES.DEALS]: ['view'],
    [CRM_MODULES.QUOTES]: ['view'],
    [CRM_MODULES.TICKETS]: ['view'],
    [CRM_MODULES.PAYMENTS]: ['view'],
  },
};

module.exports = {
  CRM_MODULES,
  ACTIONS,
  DEFAULT_ROLE_PERMISSIONS,
};
