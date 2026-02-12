module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    delivery_id: { type: DataTypes.INTEGER, allowNull: true },
    vendor_id: { type: DataTypes.INTEGER, allowNull: true },
    total: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending','confirmed','processing','shipped','delivered','cancelled'), allowNull: false, defaultValue: 'pending' },
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
  });

  return Order;
};
