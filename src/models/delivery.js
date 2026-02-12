module.exports = (sequelize, DataTypes) => {
  const Delivery = sequelize.define('delivery', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'deliveries',
    timestamps: true,
    underscored: true,
  });

  return  Delivery;
};
