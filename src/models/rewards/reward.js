module.exports = (sequelize, DataTypes) => {
  const Reward = sequelize.define('Reward', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    points_required: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'reward',
    timestamps: true,
    underscored: true,
  });

  return Reward;
};
