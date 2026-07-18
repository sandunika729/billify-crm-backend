'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, RolePermission, sequelize } = require('../models');
const { isValidEmail, isValidPhone } = require('../utils/validators');
const { Op } = require('sequelize');

const CRM_ROLES = [
  'super_admin',
  'admin',
  'sales_manager',
  'sales_user',
  'support_manager',
  'support_agent',
  'accountant',
  'read_only',
];

const crmUserService = {
  
  async getAllUsers(tenantId) {
    const users = await User.findAll({
      where: { business_id: tenantId },
      attributes: [
        'id', 'first_name', 'last_name', 'email',
        'role', 'phone', 'is_active', 'status',
        'created_at', 'updated_at',
      ],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });

    return users.map(u => ({
      id: u.id,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      email: u.email,
      role: u.role,
      role_label: formatRoleLabel(u.role),
      phone: u.phone || '',
      is_active: u.is_active,
      status: u.status || (u.is_active ? 'active' : 'inactive'),
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
  },

  
  async createUser({ tenantId, data, createdBy }) {
    const { first_name, last_name, email, phone, role, password } = data;

    
    if (!email || !email.trim()) throw new Error('Email is required.');
    if (!isValidEmail(email)) throw new Error('Invalid email format.');
    if (!isValidPhone(phone)) throw new Error('Invalid phone format.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!role || !CRM_ROLES.includes(role)) throw new Error(`Invalid role. Must be one of: ${CRM_ROLES.join(', ')}`);

    
    const existing = await User.findOne({
      where: { email: email.trim().toLowerCase(), business_id: tenantId },
    });
    if (existing) throw new Error('A user with this email already exists in your workspace.');

    
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      id: uuidv4(),
      business_id: tenantId,
      first_name: first_name?.trim() || '',
      last_name: last_name?.trim() || '',
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      role: role,
      password: hashedPassword,
      is_active: true,
      status: 'active',
    });

    return {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      name: `${newUser.first_name} ${newUser.last_name}`.trim(),
      email: newUser.email,
      role: newUser.role,
      role_label: formatRoleLabel(newUser.role),
      phone: newUser.phone || '',
      is_active: newUser.is_active,
      status: 'active',
      created_at: newUser.created_at,
    };
  },

  
  async updateUser(userId, tenantId, data) {
    const user = await User.findOne({ where: { id: userId, business_id: tenantId } });
    if (!user) throw new Error('User not found.');

    const { first_name, last_name, phone, role } = data;

    if (role && !CRM_ROLES.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${CRM_ROLES.join(', ')}`);
    }

    if (phone !== undefined && !isValidPhone(phone)) {
      throw new Error('Invalid phone format.');
    }

    const before = {
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
    };

    await user.update({
      first_name: first_name !== undefined ? first_name.trim() : user.first_name,
      last_name: last_name !== undefined ? last_name.trim() : user.last_name,
      phone: phone !== undefined ? (phone.trim() || null) : user.phone,
      role: role || user.role,
    });

    return {
      before,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        role: user.role,
        role_label: formatRoleLabel(user.role),
        phone: user.phone || '',
        is_active: user.is_active,
        status: user.status,
      },
    };
  },

  
  async deactivateUser(userId, tenantId, requestingUserId) {
    if (userId === requestingUserId) {
      throw new Error('You cannot deactivate your own account.');
    }

    const user = await User.findOne({ where: { id: userId, business_id: tenantId } });
    if (!user) throw new Error('User not found.');

    if (user.role === 'super_admin') {
      throw new Error('The Super Admin account cannot be deactivated.');
    }

    await user.update({ is_active: false, status: 'inactive' });

    return { id: user.id, email: user.email, status: 'inactive' };
  },

  
  async reactivateUser(userId, tenantId) {
    const user = await User.findOne({ where: { id: userId, business_id: tenantId } });
    if (!user) throw new Error('User not found.');

    await user.update({ is_active: true, status: 'active' });
    return { id: user.id, email: user.email, status: 'active' };
  },

  
  async resetPassword(userId, tenantId, newPassword, requestingUserId) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const user = await User.findOne({ where: { id: userId, business_id: tenantId } });
    if (!user) throw new Error('User not found.');

    
    if (user.role === 'super_admin') {
      const requestingUser = await User.findOne({ where: { id: requestingUserId } });
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        throw new Error('Only a Super Admin can reset another Super Admin\'s password.');
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    return { id: user.id, email: user.email, message: 'Password reset successfully.' };
  },
};

function formatRoleLabel(role) {
  if (!role) return 'Unknown';
  return role
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

module.exports = crmUserService;
