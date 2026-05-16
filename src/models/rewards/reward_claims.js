module.exports = (sequelize, DataTypes) => {
  const RewardClaims = sequelize.define('RewardClaims', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER },
    reward_id: { type: DataTypes.INTEGER },
    points_spent: { type: DataTypes.INTEGER},
    status: {  type: DataTypes.ENUM(
          "pending", // حالة المبدئية
          "approved", // تم الاستلام
          "cancelled", // ملغي
        ),
        allowNull: false,
        defaultValue: "pending"
    },
  }, {
    tableName: 'reward_claims',
    timestamps: true,
    underscored: true,
  });

  return RewardClaims;
};
