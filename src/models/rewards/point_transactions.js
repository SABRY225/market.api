module.exports = (sequelize, DataTypes) => {
  const PointTransactions = sequelize.define('PointTransactions', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER },
    transaction_type: { type: DataTypes.STRING(100)},
    description: { type: DataTypes.STRING(255), allowNull: false },
  }, {
    tableName: 'point_transactions',
    timestamps: true,
    underscored: true,
  });

  return PointTransactions;
};
