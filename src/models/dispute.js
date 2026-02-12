module.exports = (sequelize, DataTypes) => {
  const Dispute = sequelize.define('Dispute', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('open','investigating','resolved','rejected'), allowNull: false, defaultValue: 'open' },
  }, {
    tableName: 'disputes',
    timestamps: true,
    underscored: true,
  });

  return Dispute;
};
