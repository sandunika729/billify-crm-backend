const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    sku: {
      type: DataTypes.STRING,
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    item_code: {
      type: DataTypes.STRING,
    },
    brand: {
      type: DataTypes.STRING,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    cost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    stock_qty: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    reserved_qty: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    reorder_level: {
      type: DataTypes.FLOAT,
      defaultValue: 10,
    },
    item_type: {
      type: DataTypes.STRING,
      defaultValue: 'PRODUCT',
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tax_rate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'Pcs',
    },
    wholesale_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    discount_percentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    discount_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    }
  }, {
    tableName: 'products',
    timestamps: true,
    paranoid: false,       
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Product;
};
