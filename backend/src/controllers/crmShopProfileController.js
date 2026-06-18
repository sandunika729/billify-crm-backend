'use strict';

const crypto = require('crypto');
const { CrmShopProfile } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const crmShopProfileController = {
  async getProfile(req, res) {
    try {
      const profile = await CrmShopProfile.findOne({
        where: { tenant_id: req.tenantId },
      });
      return sendSuccess(res, profile ? profile.toJSON() : null, 'Shop profile retrieved.');
    } catch (error) {
      console.error('Error fetching shop profile:', error);
      return sendError(res, error.message || 'Failed to fetch shop profile.', 500);
    }
  },

  async upsertProfile(req, res) {
    try {
      const { shop_name, email, phone, address, logo_base64 } = req.body;

      const [profile, created] = await CrmShopProfile.findOrCreate({
        where: { tenant_id: req.tenantId },
        defaults: {
          tenant_id: req.tenantId,
          shop_name, email, phone, address, logo_base64,
          
          public_api_key: crypto.randomBytes(32).toString('hex'),
        },
      });

      if (!created) {
        const updateData = {};
        if (shop_name !== undefined) updateData.shop_name = shop_name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (logo_base64 !== undefined) updateData.logo_base64 = logo_base64;
        
        
        if (!profile.public_api_key) {
          updateData.public_api_key = crypto.randomBytes(32).toString('hex');
        }

        await profile.update(updateData);
        await profile.reload();
      }

      return sendSuccess(res, profile.toJSON(), created ? 'Shop profile created.' : 'Shop profile updated.');
    } catch (error) {
      console.error('Error saving shop profile:', error);
      return sendError(res, error.message || 'Failed to save shop profile.', 500);
    }
  },

  
  async regenerateKey(req, res) {
    try {
      const profile = await CrmShopProfile.findOne({ where: { tenant_id: req.tenantId } });
      if (!profile) {
        return sendError(res, 'Shop profile not found. Please save your profile first.', 404);
      }
      const newKey = crypto.randomBytes(32).toString('hex');
      await profile.update({ public_api_key: newKey });
      return sendSuccess(res, { public_api_key: newKey }, 'API key regenerated successfully.');
    } catch (error) {
      console.error('Error regenerating key:', error);
      return sendError(res, error.message || 'Failed to regenerate key.', 500);
    }
  },
};

module.exports = crmShopProfileController;
