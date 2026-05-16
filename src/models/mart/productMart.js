const { OrderMart, OrderItemMart } = require("../index");

module.exports = (sequelize, DataTypes) => {
  const ProductMart = sequelize.define(
    "ProductMart",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      }
    },
    {
      tableName: "products_mart",
      timestamps: true,
      underscored: true,
    }
  );
  ProductMart.associate = (models) => {
  ProductMart.belongsToMany(OrderMart, {
    through: OrderItemMart,
    foreignKey: 'product_id',
    otherKey: 'order_id',
    as: 'ordersMart'
  });
};
  return ProductMart;
};
