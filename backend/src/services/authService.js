'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/app');
const { User, RefreshToken, Tenant, RolePermission } = require('../models');
const { Op } = require('sequelize');

class AuthService {
  

  async login(email, password, tenantName) {
    const tenant = await Tenant.findOne({ where: { name: tenantName, is_active: true } });
    if (!tenant) {
      throw Object.assign(new Error('Business not found or inactive.'), { statusCode: 404 });
    }

    const user = await User.findOne({
      where: { email, business_id: tenant.id, is_active: true },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
    }

    
    const rolePerms = await RolePermission.findAll({
      where: { role: user.role, business_id: user.business_id }
    });
    
    
    const permissions = rolePerms.map(rp => rp.permission);

    
    const accessToken = this.generateAccessToken(user, tenant);
    const refreshToken = await this.generateRefreshToken(user.id, user.business_id);

    const safeUser = user.toSafeJSON();
    safeUser.roles = [user.role];
    safeUser.permissions = permissions;

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: safeUser,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        currency: 'LKR',
      },
    };
  }

  

  generateAccessToken(user, tenant) {
    return jwt.sign(
      {
        userId: user.id,
        tenantId: user.business_id,
        email: user.email,
        role: user.role,
        tenantName: tenant.name,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
  }

  

  async generateRefreshToken(userId, businessId) {
    const token = jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    const refreshToken = await RefreshToken.create({
      user_id: userId,
      business_id: businessId,
      token,
      expires_at: expiresAt,
      is_revoked: false,
    });

    return refreshToken;
  }

  

  async refreshAccessToken(refreshTokenStr) {
    let decoded;
    try {
      decoded = jwt.verify(refreshTokenStr, config.jwt.refreshSecret);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401 });
    }

    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshTokenStr,
        user_id: decoded.userId,
        is_revoked: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!storedToken) {
      throw Object.assign(new Error('Refresh token not found or revoked.'), { statusCode: 401 });
    }

    const user = await User.findOne({
      where: { id: decoded.userId, is_active: true }
    });
    
    if (!user) {
      throw Object.assign(new Error('User not found.'), { statusCode: 401 });
    }
    
    const tenant = await Tenant.findOne({ where: { id: user.business_id } });

    if (!tenant) {
      throw Object.assign(new Error('Tenant not found.'), { statusCode: 401 });
    }

    const accessToken = this.generateAccessToken(user, tenant);
    return { accessToken };
  }

  

  async logout(userId, refreshTokenStr) {
    if (refreshTokenStr) {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId, token: refreshTokenStr } }
      );
    }
  }

  

  async revokeAllTokens(userId) {
    await RefreshToken.update(
      { is_revoked: true },
      { where: { user_id: userId, is_revoked: false } }
    );
  }
}

module.exports = new AuthService();
