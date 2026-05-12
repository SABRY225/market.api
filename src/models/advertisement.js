module.exports = (sequelize, DataTypes) => {
  const Advertisement = sequelize.define(
    "Advertisement",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      owner: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      price: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      counterClick:{
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "advertisements",
      timestamps: true,
      underscored: true,
    }
  );
  return Advertisement;
};
