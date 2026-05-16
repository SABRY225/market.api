module.exports = (sequelize, DataTypes) => {
  const OrderItemMart = sequelize.define(
    "OrderItemMart",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'order_id',
        references: {
          model: 'orders_mart',
          key: 'id'
        }
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id',
        references: {
          model: 'products_mart',
          key: 'id'
        }
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      }
    },
    {
      tableName: "order_items_mart",
      timestamps: true,
      underscored: true,
    }
  );

  return OrderItemMart;
};