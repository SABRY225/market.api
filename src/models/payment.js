module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    method: { type: DataTypes.STRING(50), allowNull: true },
    status: { type: DataTypes.ENUM('pending','paid','failed','refunded'), allowNull: false, defaultValue: 'pending' },
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
  });

  return Payment;
};
