module.exports = (sequelize, DataTypes) => {
  const InvitationSystem = sequelize.define('InvitationSystem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    points: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'invitation_system',
    underscored: true
  });
  return InvitationSystem;
};
