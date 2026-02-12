module.exports = (sequelize, DataTypes) => {
  const VendorWithdrawal = sequelize.define('VendorWithdrawal', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    vendor_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM('pending','approved','rejected'), allowNull: false, defaultValue: 'pending' },
    note: { type: DataTypes.TEXT, allowNull: true },
    processed_by: { type: DataTypes.INTEGER, allowNull: true },
    processed_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'vendor_withdrawals',
    timestamps: true,
    underscored: true,
  });

  return VendorWithdrawal;
};
