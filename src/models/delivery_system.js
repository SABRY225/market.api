module.exports = (sequelize, DataTypes) => {
  const DeliverSystem = sequelize.define('DeliverSystem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        type: {  type: DataTypes.ENUM(
          "price", 
          "distance", 
        ),
        allowNull: false,
        defaultValue: "price"
    },
    CostperOrder:{type: DataTypes.INTEGER,allowNull: true },
    Costperkilometer:{type: DataTypes.INTEGER,allowNull: true }
  }, {
    tableName: 'deliver_system',
    underscored: true
  });
  return DeliverSystem;
};
