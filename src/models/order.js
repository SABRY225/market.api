module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      delivery_id: { type: DataTypes.INTEGER, allowNull: true },
      vendor_id: { type: DataTypes.INTEGER, allowNull: true },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "processing",
          "searching",
          "shipped",
          "delivered",
          "cancelled",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      serviceFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },

      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      deliveryTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      delivery_status:{
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      underscored: true,
    },
  );

  return Order;
};
