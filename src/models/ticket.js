// models/Ticket.js
module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define("Ticket", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "قيد المراجعة",
    },

    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: "tickets",
    underscored: true,
  });

  return Ticket;
};
