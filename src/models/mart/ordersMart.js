const { ProductMart, OrderItemMart } = require("../index");

module.exports = (sequelize, DataTypes) => {
  const OrderMart = sequelize.define(
    "OrderMart",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customer: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'total_price'
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Processing', 'Delivery Available', 'Completed', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      deliveryMan: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Not yet determined',
        field: 'delivery_man'
      }
    },
    {
      tableName: "orders_mart",
      timestamps: true,
      underscored: true, 
    }
  );

  OrderMart.associate = (models) => {
    OrderMart.belongsToMany(ProductMart, {
      through: OrderItemMart,
      foreignKey: 'order_id',
      otherKey: 'product_id',
      as: 'productsMart'
    });
  };

  return OrderMart;
};