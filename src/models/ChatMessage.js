module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
     order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER, // معرف المستخدم (عميل أو مندوب)
      allowNull: false
    },
    sender_type: {
      type: DataTypes.ENUM('customer', 'delivery'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    underscored: true,
  });

  return ChatMessage;
};
