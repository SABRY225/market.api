module.exports = (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define('SupportTicket', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    owner_id: { type: DataTypes.INTEGER, allowNull: false },
    owner_type: { type: DataTypes.STRING(50), allowNull: false },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('open','pending','closed'), allowNull: false, defaultValue: 'open' },
  }, {
    tableName: 'support_tickets',
    timestamps: true,
    underscored: true,
  });

  return SupportTicket;
};
