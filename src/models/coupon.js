module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    vendor_id: { type: DataTypes.INTEGER, allowNull: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    discount: { type: DataTypes.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'coupons',
    timestamps: true,
    underscored: true,
  });

  return Coupon;
};
