module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true },
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    data: { type: DataTypes.JSON, allowNull: true }
  }, {
    tableName: 'notifications',
    underscored: true
  });

  return Notification;
};
